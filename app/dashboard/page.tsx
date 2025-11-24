'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import ServerCard from '@/components/ServerCard';

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

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchServers = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/servers', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch servers');
      }

      setServers(data.servers || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchServers();
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-zinc-50 mx-auto"></div>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <nav className="bg-white dark:bg-zinc-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              Exaroton Servers
            </h1>
            <div className="flex items-center gap-4">
              {user.isAdmin && (
                <button
                  onClick={() => router.push('/admin')}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50"
                >
                  Administração
                </button>
              )}
              <div className="flex items-center gap-3">
                {user.photoURL && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="text-sm">
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {user.displayName}
                  </p>
                  {user.isAdmin && (
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      Administrador
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Seus Servidores
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {user.isAdmin
              ? 'Você tem acesso total a todos os servidores.'
              : 'Você pode iniciar servidores e pará-los quando não houver jogadores online.'}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-zinc-50 mx-auto"></div>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">Carregando servidores...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={fetchServers}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Tentar novamente
            </button>
          </div>
        ) : servers.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-zinc-800 rounded-lg shadow">
            <p className="text-zinc-600 dark:text-zinc-400">
              {user.isAdmin
                ? 'Nenhum servidor encontrado. Configure a API key do Exaroton.'
                : 'Você não tem acesso a nenhum servidor. Contate um administrador.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servers.map((server) => (
              <ServerCard
                key={server.id}
                server={server}
                isAdmin={user.isAdmin}
                onUpdate={fetchServers}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
