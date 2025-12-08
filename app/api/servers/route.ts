import { NextRequest, NextResponse } from 'next/server';
import { getServers } from '@/lib/exaroton';
import { adminAuth, adminDb, getCachedServer, setCachedServer } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization token from the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the token
    const decodedToken = await adminAuth().verifyIdToken(token);
    const realUserId = decodedToken.uid;

    // Get real user data from Firestore
    const realUserDoc = await adminDb().collection('users').doc(realUserId).get();
    if (!realUserDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const realUserData = realUserDoc.data();
    const isRealUserAdmin = realUserData?.isAdmin === true;

    // Check for impersonation header (only admins can impersonate)
    const impersonateUserId = request.headers.get('X-Impersonate-User');
    let userData = realUserData;
    let userId = realUserId;

    if (impersonateUserId && isRealUserAdmin && impersonateUserId !== realUserId) {
      // Admin is impersonating another user
      const impersonatedUserDoc = await adminDb().collection('users').doc(impersonateUserId).get();
      if (impersonatedUserDoc.exists) {
        userData = impersonatedUserDoc.data();
        userId = impersonateUserId;
      }
    }
    
    // Verificar se deve usar cache (query param forceRefresh=true bypassa cache)
    const forceRefresh = request.nextUrl.searchParams.get('forceRefresh') === 'true';
    
    // Get all servers from Exaroton ou cache
    let allServers;
    
    if (!forceRefresh) {
      // Tentar buscar servidores do cache
      const cachedServers = await Promise.all(
        (userData?.isAdmin ? [] : userData?.serverAccess || [])
          .map((id: string) => getCachedServer(id))
      );
      
      // Se todos os servidores necessários estão no cache, usar cache
      const allCached = cachedServers.every(s => s !== null);
      
      if (allCached && cachedServers.length > 0) {
        allServers = cachedServers.filter(s => s !== null);
      } else {
        // Cache miss - buscar da API
        allServers = await getServers();
        
        // Cachear cada servidor individualmente
        await Promise.all(
          allServers.map((server: any) => setCachedServer(server.id, server))
        );
      }
    } else {
      // Force refresh - buscar direto da API
      allServers = await getServers();
      
      // Atualizar cache
      await Promise.all(
        allServers.map((server: any) => setCachedServer(server.id, server))
      );
    }
    
    // Filter servers based on user access
    let servers = allServers;
    if (!userData?.isAdmin) {
      // If not admin, filter by serverAccess
      const serverAccess = userData?.serverAccess || [];
      servers = allServers.filter((server: { id: string }) => serverAccess.includes(server.id));
    }

    return NextResponse.json({ servers });
  } catch (error) {
    console.error('Error fetching servers:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch servers';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
