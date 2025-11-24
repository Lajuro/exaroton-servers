'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';

interface Server {
  id: string;
  name: string;
  address: string;
  status: number;
  players?: {
    count: number;
    max: number;
  };
}

interface ServerCardProps {
  server: Server;
  isAdmin: boolean;
  onUpdate: () => void;
}

const STATUS_NAMES: { [key: number]: string } = {
  0: 'Offline',
  1: 'Online',
  2: 'Iniciando',
  3: 'Parando',
  4: 'Reiniciando',
  5: 'Salvando',
  6: 'Carregando',
  7: 'Travado',
  8: 'Desconhecido',
  10: 'Preparando',
};

export default function ServerCard({ server, isAdmin, onUpdate }: ServerCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1:
        return 'bg-green-500';
      case 0:
        return 'bg-red-500';
      case 2:
      case 4:
      case 5:
      case 6:
      case 10:
        return 'bg-yellow-500';
      default:
        return 'bg-zinc-500';
    }
  };

  const handleAction = async (action: 'start' | 'stop' | 'restart') => {
    setLoading(true);
    setError(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/servers/${server.id}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} server`);
      }

      onUpdate();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-zinc-800 rounded-lg shadow-md">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {server.name}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {server.address}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${getStatusColor(server.status)}`}></span>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {STATUS_NAMES[server.status] || 'Desconhecido'}
          </span>
        </div>
      </div>

      {server.players && (
        <div className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Jogadores: {server.players.count}/{server.players.max}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => handleAction('start')}
          disabled={loading || server.status === 1}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          Iniciar
        </button>
        <button
          onClick={() => handleAction('stop')}
          disabled={loading || server.status === 0}
          className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          Parar
        </button>
        {isAdmin && (
          <button
            onClick={() => handleAction('restart')}
            disabled={loading || server.status === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Reiniciar
          </button>
        )}
      </div>
    </div>
  );
}
