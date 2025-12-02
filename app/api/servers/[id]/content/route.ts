import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { ServerContent } from '@/types';
import { logAction } from '@/lib/action-logger';
import { getServer } from '@/lib/exaroton';

/**
 * GET - Buscar conteúdo customizado do servidor
 */
export async function GET(
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

    // Buscar conteúdo do servidor
    const contentDoc = await adminDb().collection('serverContent').doc(serverId).get();
    
    if (!contentDoc.exists) {
      // Retornar conteúdo vazio se não existir
      return NextResponse.json({ 
        content: {
          serverId,
          documents: [],
        } 
      });
    }

    const content = contentDoc.data() as ServerContent;
    
    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error fetching server content:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch server content';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT - Atualizar conteúdo customizado do servidor
 */
export async function PUT(
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

    // Parse body
    const body = await request.json();
    const { accessInstructions, description, tags, customFields, bannerPosition } = body;

    // Validações
    if (accessInstructions && typeof accessInstructions !== 'string') {
      return NextResponse.json({ error: 'Invalid accessInstructions format' }, { status: 400 });
    }

    if (description && typeof description !== 'string') {
      return NextResponse.json({ error: 'Invalid description format' }, { status: 400 });
    }

    if (tags && !Array.isArray(tags)) {
      return NextResponse.json({ error: 'Invalid tags format' }, { status: 400 });
    }

    if (bannerPosition !== undefined && (typeof bannerPosition !== 'number' || bannerPosition < 0 || bannerPosition > 100)) {
      return NextResponse.json({ error: 'Invalid bannerPosition format (must be 0-100)' }, { status: 400 });
    }

    const contentRef = adminDb().collection('serverContent').doc(serverId);
    const contentDoc = await contentRef.get();
    
    const now = new Date();
    
    // Preparar dados para atualização
    const updateData: any = {
      serverId,
      updatedAt: now,
      lastEditedBy: userId,
    };

    if (accessInstructions !== undefined) {
      updateData.accessInstructions = accessInstructions;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (tags !== undefined) {
      updateData.tags = tags;
    }

    if (customFields !== undefined) {
      updateData.customFields = customFields;
    }

    if (bannerPosition !== undefined) {
      updateData.bannerPosition = bannerPosition;
    }

    // Se não existe, adicionar createdAt
    if (!contentDoc.exists) {
      updateData.createdAt = now;
      updateData.documents = [];
    }

    await contentRef.set(updateData, { merge: true });

    // Buscar conteúdo atualizado
    const updatedDoc = await contentRef.get();
    const content = updatedDoc.data() as ServerContent;

    // Get server name for logging
    let serverName = serverId;
    try {
      const server = await getServer(serverId);
      serverName = server?.name || serverId;
    } catch {
      // Continue with ID
    }

    // Determine what fields were updated
    const updatedFields = Object.keys(body).filter(k => body[k] !== undefined).join(', ');

    // Log the action
    await logAction({
      type: 'content_update',
      userId,
      userName: userData?.displayName || userData?.name || userData?.email || 'Unknown',
      userEmail: userData?.email || decodedToken.email || '',
      userPhotoUrl: userData?.photoURL,
      serverId,
      serverName,
      details: {
        fieldUpdated: updatedFields,
      },
      success: true,
    });

    return NextResponse.json({ success: true, content });
  } catch (error) {
    console.error('Error updating server content:', error);
    const message = error instanceof Error ? error.message : 'Failed to update server content';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH - Atualização parcial (útil para updates específicos)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Reusar lógica do PUT
  return PUT(request, { params });
}
