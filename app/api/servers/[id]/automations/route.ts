import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { ServerAutomation, AutomationSequence } from '@/types';
import { FieldValue } from 'firebase-admin/firestore';

// GET - Obter automações do servidor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serverId } = await params;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
      decodedToken = await adminAuth().verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verificar se usuário é admin
    const userDoc = await adminDb().collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const isAdmin = userData?.isAdmin === true;

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Buscar automações do servidor
    const automationDoc = await adminDb()
      .collection('serverAutomations')
      .doc(serverId)
      .get();

    if (!automationDoc.exists) {
      // Retornar configuração padrão vazia
      const defaultAutomation: Partial<ServerAutomation> = {
        serverId,
        enabled: false,
        onStart: undefined,
        onStop: undefined,
      };
      return NextResponse.json({ automation: defaultAutomation });
    }

    const automationData = automationDoc.data();
    
    // Converter timestamps do Firestore
    const automation: ServerAutomation = {
      serverId,
      enabled: automationData?.enabled ?? false,
      onStart: automationData?.onStart ? convertTimestamps(automationData.onStart) : undefined,
      onStop: automationData?.onStop ? convertTimestamps(automationData.onStop) : undefined,
      onPlayerJoin: automationData?.onPlayerJoin ? convertTimestamps(automationData.onPlayerJoin) : undefined,
      onPlayerLeave: automationData?.onPlayerLeave ? convertTimestamps(automationData.onPlayerLeave) : undefined,
      createdAt: automationData?.createdAt?.toDate() || new Date(),
      updatedAt: automationData?.updatedAt?.toDate() || new Date(),
      lastEditedBy: automationData?.lastEditedBy || '',
    };

    return NextResponse.json({ automation });
  } catch (error) {
    console.error('Error fetching automation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Atualizar automações do servidor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serverId } = await params;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
      decodedToken = await adminAuth().verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verificar se usuário é admin
    const userDoc = await adminDb().collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const isAdmin = userData?.isAdmin === true;

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { enabled, onStart, onStop, onPlayerJoin, onPlayerLeave } = body;

    // Validar dados
    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid enabled value' }, { status: 400 });
    }

    // Preparar dados para salvar
    const automationData: Record<string, any> = {
      serverId,
      enabled,
      updatedAt: FieldValue.serverTimestamp(),
      lastEditedBy: decodedToken.uid,
    };

    if (onStart !== undefined) {
      automationData.onStart = onStart ? sanitizeSequence(onStart) : null;
    }
    if (onStop !== undefined) {
      automationData.onStop = onStop ? sanitizeSequence(onStop) : null;
    }
    if (onPlayerJoin !== undefined) {
      automationData.onPlayerJoin = onPlayerJoin ? sanitizeSequence(onPlayerJoin) : null;
    }
    if (onPlayerLeave !== undefined) {
      automationData.onPlayerLeave = onPlayerLeave ? sanitizeSequence(onPlayerLeave) : null;
    }

    // Verificar se documento já existe
    const automationRef = adminDb().collection('serverAutomations').doc(serverId);
    const existingDoc = await automationRef.get();

    if (!existingDoc.exists) {
      automationData.createdAt = FieldValue.serverTimestamp();
    }

    // Salvar com merge para não sobrescrever campos não enviados
    await automationRef.set(automationData, { merge: true });

    return NextResponse.json({ success: true, message: 'Automation updated successfully' });
  } catch (error) {
    console.error('Error updating automation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Deletar automações do servidor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: serverId } = await params;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken;

    try {
      decodedToken = await adminAuth().verifyIdToken(token);
    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verificar se usuário é admin
    const userDoc = await adminDb().collection('users').doc(decodedToken.uid).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    const isAdmin = userData?.isAdmin === true;

    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Deletar automações do servidor
    await adminDb().collection('serverAutomations').doc(serverId).delete();

    return NextResponse.json({ success: true, message: 'Automation deleted successfully' });
  } catch (error) {
    console.error('Error deleting automation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helpers

function convertTimestamps(sequence: any): AutomationSequence {
  return {
    ...sequence,
    createdAt: sequence.createdAt?.toDate?.() || new Date(sequence.createdAt) || new Date(),
    updatedAt: sequence.updatedAt?.toDate?.() || new Date(sequence.updatedAt) || new Date(),
  };
}

function sanitizeSequence(sequence: AutomationSequence): Record<string, any> {
  return {
    id: sequence.id,
    name: sequence.name || 'Unnamed Sequence',
    description: sequence.description || '',
    enabled: sequence.enabled ?? true,
    actions: (sequence.actions || []).map(action => ({
      id: action.id,
      type: action.type,
      order: action.order,
      enabled: action.enabled ?? true,
      config: action.config || {},
    })),
    createdAt: sequence.createdAt || new Date(),
    updatedAt: new Date(),
    createdBy: sequence.createdBy || '',
  };
}
