export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isAdmin: boolean;
  serverAccess: string[]; // Array of server IDs the user has access to
  createdAt: Date;
  updatedAt: Date;
}

export interface ServerAccess {
  serverId: string;
  userId: string;
  grantedBy: string; // UID of admin who granted access
  grantedAt: Date;
}

export interface ExarotonServer {
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
}

export type UserRole = 'admin' | 'user';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  serverAccess: string[];
}
