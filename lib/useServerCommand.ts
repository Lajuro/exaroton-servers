'use client';

import { useState, useCallback } from 'react';
import { auth } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';
import { useLocale } from 'next-intl';

interface UseServerCommandOptions {
  serverId: string;
  serverName?: string;
  onSuccess?: (command: string) => void;
  onError?: (error: string) => void;
}

interface UseServerCommandReturn {
  sendCommand: (command: string) => Promise<boolean>;
  isLoading: boolean;
  lastError: string | null;
  lastSuccess: boolean | null;
}

/**
 * Centralized hook for sending commands to Exaroton servers.
 * This hook handles:
 * - Authentication via Firebase
 * - Command normalization (removes leading slash)
 * - API communication
 * - Toast notifications
 * - Action logging (handled by the API route)
 * 
 * Usage:
 * ```tsx
 * const { sendCommand, isLoading, lastSuccess } = useServerCommand({
 *   serverId: 'abc123',
 *   serverName: 'My Server', // optional, for toast messages
 *   onSuccess: (cmd) => console.log('Command sent:', cmd),
 *   onError: (err) => console.error('Error:', err),
 * });
 * 
 * // Send a command
 * const success = await sendCommand('say Hello World');
 * ```
 */
export function useServerCommand({
  serverId,
  serverName,
  onSuccess,
  onError,
}: UseServerCommandOptions): UseServerCommandReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastSuccess, setLastSuccess] = useState<boolean | null>(null);
  const { toast } = useToast();
  const locale = useLocale();

  const sendCommand = useCallback(async (command: string): Promise<boolean> => {
    // Normalize command: trim whitespace and remove leading slash
    let normalizedCommand = command.trim();
    if (normalizedCommand.startsWith('/')) {
      normalizedCommand = normalizedCommand.slice(1);
    }

    // Validate command is not empty
    if (!normalizedCommand) {
      const errorMsg = locale === 'pt-BR' 
        ? 'O comando não pode estar vazio' 
        : 'Command cannot be empty';
      setLastError(errorMsg);
      setLastSuccess(false);
      toast({
        title: locale === 'pt-BR' ? 'Erro' : 'Error',
        description: errorMsg,
        variant: 'destructive',
      });
      onError?.(errorMsg);
      return false;
    }

    setIsLoading(true);
    setLastError(null);
    setLastSuccess(null);

    try {
      // Get authentication token
      const token = await auth.currentUser?.getIdToken(true);
      if (!token) {
        const errorMsg = locale === 'pt-BR' 
          ? 'Não autenticado' 
          : 'Not authenticated';
        throw new Error(errorMsg);
      }

      // Send command to API
      const response = await fetch(`/api/servers/${serverId}/command`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: normalizedCommand }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || (locale === 'pt-BR' 
          ? 'Falha ao executar comando' 
          : 'Failed to execute command'));
      }

      // Success
      setLastSuccess(true);
      setLastError(null);

      const displayName = serverName || serverId;
      toast({
        title: locale === 'pt-BR' ? 'Comando executado' : 'Command executed',
        description: locale === 'pt-BR'
          ? `"${normalizedCommand}" enviado para ${displayName}`
          : `"${normalizedCommand}" sent to ${displayName}`,
      });

      onSuccess?.(normalizedCommand);
      return true;
    } catch (error) {
      const errorMsg = error instanceof Error 
        ? error.message 
        : (locale === 'pt-BR' ? 'Erro desconhecido' : 'Unknown error');
      
      setLastError(errorMsg);
      setLastSuccess(false);

      toast({
        title: locale === 'pt-BR' ? 'Erro ao enviar comando' : 'Error sending command',
        description: errorMsg,
        variant: 'destructive',
      });

      onError?.(errorMsg);
      return false;
    } finally {
      setIsLoading(false);
      
      // Reset success/error state after 3 seconds
      setTimeout(() => {
        setLastSuccess(null);
        setLastError(null);
      }, 3000);
    }
  }, [serverId, serverName, locale, toast, onSuccess, onError]);

  return {
    sendCommand,
    isLoading,
    lastError,
    lastSuccess,
  };
}

/**
 * Standalone function to send a command without using a hook.
 * Useful for components that need to send commands without the hook pattern.
 * Note: This function doesn't show toast notifications.
 * 
 * Usage:
 * ```tsx
 * const success = await sendServerCommand({
 *   serverId: 'abc123',
 *   command: 'say Hello',
 *   token: await auth.currentUser?.getIdToken(true),
 * });
 * ```
 */
export async function sendServerCommand({
  serverId,
  command,
  token,
}: {
  serverId: string;
  command: string;
  token: string;
}): Promise<{ success: boolean; error?: string }> {
  // Normalize command
  let normalizedCommand = command.trim();
  if (normalizedCommand.startsWith('/')) {
    normalizedCommand = normalizedCommand.slice(1);
  }

  if (!normalizedCommand) {
    return { success: false, error: 'Command cannot be empty' };
  }

  if (!token) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const response = await fetch(`/api/servers/${serverId}/command`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ command: normalizedCommand }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to execute command' };
    }

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
