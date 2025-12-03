import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getExarotonClient } from '@/lib/exaroton';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication via query param (EventSource doesn't support custom headers)
    const token = request.nextUrl.searchParams.get('token');
    if (!token) {
      return new Response('Unauthorized', { status: 401 });
    }

    await adminAuth().verifyIdToken(token);

    const { id: serverId } = await params;
    const client = getExarotonClient();
    const server = client.server(serverId);

    // Create SSE response
    const encoder = new TextEncoder();
    let isClosed = false;
    let heartbeatInterval: NodeJS.Timeout | null = null;

    const stream = new ReadableStream({
      async start(controller) {
        // Helper function to send SSE data
        const sendData = (data: object) => {
          if (isClosed) return;
          try {
            const message = JSON.stringify({ type: 'status', server: data });
            controller.enqueue(encoder.encode(`data: ${message}\n\n`));
          } catch (err) {
            console.error('Error sending SSE data:', err);
          }
        };

        try {
          // Initial status fetch
          await server.get();
          
          console.log(`[SSE] Server ${serverId} initial status: ${server.status}`);
          
          // Send initial data with type: 'status'
          sendData({
            status: server.status,
            name: server.name,
            address: server.address,
            players: server.players,
          });

          // Subscribe to exaroton WebSocket for real-time status updates
          server.subscribe();
          console.log(`[SSE] Subscribed to server ${serverId} WebSocket`);

          // Handle status updates from exaroton WebSocket
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const statusHandler = (updatedServer: any) => {
            console.log(`[SSE] Status update for ${serverId}: ${updatedServer.status}`);
            sendData({
              status: updatedServer.status,
              name: updatedServer.name,
              address: updatedServer.address,
              players: updatedServer.players,
            });
          };

          server.on('status', statusHandler);

          // Keep connection alive with heartbeat every 15 seconds
          heartbeatInterval = setInterval(() => {
            if (isClosed) {
              if (heartbeatInterval) clearInterval(heartbeatInterval);
              return;
            }
            try {
              controller.enqueue(encoder.encode(`: heartbeat\n\n`));
            } catch {
              // Connection closed
              isClosed = true;
              if (heartbeatInterval) clearInterval(heartbeatInterval);
            }
          }, 15000);

          // Cleanup on disconnect
          const cleanup = () => {
            console.log(`[SSE] Cleaning up connection for server ${serverId}`);
            isClosed = true;
            if (heartbeatInterval) {
              clearInterval(heartbeatInterval);
              heartbeatInterval = null;
            }
            try {
              server.off('status', statusHandler);
              server.unsubscribe();
            } catch (err) {
              console.error('Error during cleanup:', err);
            }
            try {
              controller.close();
            } catch {
              // Already closed
            }
          };

          request.signal.addEventListener('abort', cleanup);
        } catch (error) {
          console.error('Stream error:', error);
          isClosed = true;
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          controller.error(error);
        }
      },
      cancel() {
        isClosed = true;
        if (heartbeatInterval) clearInterval(heartbeatInterval);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable buffering on nginx
      },
    });
  } catch (error) {
    console.error('SSE setup error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
