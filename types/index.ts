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
  host: string | null;
  port: number | null;
  players?: {
    max: number;
    count: number;
    list: string[];
  };
  software?: {
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
  | 'logout'
  | 'register';

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

// ========================================
// SERVER SESSION TRACKING TYPES
// ========================================

/**
 * Sessão de um servidor - rastreia quando foi ligado/desligado e créditos gastos
 */
export interface ServerSession {
  id: string;
  serverId: string;
  serverName: string;
  
  // Quem iniciou a sessão
  startedBy: {
    userId: string;
    userName: string;
    userEmail: string;
  };
  
  // Quem encerrou a sessão (pode ser diferente de quem iniciou)
  stoppedBy?: {
    userId: string;
    userName: string;
    userEmail: string;
  };
  
  // Timestamps
  startedAt: Date;
  stoppedAt?: Date;
  
  // Créditos
  creditsAtStart: number;
  creditsAtEnd?: number;
  creditsSpent?: number;
  
  // Status da sessão
  status: 'active' | 'completed' | 'crashed';
  
  // RAM do servidor (para referência)
  serverRam?: number;
}

/**
 * Sessão ativa de um servidor (para exibição no PiP)
 */
export interface ActiveServerSession {
  sessionId: string;
  serverId: string;
  serverName: string;
  startedAt: Date;
  creditsAtStart: number;
  currentCredits: number;
  creditsSpent: number;
  elapsedTime: number; // em segundos
}

// ========================================
// PLAYER HISTORY TYPES
// ========================================

/**
 * Sessão de um jogador em um servidor
 */
export interface PlayerSession {
  id: string;
  serverId: string;
  serverName: string;
  playerName: string;
  playerUuid?: string; // UUID do Minecraft, se disponível
  joinedAt: Date;
  leftAt?: Date;
  duration?: number; // em segundos
}

/**
 * Histórico de um jogador em um servidor
 */
export interface PlayerHistory {
  id: string;
  serverId: string;
  playerName: string;
  playerUuid?: string;
  
  // Estatísticas
  totalPlaytime: number; // em segundos
  sessionCount: number;
  firstSeen: Date;
  lastSeen: Date;
  
  // Sessões recentes
  recentSessions: PlayerSession[];
}

/**
 * Ranking de jogadores de um servidor
 */
export interface PlayerRanking {
  serverId: string;
  players: PlayerRankingEntry[];
  updatedAt: Date;
}

/**
 * Entrada no ranking de jogadores
 */
export interface PlayerRankingEntry {
  rank: number;
  playerName: string;
  playerUuid?: string;
  totalPlaytime: number; // em segundos
  sessionCount: number;
  lastSeen: Date;
  averageSessionDuration: number; // em segundos
}

/**
 * Status de última vez online do servidor
 */
export interface ServerLastOnline {
  serverId: string;
  lastOnlineAt?: Date;
  lastSeenPlayers?: string[];
  wasOnlineRecently: boolean;
}

// ========================================
// SERVER AUTOMATION TYPES
// ========================================

/**
 * Tipo de ação de automação disponível
 */
export type AutomationActionType = 
  | 'command'        // Executar um comando do Minecraft
  | 'title'          // Mostrar título na tela
  | 'subtitle'       // Mostrar subtítulo na tela
  | 'actionbar'      // Mostrar mensagem na action bar
  | 'message'        // Enviar mensagem no chat (say ou tellraw)
  | 'delay'          // Aguardar X segundos
  | 'countdown'      // Contador regressivo com mensagem
  | 'sound'          // Tocar um som
  | 'effect'         // Aplicar efeito em jogadores
  | 'time'           // Alterar horário do jogo
  | 'weather';       // Alterar clima

/**
 * Ação individual em uma sequência de automação
 */
export interface AutomationAction {
  id: string;
  type: AutomationActionType;
  order: number; // Ordem de execução (para drag-and-drop)
  enabled: boolean;
  
  // Configurações específicas por tipo
  config: {
    // command
    command?: string;
    
    // title, subtitle, actionbar, message
    text?: string;
    color?: string; // Cor do texto Minecraft (gold, red, green, etc)
    bold?: boolean;
    italic?: boolean;
    
    // title specific
    fadeIn?: number;  // Ticks (20 ticks = 1 segundo)
    stay?: number;    // Ticks
    fadeOut?: number; // Ticks
    
    // delay
    delaySeconds?: number;
    
    // countdown
    countdownFrom?: number; // Número inicial do contador
    countdownMessage?: string; // Mensagem com {seconds} placeholder
    countdownInterval?: number; // Intervalo em segundos (default 1)
    
    // sound
    soundName?: string; // Ex: minecraft:entity.player.levelup
    volume?: number;
    pitch?: number;
    
    // effect
    effectName?: string; // Ex: minecraft:speed
    duration?: number; // em segundos
    amplifier?: number;
    
    // time
    timeValue?: number; // 0-24000 (0=amanhecer, 6000=meio-dia, 18000=meia-noite)
    
    // weather
    weatherType?: 'clear' | 'rain' | 'thunder';
    weatherDuration?: number; // em segundos
    
    // Seletor de alvo (para comandos que precisam)
    targetSelector?: string; // @a, @p, @r, @e, @s ou nome específico
  };
}

/**
 * Sequência de ações de automação
 */
export interface AutomationSequence {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  actions: AutomationAction[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

/**
 * Configuração de automação para um servidor
 */
export interface ServerAutomation {
  serverId: string;
  
  // Sequências de automação
  onStart?: AutomationSequence;    // Executar ao iniciar o servidor
  onStop?: AutomationSequence;     // Executar antes de parar o servidor
  onPlayerJoin?: AutomationSequence;  // Executar quando um jogador entra (futuro)
  onPlayerLeave?: AutomationSequence; // Executar quando um jogador sai (futuro)
  
  // Configurações globais
  enabled: boolean;
  
  // Metadados
  createdAt: Date;
  updatedAt: Date;
  lastEditedBy: string;
}

/**
 * Template predefinido de ação para facilitar a criação
 */
export interface AutomationActionTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: AutomationActionType;
  defaultConfig: AutomationAction['config'];
  category: 'message' | 'visual' | 'gameplay' | 'timing' | 'advanced';
}

/**
 * Log de execução de automação
 */
export interface AutomationExecutionLog {
  id: string;
  serverId: string;
  sequenceId: string;
  sequenceName: string;
  trigger: 'start' | 'stop' | 'playerJoin' | 'playerLeave';
  executedAt: Date;
  executedBy: string;
  success: boolean;
  actionsExecuted: number;
  actionsFailed: number;
  errors?: string[];
  duration: number; // em ms
}
