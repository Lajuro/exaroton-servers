'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';

interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isAdmin: boolean;
  serverAccess: string[];
}

interface Server {
  id: string;
  name: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (!authLoading && (!currentUser || !currentUser.isAdmin)) {
      router.push('/dashboard');
    }
  }, [currentUser, authLoading, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const [usersResponse, serversResponse] = await Promise.all([
        fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/servers', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const usersData = await usersResponse.json();
      const serversData = await serversResponse.json();

      if (!usersResponse.ok) {
        throw new Error(usersData.error || 'Failed to fetch users');
      }
      if (!serversResponse.ok) {
        throw new Error(serversData.error || 'Failed to fetch servers');
      }

      setUsers(usersData.users || []);
      setServers(serversData.servers || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.isAdmin) {
      fetchData();
    }
  }, [currentUser]);

  const toggleUserRole = async (userId: string, currentIsAdmin: boolean) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAdmin: !currentIsAdmin }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user role');
      }

      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      alert(message);
    }
  };

  const toggleServerAccess = async (userId: string, serverId: string, hasAccess: boolean) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/users/${userId}/server-access`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverId,
          action: hasAccess ? 'revoke' : 'grant',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update server access');
      }

      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      alert(message);
    }
  };

  if (authLoading || !currentUser || !currentUser.isAdmin) {
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
              Administração
            </h1>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50"
            >
              ← Voltar ao Dashboard
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Gerenciar Usuários
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Controle as permissões e acessos dos usuários.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-zinc-50 mx-auto"></div>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">Carregando usuários...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Função
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-700">
                {users.map((user) => (
                  <tr key={user.uid}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.photoURL && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.photoURL}
                            alt={user.displayName}
                            className="w-8 h-8 rounded-full mr-3"
                          />
                        )}
                        <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                          {user.displayName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.isAdmin
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                            : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        {user.isAdmin ? 'Administrador' : 'Usuário'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => toggleUserRole(user.uid, user.isAdmin)}
                        disabled={user.uid === currentUser.uid}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {user.isAdmin ? 'Remover Admin' : 'Tornar Admin'}
                      </button>
                      {!user.isAdmin && (
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-300"
                        >
                          Gerenciar Acessos
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-zinc-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    Gerenciar Acesso - {selectedUser.displayName}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    Selecione os servidores que o usuário pode acessar
                  </p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                {servers.map((server) => {
                  const hasAccess = selectedUser.serverAccess.includes(server.id);
                  return (
                    <div
                      key={server.id}
                      className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-700 rounded"
                    >
                      <span className="text-sm text-zinc-900 dark:text-zinc-50">
                        {server.name}
                      </span>
                      <button
                        onClick={() => toggleServerAccess(selectedUser.uid, server.id, hasAccess)}
                        className={`px-4 py-2 rounded text-sm font-medium ${
                          hasAccess
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {hasAccess ? 'Remover Acesso' : 'Conceder Acesso'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-zinc-600 text-white rounded hover:bg-zinc-700"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
