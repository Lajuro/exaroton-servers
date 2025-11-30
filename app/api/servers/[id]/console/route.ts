import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getExarotonClient } from '@/lib/exaroton';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/servers/[id]/console
 * Stream de logs do console do servidor via SSE
 */
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

    const decodedToken = await adminAuth().verifyIdToken(token);
    
    // Only admins can view console
    if (decodedToken.admin !== true) {
      return new Response('Admin access required', { status: 403 });
    }

    const { id: serverId } = await params;
    const client = getExarotonClient();
    // @ts-expect-error - exaroton types may be outdated
    const server = client.server(serverId);

    // Create SSE response
    const encoder = new TextEncoder();
    let isClosed = false;
    let heartbeatInterval: NodeJS.Timeout | null = null;

    const stream = new ReadableStream({
      async start(controller) {
        const sendMessage = (type: string, data: any) => {
          if (isClosed) return;
          try {
            const message = JSON.stringify({ type, ...data });
            controller.enqueue(encoder.encode(`data: ${message}\n\n`));
          } catch (err) {
            console.error('Error sending console SSE data:', err);
          }
        };

        try {
          // Get initial server status
          await server.get();
          
          console.log(`[Console SSE] Server ${serverId} status: ${server.status}`);
          
          // Send initial connection message
          sendMessage('connected', { 
            serverId, 
            serverName: server.name,
            status: server.status 
          });

          // Only subscribe to console if server is online (status 1)
          if (server.status === 1) {
            // Subscribe to console stream
            server.subscribe('console');
            console.log(`[Console SSE] Subscribed to console for ${serverId}`);

            // Handle console lines
            const consoleHandler = (line: string) => {
              sendMessage('console', { line, timestamp: new Date().toISOString() });
            };

            server.on('console:line', consoleHandler);

            // Handle status changes
            const statusHandler = (updatedServer: any) => {
              sendMessage('status', { status: updatedServer.status });
              
              // If server went offline, unsubscribe from console
              if (updatedServer.status !== 1) {
                try {
                  server.unsubscribe('console');
                  server.off('console:line', consoleHandler);
                } catch (err) {
                  console.error('Error unsubscribing from console:', err);
                }
              }
            };

            server.on('status', statusHandler);

            // Cleanup function
            const cleanup = () => {
              console.log(`[Console SSE] Cleaning up console connection for ${serverId}`);
              isClosed = true;
              if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
                heartbeatInterval = null;
              }
              try {
                server.off('console:line', consoleHandler);
                server.off('status', statusHandler);
                server.unsubscribe('console');
                server.unsubscribe();
              } catch (err) {
                console.error('Error during console cleanup:', err);
              }
              try {
                controller.close();
              } catch {
                // Already closed
              }
            };

            request.signal.addEventListener('abort', cleanup);
          } else {
            sendMessage('info', { 
              message: 'Server is not online. Console will be available when server starts.',
              status: server.status
            });

            // Still subscribe to status updates to know when server comes online
            server.subscribe();
            
            const statusHandler = (updatedServer: any) => {
              sendMessage('status', { status: updatedServer.status });
              
              if (updatedServer.status === 1) {
                sendMessage('info', { message: 'Server is now online. Reconnect to see console.' });
              }
            };

            server.on('status', statusHandler);

            const cleanup = () => {
              isClosed = true;
              if (heartbeatInterval) clearInterval(heartbeatInterval);
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
          }

          // Heartbeat to keep connection alive
          heartbeatInterval = setInterval(() => {
            if (isClosed) {
              if (heartbeatInterval) clearInterval(heartbeatInterval);
              return;
            }
            try {
              controller.enqueue(encoder.encode(`: heartbeat\n\n`));
            } catch (err) {
              isClosed = true;
              if (heartbeatInterval) clearInterval(heartbeatInterval);
            }
          }, 15000);

        } catch (error) {
          console.error('Console stream error:', error);
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
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('Console SSE setup error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
