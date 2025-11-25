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
  ram?: number; // RAM em GB
  credits?: number; // Créditos restantes
  shared?: boolean; // Se o servidor é compartilhado
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

// Cache do servidor com TTL de 5 minutos
export interface ServerCache {
  serverId: string;
  data: ExarotonServer;
  cachedAt: Date;
  expiresAt: Date;
  lastFetched: Date;
}

// Documento customizado de conteúdo do servidor
export interface ServerDocument {
  id: string;
  name: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string; // userId
  size: number;
  type: string;
}

export interface ServerContent {
  serverId: string;
  createdAt: Date;
  updatedAt: Date;
  lastEditedBy: string; // userId
  
  // Conteúdo customizável
  accessInstructions?: string; // Markdown ou rich text
  bannerUrl?: string;
  bannerPosition?: number; // 0-100, posição vertical da imagem (default: 50)
  iconUrl?: string;
  coverImageUrl?: string;
  
  // Documentos (PDFs, etc)
  documents: ServerDocument[];
  
  // Metadados adicionais
  tags?: string[];
  description?: string;
  customFields?: Record<string, any>;
}
