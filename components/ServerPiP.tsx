'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PictureInPicture2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import { useTranslations } from 'next-intl';
import { ActiveServerSession } from '@/types';
import { sendServerCommand } from '@/lib/useServerCommand';

interface ServerPiPProps {
  serverId: string;
  serverName: string;
  serverAddress: string;
  serverIcon?: string;
  initialStatus: number;
  initialPlayers?: {
    count: number;
    max: number;
    list?: string[];
  };
  onClose?: () => void;
}

// Status constants
const STATUS = {
  OFFLINE: 0,
  ONLINE: 1,
  STARTING: 2,
  STOPPING: 3,
  RESTARTING: 4,
  SAVING: 5,
  LOADING: 6,
  CRASHED: 7,
  PENDING: 8,
  PREPARING: 10,
} as const;

export function ServerPiP({
  serverId,
  serverName,
  serverAddress,
  serverIcon,
  initialStatus,
  initialPlayers,
  onClose,
}: ServerPiPProps) {
  const { user } = useAuth();
  const t = useTranslations('servers');
  const tPiP = useTranslations('pip');
  
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [pipSupported, setPipSupported] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [players, setPlayers] = useState(initialPlayers || { count: 0, max: 20 });
  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [showCommandInput, setShowCommandInput] = useState(false);
  const [lastCommandStatus, setLastCommandStatus] = useState<'success' | 'error' | null>(null);
  
  // Credit tracking state
  const [session, setSession] = useState<ActiveServerSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const sessionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isUnmountedRef = useRef(false);

  // Maximum reconnection attempts for PiP
  const MAX_RECONNECT_ATTEMPTS = 3;
  const RECONNECT_DELAY = 3000;

  // Check PiP support
  useEffect(() => {
    setPipSupported('documentPictureInPicture' in window);
    isUnmountedRef.current = false;
    
    return () => {
      isUnmountedRef.current = true;
    };
  }, []);

  // Fetch active session for credit tracking
  const fetchSession = useCallback(async () => {
    if (!user) return;
    
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      
      const response = await fetch(`/api/servers/${serverId}/session`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.session) {
          setSession(data.session);
          setElapsedTime(data.session.elapsedTime);
        } else {
          setSession(null);
          setElapsedTime(0);
        }
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  }, [serverId, user]);

  // Fetch session when server comes online or initially
  useEffect(() => {
    const isOnlineStatus = status === STATUS.ONLINE;
    if (isOnlineStatus && user) {
      fetchSession();
    } else if (status === STATUS.OFFLINE) {
      setSession(null);
      setElapsedTime(0);
    }
  }, [status, user, fetchSession]);

  // Update elapsed time every second and refresh credits every 30 seconds
  useEffect(() => {
    if (!session) return;
    
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    
    // Refresh session data every 30 seconds for credit updates
    const refreshInterval = setInterval(() => {
      fetchSession();
    }, 30000);
    
    sessionIntervalRef.current = timer;
    
    return () => {
      clearInterval(timer);
      clearInterval(refreshInterval);
      if (sessionIntervalRef.current) {
        clearInterval(sessionIntervalRef.current);
      }
    };
  }, [session, fetchSession]);

  // Format elapsed time
  const formatElapsedTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }, []);

  // Subscribe to server updates via SSE
  useEffect(() => {
    if (!user) return;

    // Cleanup function
    const cleanup = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };

    const connectSSE = async () => {
      // Don't connect if unmounted
      if (isUnmountedRef.current) return;
      
      // Clean up existing connection
      cleanup();

      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token || isUnmountedRef.current) return;
        
        const eventSource = new EventSource(
          `/api/servers/${serverId}/stream?token=${encodeURIComponent(token)}`
        );

        eventSource.onmessage = (event) => {
          // Don't process if unmounted
          if (isUnmountedRef.current) return;
          
          try {
            const data = JSON.parse(event.data);
            // Reset reconnect attempts on successful message
            reconnectAttemptsRef.current = 0;
            
            if (data.type === 'status' && typeof data.status === 'number') {
              setStatus(data.status);
            }
            if (data.type === 'players') {
              setPlayers(data.players);
            }
            if (data.type === 'update' && data.server) {
              if (typeof data.server.status === 'number') {
                setStatus(data.server.status);
              }
              if (data.server.players) {
                setPlayers(data.server.players);
              }
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        };

        eventSource.onerror = () => {
          // Don't reconnect if unmounted
          if (isUnmountedRef.current) {
            eventSource.close();
            return;
          }
          
          eventSource.close();
          eventSourceRef.current = null;
          
          // Only attempt reconnection if under max attempts
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttemptsRef.current++;
            console.log(`[PiP SSE] Reconnecting (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              if (!isUnmountedRef.current) {
                connectSSE();
              }
            }, RECONNECT_DELAY);
          } else {
            console.log('[PiP SSE] Max reconnection attempts reached');
          }
        };

        eventSourceRef.current = eventSource;
      } catch (error) {
        console.error('Error connecting to SSE:', error);
      }
    };

    reconnectAttemptsRef.current = 0;
    connectSSE();

    return cleanup;
  }, [serverId, user]);

  // Get status info
  const getStatusInfo = useCallback(() => {
    switch (status) {
      case STATUS.ONLINE:
        return { label: t('status.online'), color: 'bg-green-500', textColor: 'text-green-400' };
      case STATUS.OFFLINE:
        return { label: t('status.offline'), color: 'bg-gray-500', textColor: 'text-gray-400' };
      case STATUS.STARTING:
        return { label: t('status.starting'), color: 'bg-yellow-500', textColor: 'text-yellow-400' };
      case STATUS.STOPPING:
        return { label: t('status.stopping'), color: 'bg-orange-500', textColor: 'text-orange-400' };
      case STATUS.RESTARTING:
        return { label: t('status.restarting'), color: 'bg-blue-500', textColor: 'text-blue-400' };
      case STATUS.SAVING:
        return { label: t('status.saving'), color: 'bg-purple-500', textColor: 'text-purple-400' };
      case STATUS.LOADING:
        return { label: t('status.loading'), color: 'bg-cyan-500', textColor: 'text-cyan-400' };
      case STATUS.CRASHED:
        return { label: t('status.crashed'), color: 'bg-red-500', textColor: 'text-red-400' };
      case STATUS.PENDING:
        return { label: t('status.pending'), color: 'bg-amber-500', textColor: 'text-amber-400' };
      case STATUS.PREPARING:
        return { label: t('status.preparing'), color: 'bg-indigo-500', textColor: 'text-indigo-400' };
      default:
        return { label: t('status.unknown'), color: 'bg-gray-500', textColor: 'text-gray-400' };
    }
  }, [status, t]);

  // Server actions
  const executeAction = async (action: 'start' | 'stop' | 'restart') => {
    if (!user || isLoading) return;
    
    setIsLoading(action);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      
      const response = await fetch(`/api/servers/${serverId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} server`);
      }
    } catch (error) {
      console.error(`Error ${action}ing server:`, error);
    } finally {
      setIsLoading(null);
    }
  };

  // Send command using centralized function
  const sendCommandToPiP = async () => {
    if (!user || !command.trim() || isLoading) return;
    
    setIsLoading('command');
    setLastCommandStatus(null);
    
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      
      // Use centralized sendServerCommand function
      const result = await sendServerCommand({
        serverId,
        command: command.trim(),
        token,
      });

      if (result.success) {
        setLastCommandStatus('success');
        setCommand('');
        setTimeout(() => setLastCommandStatus(null), 2000);
      } else {
        setLastCommandStatus('error');
        setTimeout(() => setLastCommandStatus(null), 3000);
      }
    } catch (error) {
      console.error('Error sending command:', error);
      setLastCommandStatus('error');
      setTimeout(() => setLastCommandStatus(null), 3000);
    } finally {
      setIsLoading(null);
    }
  };

  // Open PiP window
  const openPiP = async () => {
    if (!pipSupported || !containerRef.current) return;

    try {
      // @ts-expect-error - Document PiP API is not fully typed yet
      const pip = await window.documentPictureInPicture.requestWindow({
        width: 340,
        height: 280,
      });

      // Copy styles to PiP window
      const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
      styles.forEach((style) => {
        pip.document.head.appendChild(style.cloneNode(true));
      });

      // Add custom styles for the PiP window
      const customStyle = pip.document.createElement('style');
      customStyle.textContent = `
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          color: white;
          min-height: 100vh;
          overflow: hidden;
        }
        .pip-container {
          padding: 12px;
          height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .pip-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        .pip-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          object-fit: cover;
          background: rgba(255,255,255,0.1);
          flex-shrink: 0;
        }
        .pip-info {
          flex: 1;
          min-width: 0;
        }
        .pip-name {
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pip-address {
          font-size: 11px;
          color: rgba(255,255,255,0.6);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pip-status {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 10px;
          padding: 6px 10px;
          background: rgba(255,255,255,0.1);
          border-radius: 6px;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        .status-dot.offline { background: #6b7280; animation: none; }
        .status-dot.online { background: #22c55e; }
        .status-dot.starting { background: #eab308; }
        .status-dot.stopping { background: #f97316; }
        .status-dot.crashed { background: #ef4444; animation: none; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .pip-players {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: rgba(255,255,255,0.8);
        }
        .pip-actions {
          display: flex;
          gap: 6px;
          margin-top: auto;
          flex-wrap: wrap;
        }
        .pip-btn {
          flex: 1;
          min-width: 60px;
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: all 0.2s;
        }
        .pip-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .pip-btn.start {
          background: #22c55e;
          color: white;
        }
        .pip-btn.start:hover:not(:disabled) {
          background: #16a34a;
        }
        .pip-btn.stop {
          background: #ef4444;
          color: white;
        }
        .pip-btn.stop:hover:not(:disabled) {
          background: #dc2626;
        }
        .pip-btn.restart {
          background: #3b82f6;
          color: white;
        }
        .pip-btn.restart:hover:not(:disabled) {
          background: #2563eb;
        }
        .pip-btn.command {
          background: #8b5cf6;
          color: white;
        }
        .pip-btn.command:hover:not(:disabled) {
          background: #7c3aed;
        }
        .pip-command-input {
          display: flex;
          gap: 6px;
          margin-top: 8px;
        }
        .pip-input {
          flex: 1;
          padding: 8px 10px;
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 6px;
          background: rgba(255,255,255,0.1);
          color: white;
          font-size: 12px;
          outline: none;
        }
        .pip-input:focus {
          border-color: #8b5cf6;
        }
        .pip-input::placeholder {
          color: rgba(255,255,255,0.4);
        }
        .pip-input.success {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.2);
        }
        .pip-input.error {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.2);
        }
        .pip-send-btn {
          padding: 8px 12px;
          border: none;
          border-radius: 6px;
          background: #8b5cf6;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pip-send-btn:hover:not(:disabled) {
          background: #7c3aed;
        }
        .pip-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .loading {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .pip-credits {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 10px;
          padding: 8px 10px;
          background: linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%);
          border: 1px solid rgba(234, 179, 8, 0.3);
          border-radius: 6px;
        }
        .pip-credits-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: rgba(255,255,255,0.7);
        }
        .pip-credits-header svg {
          color: #eab308;
        }
        .pip-credits-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
        }
        .pip-credits-label {
          color: rgba(255,255,255,0.6);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .pip-credits-value {
          font-weight: 600;
          font-family: 'SF Mono', 'Monaco', 'Menlo', monospace;
        }
        .pip-credits-value.start {
          color: #22c55e;
        }
        .pip-credits-value.current {
          color: #3b82f6;
        }
        .pip-credits-value.spent {
          color: #ef4444;
        }
        .pip-credits-value.time {
          color: #a78bfa;
        }
      `;
      pip.document.head.appendChild(customStyle);

      setPipWindow(pip);

      pip.addEventListener('pagehide', () => {
        setPipWindow(null);
        onClose?.();
      });
    } catch (error) {
      console.error('Error opening PiP:', error);
    }
  };

  // Close PiP window - available for external use
  const _closePiP = () => {
    pipWindow?.close();
    setPipWindow(null);
    onClose?.();
  };

  // Export closePiP through ref if needed
  void _closePiP;

  const statusInfo = getStatusInfo();
  const isOnline = status === STATUS.ONLINE;
  const isOffline = status === STATUS.OFFLINE;
  const isTransitioning = [STATUS.STARTING, STATUS.STOPPING, STATUS.RESTARTING, STATUS.SAVING, STATUS.LOADING, STATUS.PENDING, STATUS.PREPARING].includes(status as typeof STATUS.STARTING);

  // PiP Content
  const PiPContent = () => (
    <div className="pip-container">
      {/* Header */}
      <div className="pip-header">
        {serverIcon ? (
          <img src={serverIcon} alt={serverName} className="pip-icon" />
        ) : (
          <div className="pip-icon" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            {serverName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="pip-info">
          <div className="pip-name">{serverName}</div>
          <div className="pip-address">{serverAddress}</div>
        </div>
      </div>

      {/* Status */}
      <div className="pip-status">
        <div className={`status-dot ${isOnline ? 'online' : isOffline ? 'offline' : isTransitioning ? 'starting' : status === STATUS.CRASHED ? 'crashed' : 'offline'}`} />
        <span style={{ fontSize: '12px', flex: 1 }}>{statusInfo.label}</span>
        {isOnline && (
          <div className="pip-players">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>{players.count}/{players.max}</span>
          </div>
        )}
      </div>

      {/* Credit Tracker */}
      {isOnline && session && (
        <div className="pip-credits">
          <div className="pip-credits-header">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span>{tPiP('creditsTracker')}</span>
          </div>
          <div className="pip-credits-row">
            <span className="pip-credits-label">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              </svg>
              {tPiP('creditsAtStart')}
            </span>
            <span className="pip-credits-value start">{session.creditsAtStart.toFixed(2)}</span>
          </div>
          <div className="pip-credits-row">
            <span className="pip-credits-label">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {tPiP('currentCredits')}
            </span>
            <span className="pip-credits-value current">{session.currentCredits.toFixed(2)}</span>
          </div>
          <div className="pip-credits-row">
            <span className="pip-credits-label">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
              </svg>
              {tPiP('creditsSpent')}
            </span>
            <span className="pip-credits-value spent">-{session.creditsSpent.toFixed(2)}</span>
          </div>
          <div className="pip-credits-row">
            <span className="pip-credits-label">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {tPiP('uptime')}
            </span>
            <span className="pip-credits-value time">{formatElapsedTime(elapsedTime)}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="pip-actions">
        {isOffline && (
          <button 
            className="pip-btn start"
            onClick={() => executeAction('start')}
            disabled={!!isLoading}
          >
            {isLoading === 'start' ? (
              <svg className="loading" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
            {t('actions.start')}
          </button>
        )}
        
        {isOnline && (
          <>
            <button 
              className="pip-btn stop"
              onClick={() => executeAction('stop')}
              disabled={!!isLoading}
            >
              {isLoading === 'stop' ? (
                <svg className="loading" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
              )}
              {t('actions.stop')}
            </button>
            
            <button 
              className="pip-btn restart"
              onClick={() => executeAction('restart')}
              disabled={!!isLoading}
            >
              {isLoading === 'restart' ? (
                <svg className="loading" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 4v6h6" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              )}
              {t('actions.restart')}
            </button>
            
            <button 
              className="pip-btn command"
              onClick={() => setShowCommandInput(!showCommandInput)}
              disabled={!!isLoading}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              {tPiP('commandButton')}
            </button>
          </>
        )}

        {isTransitioning && (
          <button className="pip-btn" disabled style={{ background: 'rgba(255,255,255,0.2)', flex: 1 }}>
            <svg className="loading" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            {statusInfo.label}...
          </button>
        )}
      </div>

      {/* Command Input */}
      {showCommandInput && isOnline && (
        <div className="pip-command-input">
          <input
            type="text"
            className={`pip-input ${lastCommandStatus === 'success' ? 'success' : lastCommandStatus === 'error' ? 'error' : ''}`}
            placeholder={tPiP('commandPlaceholder')}
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendCommandToPiP()}
            disabled={isLoading === 'command'}
          />
          <button 
            className="pip-send-btn"
            onClick={sendCommandToPiP}
            disabled={!command.trim() || isLoading === 'command'}
          >
            {isLoading === 'command' ? (
              <svg className="loading" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );

  // Render PiP content in the PiP window
  useEffect(() => {
    if (pipWindow) {
      const container = pipWindow.document.body;
      // Force re-render when state changes
      const root = container.querySelector('#pip-root') || container.appendChild(pipWindow.document.createElement('div'));
      root.id = 'pip-root';
    }
  }, [pipWindow, status, players, command, isLoading, showCommandInput, lastCommandStatus]);

  return (
    <>
      {/* Hidden container for reference */}
      <div ref={containerRef} style={{ display: 'none' }} />

      {/* Button to open PiP */}
      {pipSupported && !pipWindow && (
        <Button
          variant="outline"
          size="sm"
          onClick={openPiP}
          className="gap-2"
          title={tPiP('openPiP')}
        >
          <PictureInPicture2 className="h-4 w-4" />
          <span className="hidden sm:inline">PiP</span>
        </Button>
      )}

      {/* PiP Window Content */}
      {pipWindow && createPortal(<PiPContent />, pipWindow.document.body)}
    </>
  );
}

// Hook to manage PiP state globally
export function useServerPiP() {
  const [activePiP, setActivePiP] = useState<string | null>(null);

  const openPiP = (serverId: string) => {
    setActivePiP(serverId);
  };

  const closePiP = () => {
    setActivePiP(null);
  };

  return { activePiP, openPiP, closePiP };
}
