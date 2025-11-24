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
  return await client.getServer(serverId);
}

export async function startServer(serverId: string) {
  const client = getExarotonClient();
  const server = await client.getServer(serverId);
  return await server.start();
}

export async function stopServer(serverId: string) {
  const client = getExarotonClient();
  const server = await client.getServer(serverId);
  return await server.stop();
}

export async function restartServer(serverId: string) {
  const client = getExarotonClient();
  const server = await client.getServer(serverId);
  return await server.restart();
}

export async function getServerPlayers(serverId: string) {
  const client = getExarotonClient();
  const server = await client.getServer(serverId);
  return server.players?.list || [];
}
