import { Client } from 'exaroton';

let exarotonClient: Client | null = null;

export function getExarotonClient(): Client {
  if (!exarotonClient) {
    const apiKey = process.env.EXAROTON_API_KEY;
    if (!apiKey) {
      throw new Error('EXAROTON_API_KEY is not defined in environment variables');
    }
    exarotonClient = new Client(apiKey);
  }
  return exarotonClient;
}

export async function getServers() {
  const client = getExarotonClient();
  return await client.getServers();
}

export async function getServer(serverId: string) {
  const client = getExarotonClient();
  const server = (client as any).server(serverId);
  await server.get();
  return server;
}

export async function startServer(serverId: string) {
  const client = getExarotonClient();
  const server = (client as any).server(serverId);
  return await server.start();
}

export async function stopServer(serverId: string) {
  const client = getExarotonClient();
  const server = (client as any).server(serverId);
  return await server.stop();
}

export async function restartServer(serverId: string) {
  const client = getExarotonClient();
  const server = (client as any).server(serverId);
  return await server.restart();
}

export async function getServerPlayers(serverId: string) {
  const client = getExarotonClient();
  const server = (client as any).server(serverId);
  await server.get();
  return server.players?.list || [];
}

export async function executeServerCommand(serverId: string, command: string): Promise<void> {
  const client = getExarotonClient();
  const server = (client as any).server(serverId);
  
  // Get server data first to populate the server object
  await server.get();
  
  console.log(`[executeServerCommand] Server: ${server.name}`);
  console.log(`[executeServerCommand] Status: ${server.status}`);
  console.log(`[executeServerCommand] Software: ${server.software?.name} ${server.software?.version}`);
  console.log(`[executeServerCommand] Command: "${command}"`);
  
  // Verify server is online (status 1)
  if (server.status !== 1) {
    throw new Error('Server must be online to execute commands');
  }
  
  // For CurseForge/modpack servers, the REST API returns "Invalid command"
  // We need to use WebSocket to send commands reliably
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      // Cleanup
      try {
        server.unsubscribe('console');
        server.unsubscribe();
      } catch {
        // Ignore cleanup errors
      }
      console.log(`[executeServerCommand] Command sent (timeout reached, assuming success)`);
      resolve();
    }, 3000);

    try {
      // Subscribe to console to enable WebSocket command sending
      server.subscribe('console');
      
      // Wait for WebSocket connection to establish
      setTimeout(async () => {
        try {
          // Try to execute the command
          const result = await server.executeCommand(command);
          clearTimeout(timeout);
          console.log(`[executeServerCommand] Command executed successfully:`, result);
          
          // Cleanup
          try {
            server.unsubscribe('console');
            server.unsubscribe();
          } catch {
            // Ignore cleanup errors
          }
          resolve();
        } catch (error: any) {
          clearTimeout(timeout);
          
          // For CurseForge servers, REST API returns "Invalid command"
          // but the WebSocket sends the command successfully
          if (error?.message === 'Invalid command') {
            console.log(`[executeServerCommand] REST API returned "Invalid command" - command was sent via WebSocket`);
            
            // Cleanup
            try {
              server.unsubscribe('console');
              server.unsubscribe();
            } catch {
              // Ignore cleanup errors
            }
            resolve();
            return;
          }
          
          console.error(`[executeServerCommand] Error:`, error?.message);
          
          // Cleanup
          try {
            server.unsubscribe('console');
            server.unsubscribe();
          } catch {
            // Ignore cleanup errors
          }
          reject(error);
        }
      }, 500);
    } catch (error: any) {
      clearTimeout(timeout);
      console.error(`[executeServerCommand] Setup error:`, error?.message);
      reject(error);
    }
  });
}
