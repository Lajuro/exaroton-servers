declare module 'exaroton' {
  export class Client {
    constructor(apiKey: string);
    getServers(): Promise<Server[]>;
    getServer(id: string): Promise<Server>;
  }

  export interface Server {
    id: string;
    name: string;
    address: string;
    motd: string;
    status: number;
    host: string;
    port: number;
    players: {
      max: number;
      count: number;
      list: string[];
    };
    software: {
      id: string;
      name: string;
      version: string;
    };
    start(): Promise<void>;
    stop(): Promise<void>;
    restart(): Promise<void>;
  }
}
