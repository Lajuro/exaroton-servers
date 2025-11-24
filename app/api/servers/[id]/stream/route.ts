import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getExarotonClient } from '@/lib/exaroton';

export const dynamic = 'force-dynamic';

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
    // @ts-expect-error - exaroton types may be outdated, but .server() exists in runtime
    const server = client.server(serverId);

    // Create SSE response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Initial status fetch
          await server.get();
          const initialData = {
            status: server.status,
            name: server.name,
            address: server.address,
            players: server.players,
          };
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`)
          );

          // Subscribe to WebSocket status updates
          server.subscribe();

          const statusHandler = (updatedServer: typeof server) => {
            try {
              const data = {
                status: updatedServer.status,
                name: updatedServer.name,
                address: updatedServer.address,
                players: updatedServer.players,
              };
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
              );
            } catch (err) {
              console.error('Error sending status update:', err);
            }
          };

          server.on('status', statusHandler);

          // Keep connection alive with heartbeat
          const heartbeat = setInterval(() => {
            try {
              controller.enqueue(encoder.encode(': heartbeat\n\n'));
            } catch (err) {
              // Connection closed, cleanup
              clearInterval(heartbeat);
            }
          }, 30000);

          // Cleanup on disconnect
          const cleanup = () => {
            clearInterval(heartbeat);
            try {
              server.unsubscribe();
            } catch (err) {
              console.error('Error unsubscribing:', err);
            }
            try {
              controller.close();
            } catch (err) {
              // Already closed
            }
          };

          request.signal.addEventListener('abort', cleanup);
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('SSE setup error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
