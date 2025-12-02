'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import { useTranslations, useLocale } from 'next-intl';
import { ActionLog, ActionType, ActionLogResponse } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Play,
  Square,
  RotateCcw,
  Terminal,
  UserPlus,
  UserMinus,
  Shield,
  FileEdit,
  Upload,
  Trash2,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  UserCheck,
} from 'lucide-react';

const actionTypeIcons: Record<ActionType, React.ElementType> = {
  server_start: Play,
  server_stop: Square,
  server_restart: RotateCcw,
  server_command: Terminal,
  user_access_grant: UserPlus,
  user_access_revoke: UserMinus,
  user_role_change: Shield,
  content_update: FileEdit,
  document_upload: Upload,
  document_delete: Trash2,
  login: LogIn,
  logout: LogOut,
  register: UserCheck,
};

const actionTypeColors: Record<ActionType, string> = {
  server_start: 'bg-green-500/10 text-green-500 border-green-500/30',
  server_stop: 'bg-red-500/10 text-red-500 border-red-500/30',
  server_restart: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  server_command: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
  user_access_grant: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  user_access_revoke: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
  user_role_change: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  content_update: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30',
  document_upload: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30',
  document_delete: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
  login: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  logout: 'bg-slate-500/10 text-slate-500 border-slate-500/30',
  register: 'bg-teal-500/10 text-teal-500 border-teal-500/30',
};

interface ActionHistoryProps {
  serverId?: string; // If provided, filter by server
  userId?: string; // If provided, filter by user
  compact?: boolean; // Compact mode for embedding
  limit?: number;
}

