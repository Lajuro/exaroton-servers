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

// ========================================
// CREDIT TRACKING TYPES
// ========================================

/**
 * Snapshot de créditos em um momento específico
 * Salvo automaticamente no início e fim de cada dia
 */
export interface CreditSnapshot {
  id: string;
  credits: number;
  timestamp: Date;
  type: 'start_of_day' | 'end_of_day' | 'manual' | 'hourly';
  serverStates?: RunningServerSnapshot[]; // Servidores que estavam rodando
}

/**
 * Estado de um servidor rodando no momento do snapshot
 */
export interface RunningServerSnapshot {
  serverId: string;
  serverName: string;
  ram: number; // GB de RAM
  status: number;
}

/**
 * Histórico de gastos calculado a partir dos snapshots
 */
export interface CreditSpending {
  period: 'day' | '3days' | 'week' | 'month';
  startCredits: number;
  endCredits: number;
  spent: number;
  startDate: Date;
  endDate: Date;
  averagePerDay: number;
  averagePerHour: number;
}

/**
 * Configuração de tracking de créditos em tempo real
 */
export interface RealTimeCreditsConfig {
  enabled: boolean;
  updateIntervalMs: number; // Intervalo de atualização em ms
  showDecimals: boolean; // Mostrar casas decimais
}

/**
 * Dados para o relatório de créditos
 */
export interface CreditReport {
  generatedAt: Date;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    startCredits: number;
    endCredits: number;
    totalSpent: number;
    averagePerDay: number;
    averagePerHour: number;
    projectedMonthly: number;
  };
  dailyBreakdown: DailySpending[];
  serverUsage: ServerUsageSummary[];
}

/**
 * Gasto diário detalhado
 */
export interface DailySpending {
  date: Date;
  startCredits: number;
  endCredits: number;
  spent: number;
  peakUsageHour?: number;
}

/**
 * Resumo de uso por servidor
 */
export interface ServerUsageSummary {
  serverId: string;
  serverName: string;
  totalHoursRunning: number;
  ramGB: number;
  estimatedCreditsUsed: number;
}

// ========================================
// ACTION HISTORY TYPES
// ========================================

/**
 * Tipo de ação registrada no histórico
 */
export type ActionType = 
  | 'server_start'
  | 'server_stop'
  | 'server_restart'
  | 'server_command'
  | 'user_access_grant'
  | 'user_access_revoke'
  | 'user_role_change'
  | 'content_update'
  | 'document_upload'
  | 'document_delete'
  | 'login'
  | 'logout';

/**
 * Registro de ação no histórico
 */
export interface ActionLog {
  id: string;
  type: ActionType;
  userId: string;
  userName: string;
  userEmail: string;
  userPhotoUrl?: string;
  timestamp: Date;
  
  // Contexto da ação
  serverId?: string;
  serverName?: string;
  targetUserId?: string;
  targetUserName?: string;
  
  // Detalhes específicos da ação
  details?: {
    command?: string;           // Para server_command
    previousRole?: string;      // Para user_role_change
    newRole?: string;           // Para user_role_change
    documentName?: string;      // Para document_upload/delete
    fieldUpdated?: string;      // Para content_update
    previousValue?: string;     // Para mudanças
    newValue?: string;          // Para mudanças
    ipAddress?: string;         // Para login/logout
    userAgent?: string;         // Para login/logout
  };
  
  // Metadados
  success: boolean;
  errorMessage?: string;
}

/**
 * Filtros para consulta do histórico
 */
export interface ActionLogFilters {
  userId?: string;
  serverId?: string;
  type?: ActionType | ActionType[];
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Resposta paginada do histórico
 */
export interface ActionLogResponse {
  logs: ActionLog[];
  total: number;
  hasMore: boolean;
  page: number;
  pageSize: number;
}
