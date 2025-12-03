// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Client } = require('exaroton');

// Type definitions for exaroton SDK
// These are simplified types - the actual SDK has more methods/properties
export interface ExarotonServer {
  id: string;
  name: string;
  address: string;
  motd: string;
  status: number;
  host: string | null;
  port: number | null;
  software?: { id: string; name: string; version: string };
  players?: { max: number; count: number; list: string[] };
  ram: number;
  shared: boolean;
  get(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  restart(): Promise<void>;
  executeCommand(command: string): Promise<void>;
  subscribe(stream?: string): void;
  unsubscribe(stream?: string): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, callback: (...args: any[]) => void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(event: string, callback: (...args: any[]) => void): void;
}

interface ExarotonClient {
  getServers(): Promise<ExarotonServer[]>;
  server(id: string): ExarotonServer;
}

let exarotonClient: ExarotonClient | null = null;

export function getExarotonClient(): ExarotonClient {
  if (!exarotonClient) {
    const apiKey = process.env.EXAROTON_API_KEY;
    if (!apiKey) {
      throw new Error('EXAROTON_API_KEY is not defined in environment variables');
    }
    exarotonClient = new Client(apiKey);
  }
  return exarotonClient!;
}

export async function getServers() {
  const client = getExarotonClient();
  return await client.getServers();
}

export async function getServer(serverId: string) {
  const client = getExarotonClient();
  const server = client.server(serverId);
  await server.get();
  return server;
}

export async function startServer(serverId: string) {
  const client = getExarotonClient();
  const server = client.server(serverId);
  return await server.start();
}

export async function stopServer(serverId: string) {
  const client = getExarotonClient();
  const server = client.server(serverId);
  return await server.stop();
}

export async function restartServer(serverId: string) {
  const client = getExarotonClient();
  const server = client.server(serverId);
  return await server.restart();
}

export async function getServerPlayers(serverId: string) {
  const client = getExarotonClient();
  const server = client.server(serverId);
  await server.get();
  return server.players?.list || [];
}

export async function executeServerCommand(serverId: string, command: string): Promise<void> {
  const apiKey = process.env.EXAROTON_API_KEY;
  if (!apiKey) {
    throw new Error('EXAROTON_API_KEY is not defined in environment variables');
  }

  // First verify the server is online using SDK
  const client = getExarotonClient();
  const server = client.server(serverId);
  await server.get();
  
  console.log(`[executeServerCommand] Server: ${server.name}`);
  console.log(`[executeServerCommand] Status: ${server.status}`);
  console.log(`[executeServerCommand] Software: ${server.software?.name} ${server.software?.version}`);
  console.log(`[executeServerCommand] Command: "${command}"`);
  
  // Verify server is online (status 1)
  if (server.status !== 1) {
    throw new Error('Server must be online to execute commands');
  }
  
  // Use REST API directly to avoid WebSocket issues in the SDK
  // POST /servers/{id}/command/ with body {"command": "..."}
  const response = await fetch(`https://api.exaroton.com/v1/servers/${serverId}/command/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ command }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[executeServerCommand] REST API Error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
    });
    throw new Error(errorData?.error || `Failed to execute command: ${response.statusText}`);
  }

  const result = await response.json();
  console.log(`[executeServerCommand] Command executed successfully via REST API:`, result);
}