export function ActionHistory({ serverId, userId, compact = false, limit = 20 }: ActionHistoryProps) {
  const { user } = useAuth();
  const t = useTranslations('actionHistory');
  const tTime = useTranslations('time');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<ActionLog | null>(null);

  // Get translated action type labels
  const getActionTypeLabel = (type: ActionType): string => {
    return t(`actionTypes.${type}`);
  };

  const fetchLogs = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error(tCommon('notAuthenticated'));
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (serverId) params.set('serverId', serverId);
      if (userId) params.set('userId', userId);
      if (typeFilter !== 'all') params.set('type', typeFilter);

      const response = await fetch(`/api/history?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error(t('loadError'));

      const data: ActionLogResponse = await response.json();
      setLogs(data.logs);
      setTotal(data.total);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [user, page, limit, serverId, userId, typeFilter, t, tCommon]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const formatTimestamp = (date: Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return tTime('now');
    if (minutes < 60) return tTime('minutesAgo', { count: minutes });
    if (hours < 24) return tTime('hoursAgo', { count: hours });
    if (days < 7) return tTime('daysAgo', { count: days });
    
    return d.toLocaleDateString(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionDescription = (log: ActionLog): string => {
    const server = log.serverName || log.serverId || '';
    const targetUser = log.targetUserName || log.targetUserId || '';
    const document = log.details?.documentName || '';

    switch (log.type) {
      case 'server_start':
        return t('actionDescriptions.server_start', { server });
      case 'server_stop':
        return t('actionDescriptions.server_stop', { server });
      case 'server_restart':
        return t('actionDescriptions.server_restart', { server });
      case 'server_command':
        return t('actionDescriptions.server_command', { server });
      case 'user_access_grant':
        return t('actionDescriptions.user_access_grant', { user: targetUser });
      case 'user_access_revoke':
        return t('actionDescriptions.user_access_revoke', { user: targetUser });
      case 'user_role_change':
        return t('actionDescriptions.user_role_change', { user: targetUser });
      case 'content_update':
        return t('actionDescriptions.content_update', { server });
      case 'document_upload':
        return t('actionDescriptions.document_upload', { document });
      case 'document_delete':
        return t('actionDescriptions.document_delete', { document });
      case 'login':
        return t('actionDescriptions.login');
      case 'logout':
        return t('actionDescriptions.logout');
      default:
        return log.type;
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('noActions')}
          </p>
        ) : (
          logs.slice(0, limit).map((log) => {
            const Icon = actionTypeIcons[log.type];
            return (
              <div
                key={log.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setSelectedLog(log)}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={log.userPhotoUrl} />
                  <AvatarFallback className="text-xs">
                    {log.userName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">
                    <span className="font-medium">{log.userName.split(' ')[0]}</span>{' '}
                    <span className="text-muted-foreground">{getActionDescription(log)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Icon className="h-3 w-3" />
                    {formatTimestamp(log.timestamp)}
                  </p>
                </div>
                {!log.success && (
                  <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                )}
              </div>
            );
          })
        )}
      </div>
    );
  }

  // Get all action types for filter
  const actionTypes: ActionType[] = [
    'server_start', 'server_stop', 'server_restart', 'server_command',
    'user_access_grant', 'user_access_revoke', 'user_role_change',
    'content_update', 'document_upload', 'document_delete',
    'login', 'logout', 'register'
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('title')}
              </CardTitle>
              <CardDescription>
                {total > 0 ? t('actionsRecorded', { count: total }) : t('description')}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t('filterByType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allTypes')}</SelectItem>
                  {actionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getActionTypeLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchLogs} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8 text-red-500">
              <XCircle className="h-8 w-8 mx-auto mb-2" />
              <p>{error}</p>
              <Button variant="outline" onClick={fetchLogs} className="mt-2">
                {tCommon('refresh')}
              </Button>
            </div>
          ) : loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-6 w-24" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">{t('noActions')}</p>
              <p className="text-sm">{t('description')}</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('user')}</TableHead>
                    <TableHead>{t('action')}</TableHead>
                    <TableHead>{tCommon('filter')}</TableHead>
                    <TableHead>{t('timestamp')}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const Icon = actionTypeIcons[log.type];
                    return (
                      <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedLog(log)}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={log.userPhotoUrl} />
                              <AvatarFallback className="text-xs">
                                {log.userName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{log.userName}</p>
                              <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={actionTypeColors[log.type]}>
                            <Icon className="h-3 w-3 mr-1" />
                            {getActionTypeLabel(log.type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {log.serverName || log.targetUserName || '-'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground">
                            {formatTimestamp(log.timestamp)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {log.success ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {locale === 'pt-BR' ? `Página ${page} de ${Math.ceil(total / limit)}` : `Page ${page} of ${Math.ceil(total / limit)}`}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {tCommon('previous')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={!hasMore}
                  >
                    {tCommon('next')}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && (
                <>
                  {(() => {
                    const Icon = actionTypeIcons[selectedLog.type];
                    return <Icon className="h-5 w-5" />;
                  })()}
                  {getActionTypeLabel(selectedLog?.type || 'login')}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {t('details')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              {/* User info */}
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedLog.userPhotoUrl} />
                  <AvatarFallback>
                    {selectedLog.userName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedLog.userName}</p>
                  <p className="text-sm text-muted-foreground">{selectedLog.userEmail}</p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('status')}:</span>
                {selectedLog.success ? (
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {t('success')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
                    <XCircle className="h-3 w-3 mr-1" />
                    {t('failed')}
                  </Badge>
                )}
              </div>

              {/* Timestamp */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('timestamp')}:</span>
                <span className="text-sm">
                  {new Date(selectedLog.timestamp).toLocaleString(locale === 'pt-BR' ? 'pt-BR' : 'en-US')}
                </span>
              </div>

              {/* Server info */}
              {selectedLog.serverName && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{locale === 'pt-BR' ? 'Servidor' : 'Server'}:</span>
                  <span className="text-sm font-medium">{selectedLog.serverName}</span>
                </div>
              )}

              {/* Target user */}
              {selectedLog.targetUserName && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{locale === 'pt-BR' ? 'Usuário alvo' : 'Target user'}:</span>
                  <span className="text-sm font-medium">{selectedLog.targetUserName}</span>
                </div>
              )}

              {/* Details */}
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div className="p-3 bg-muted rounded-lg space-y-2">
                  <p className="text-sm font-medium">{t('details')}:</p>
                  <div className="space-y-1 text-sm">
                    {selectedLog.details.command && (
                      <p>
                        <span className="text-muted-foreground">{locale === 'pt-BR' ? 'Comando' : 'Command'}: </span>
                        <code className="bg-background px-1 rounded">{selectedLog.details.command}</code>
                      </p>
                    )}
                    {selectedLog.details.previousRole && (
                      <p>
                        <span className="text-muted-foreground">{locale === 'pt-BR' ? 'Função anterior' : 'Previous role'}: </span>
                        {selectedLog.details.previousRole}
                      </p>
                    )}
                    {selectedLog.details.newRole && (
                      <p>
                        <span className="text-muted-foreground">{locale === 'pt-BR' ? 'Nova função' : 'New role'}: </span>
                        {selectedLog.details.newRole}
                      </p>
                    )}
                    {selectedLog.details.documentName && (
                      <p>
                        <span className="text-muted-foreground">{locale === 'pt-BR' ? 'Documento' : 'Document'}: </span>
                        {selectedLog.details.documentName}
                      </p>
                    )}
                    {selectedLog.details.fieldUpdated && (
                      <p>
                        <span className="text-muted-foreground">{locale === 'pt-BR' ? 'Campo' : 'Field'}: </span>
                        {selectedLog.details.fieldUpdated}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Error message */}
              {selectedLog.errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-500">{selectedLog.errorMessage}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
