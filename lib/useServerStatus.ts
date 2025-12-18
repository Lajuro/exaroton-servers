import { useState, useEffect, useRef, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { ExarotonServer } from '@/types';

interface UseServerStatusOptions {
  serverId: string;
  initialServer?: Partial<ExarotonServer>;
}

interface UseServerStatusResult {
  server: ExarotonServer | null;
  setServer: React.Dispatch<React.SetStateAction<ExarotonServer | null>>;
  isLive: boolean;
  error: string | null;
  notifyActionTaken: () => void;
}

// Maximum number of reconnection attempts before giving up
const MAX_RECONNECT_ATTEMPTS = 5;
// Base delay between reconnection attempts (will use exponential backoff)
const BASE_RECONNECT_DELAY = 2000;

// Helper function to check if a partial server has all required properties
function isCompleteServer(partial: Partial<ExarotonServer> | undefined): partial is ExarotonServer {
  return !!(
    partial &&
    partial.id !== undefined &&
    partial.name !== undefined &&
    partial.address !== undefined &&
    partial.motd !== undefined &&
    partial.status !== undefined &&
    partial.host !== undefined &&
    partial.port !== undefined
  );
}

export function useServerStatus({ serverId, initialServer }: UseServerStatusOptions): UseServerStatusResult {
  const [server, setServer] = useState<ExarotonServer | null>(() => 
    isCompleteServer(initialServer) ? initialServer : null
  );
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastActionTimeRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const isUnmountedRef = useRef<boolean>(false);
  const prevStatusRef = useRef<number | undefined>(initialServer?.status);

  // Update local state if initialServer changes (and we don't have one yet or it's a different server)
  useEffect(() => {
    if (isCompleteServer(initialServer) && (!server || server.id !== initialServer.id)) {
      setServer(initialServer);
      prevStatusRef.current = initialServer.status;
    }
  }, [initialServer?.id]);

  const notifyActionTaken = useCallback(() => {
    lastActionTimeRef.current = Date.now();
  }, []);

  const cleanupSSE = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsLive(false);
  }, []);

  const connectSSE = useCallback(async () => {
    if (isUnmountedRef.current || !serverId) return;
    
    cleanupSSE();

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token || isUnmountedRef.current) return;

      const eventSource = new EventSource(
        `/api/servers/${serverId}/stream?token=${encodeURIComponent(token)}`
      );

      eventSource.onopen = () => {
        if (isUnmountedRef.current) {
          eventSource.close();
          return;
        }
        setIsLive(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        if (isUnmountedRef.current) return;
        
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'status' && data.server) {
            const timeSinceLastAction = Date.now() - lastActionTimeRef.current;
            const isTransitioningStatus = [2, 3, 4, 5, 6, 10].includes(data.server.status);
            
            // If we just executed an action (< 2s), only accept transitioning or final states
            // This prevents the UI from flickering back to "Offline" immediately after clicking "Start"
            if (timeSinceLastAction < 2000 && !isTransitioningStatus && data.server.status !== 0 && data.server.status !== 1) {
              return;
            }
            
            setServer(prev => {
              if (!prev) return data.server;
              return {
                ...prev,
                status: data.server.status,
                players: data.server.players || prev.players,
              };
            });
          }
        } catch (err) {
          console.error('Error parsing SSE message:', err);
        }
      };

      eventSource.onerror = () => {
        if (isUnmountedRef.current) {
          eventSource.close();
          return;
        }
        
        setIsLive(false);
        eventSource.close();
        eventSourceRef.current = null;
        
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current++;
          const delay = BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current - 1);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isUnmountedRef.current && serverId) {
              connectSSE();
            }
          }, delay);
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('Error connecting to SSE:', error);
      setError('Failed to connect to live updates');
    }
  }, [serverId, cleanupSSE]);

  // Effect to handle connection lifecycle
  useEffect(() => {
    isUnmountedRef.current = false;
    
    if (serverId) {
      connectSSE();
    }

    return () => {
      isUnmountedRef.current = true;
      cleanupSSE();
    };
  }, [serverId, connectSSE, cleanupSSE]);

  // Effect for Sound Notification
  useEffect(() => {
    if (server && prevStatusRef.current !== 1 && server.status === 1) {
      // Transitioned to ONLINE
      const playSound = localStorage.getItem('playSuccessSound') !== 'false';
      if (playSound) {
        const storedVolume = localStorage.getItem('successSoundVolume');
        const volume = storedVolume ? parseInt(storedVolume, 10) / 100 : 0.5;
        
        const audio = new Audio('/success_sound.wav');
        audio.volume = volume;
        audio.play().catch(e => console.error('Error playing sound:', e));
      }
    }
    
    if (server) {
      prevStatusRef.current = server.status;
    }
  }, [server]);

  return {
    server,
    setServer,
    isLive,
    error,
    notifyActionTaken
  };
}
