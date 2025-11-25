import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, adminStorage } from '@/lib/firebase-admin';
import Busboy from 'busboy';
import sharp from 'sharp';
import { Readable } from 'stream';

// Configurações de validação
const MAX_FILE_SIZE = {
  banner: 10 * 1024 * 1024, // 10MB para banner
  icon: 10 * 1024 * 1024, // 10MB para ícone
  document: 10 * 1024 * 1024, // 10MB para documentos
};

const ALLOWED_MIME_TYPES = {
  banner: ['image/jpeg', 'image/png', 'image/webp'],
  icon: ['image/jpeg', 'image/png', 'image/webp'],
  document: ['application/pdf'],
};

const IMAGE_DIMENSIONS = {
  banner: { width: 1200, height: 400 },
  icon: { width: 256, height: 256 },
};

/**
 * POST - Upload de arquivo (imagem ou documento)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serverId } = await params;
    
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Verificar acesso ao servidor
    const userDoc = await adminDb().collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    if (!userData?.isAdmin && !userData?.serverAccess?.includes(serverId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Parse multipart form data
    const contentType = request.headers.get('content-type') || '';
    const body = await request.arrayBuffer();
    
    const result = await parseMultipartForm(Buffer.from(body), contentType);
    
    if (!result.file || !result.type) {
      return NextResponse.json({ error: 'Missing file or type' }, { status: 400 });
    }

    const { file, filename, mimeType } = result.file;
    const uploadType = result.type as 'banner' | 'icon' | 'document';

    // Validar tipo MIME
    if (!ALLOWED_MIME_TYPES[uploadType]?.includes(mimeType)) {
      return NextResponse.json({ 
        error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES[uploadType]?.join(', ')}` 
      }, { status: 400 });
    }

    // Validar tamanho
    const maxSize = MAX_FILE_SIZE[uploadType];
    if (file.length > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Max size: ${maxSize / (1024 * 1024)}MB` 
      }, { status: 400 });
    }

    let processedFile = file;
    let finalFilename = filename;

    // Processar imagens
    if (uploadType === 'banner' || uploadType === 'icon') {
      const dimensions = IMAGE_DIMENSIONS[uploadType];
      processedFile = await sharp(file)
        .resize(dimensions.width, dimensions.height, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 85 })
        .toBuffer();
      
      finalFilename = `${uploadType}.webp`;
    }

    // Upload para Firebase Storage
    const storagePath = uploadType === 'document' 
      ? `servers/${serverId}/documents/${Date.now()}_${finalFilename}`
      : `servers/${serverId}/${finalFilename}`;
    
    const bucket = adminStorage().bucket();
    const fileRef = bucket.file(storagePath);
    
    await fileRef.save(processedFile, {
      metadata: {
        contentType: uploadType === 'document' ? mimeType : 'image/webp',
        metadata: {
          uploadedBy: userId,
          originalName: filename,
        },
      },
    });

    // Tornar arquivo público (ou gerar signed URL)
    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    // Atualizar Firestore serverContent
    const contentRef = adminDb().collection('serverContent').doc(serverId);
    const contentDoc = await contentRef.get();
    
    const now = new Date();
    
    if (uploadType === 'document') {
      // Adicionar documento à lista
      const documents = contentDoc.exists ? (contentDoc.data()?.documents || []) : [];
      documents.push({
        id: Date.now().toString(),
        name: filename,
        url: publicUrl,
        uploadedAt: now,
        uploadedBy: userId,
        size: file.length,
        type: mimeType,
      });
      
      await contentRef.set({
        serverId,
        documents,
        updatedAt: now,
        lastEditedBy: userId,
        ...(contentDoc.exists ? {} : { createdAt: now }),
      }, { merge: true });
    } else {
      // Atualizar URL de banner ou icon
      const fieldName = uploadType === 'banner' ? 'bannerUrl' : 'iconUrl';
      await contentRef.set({
        serverId,
        [fieldName]: publicUrl,
        updatedAt: now,
        lastEditedBy: userId,
        ...(contentDoc.exists ? {} : { createdAt: now }),
      }, { merge: true });
    }

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      type: uploadType,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload file';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE - Remover arquivo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serverId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'banner' | 'icon' | 'document';
    const documentId = searchParams.get('documentId');
    
    // Verificar autenticação
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Verificar acesso ao servidor
    const userDoc = await adminDb().collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    if (!userData?.isAdmin && !userData?.serverAccess?.includes(serverId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const contentRef = adminDb().collection('serverContent').doc(serverId);
    const contentDoc = await contentRef.get();
    
    if (!contentDoc.exists) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    }

    const content = contentDoc.data();
    const bucket = adminStorage().bucket();

    if (type === 'document' && documentId) {
      // Remover documento específico
      const documents = content?.documents || [];
      const doc = documents.find((d: any) => d.id === documentId);
      
      if (!doc) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }

      // Extrair path do URL
      const url = new URL(doc.url);
      const path = decodeURIComponent(url.pathname.split('/').slice(2).join('/'));
      
      // Deletar do Storage
      try {
        await bucket.file(path).delete();
      } catch (err) {
        console.error('Error deleting file from storage:', err);
      }

      // Remover da lista
      const updatedDocuments = documents.filter((d: any) => d.id !== documentId);
      await contentRef.update({
        documents: updatedDocuments,
        updatedAt: new Date(),
        lastEditedBy: userId,
      });
    } else if (type === 'banner' || type === 'icon') {
      // Remover banner ou icon
      const fieldName = type === 'banner' ? 'bannerUrl' : 'iconUrl';
      const fileUrl = content?.[fieldName];
      
      if (fileUrl) {
        // Extrair path do URL
        const url = new URL(fileUrl);
        const path = decodeURIComponent(url.pathname.split('/').slice(2).join('/'));
        
        // Deletar do Storage
        try {
          await bucket.file(path).delete();
        } catch (err) {
          console.error('Error deleting file from storage:', err);
        }

        // Remover URL do Firestore
        await contentRef.update({
          [fieldName]: null,
          updatedAt: new Date(),
          lastEditedBy: userId,
        });
      }
    } else {
      return NextResponse.json({ error: 'Invalid type or missing documentId' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete file';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Helper para fazer parse do multipart form data
 */
function parseMultipartForm(buffer: Buffer, contentType: string): Promise<{
  file?: { file: Buffer; filename: string; mimeType: string };
  type?: string;
}> {
  return new Promise((resolve, reject) => {
    const result: any = {};
    
    const busboy = Busboy({ headers: { 'content-type': contentType } });
    
    busboy.on('file', (fieldname, file, info) => {
      const { filename, mimeType } = info;
      const chunks: Buffer[] = [];
      
      file.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      file.on('end', () => {
        result.file = {
          file: Buffer.concat(chunks),
          filename,
          mimeType,
        };
      });
    });
    
    busboy.on('field', (fieldname, value) => {
      result[fieldname] = value;
    });
    
    busboy.on('finish', () => {
      resolve(result);
    });
    
    busboy.on('error', reject);
    
    // Converter Buffer para Stream
    const stream = Readable.from(buffer);
    stream.pipe(busboy);
  });
}
