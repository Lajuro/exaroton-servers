'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Loader2, Shield, Server, AlertCircle, Search } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

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

  // Filter users by search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter(user =>
      user.email.toLowerCase().includes(query) ||
      user.displayName.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

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

      toast({
        title: 'Sucesso!',
        description: `Permissão de ${currentIsAdmin ? 'admin removida' : 'admin concedida'}.`,
      });

      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
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

      toast({
        title: 'Sucesso!',
        description: `Acesso ao servidor ${hasAccess ? 'removido' : 'concedido'}.`,
      });

      fetchData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      toast({
        title: 'Erro',
        description: message,
        variant: 'destructive',
      });
    }
  };

  if (authLoading || !currentUser || !currentUser.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-2">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Administração
          </h2>
          <p className="text-muted-foreground">
            Controle as permissões e acessos dos usuários do sistema.
          </p>
        </div>

        {loading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4 flex-1">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-9 w-28" />
                      <Skeleton className="h-9 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Usuários do Sistema</CardTitle>
              <CardDescription>
                {users.length} {users.length === 1 ? 'usuário cadastrado' : 'usuários cadastrados'}
              </CardDescription>
              <div className="relative mt-4 group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-muted-foreground/20 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Servidores com Acesso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? `Nenhum usuário encontrado com "${searchQuery}"` : 'Nenhum usuário cadastrado'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {user.photoURL && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.photoURL}
                              alt={user.displayName}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <span className="font-medium">{user.displayName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.isAdmin ? 'default' : 'secondary'}>
                          {user.isAdmin ? (
                            <>
                              <Shield className="h-3 w-3 mr-1" />
                              Administrador
                            </>
                          ) : (
                            'Usuário'
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.isAdmin ? (
                          <Badge variant="outline" className="text-xs">
                            Acesso Total
                          </Badge>
                        ) : user.serverAccess.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">Nenhum servidor</span>
                        ) : (
                          <div className="flex items-center gap-1 flex-wrap max-w-[200px]">
                            {user.serverAccess.slice(0, 2).map((serverId) => {
                              const server = servers.find(s => s.id === serverId);
                              return server ? (
                                <Badge 
                                  key={serverId} 
                                  variant="secondary" 
                                  className="text-xs px-2 py-0.5"
                                >
                                  {server.name}
                                </Badge>
                              ) : null;
                            })}
                            {user.serverAccess.length > 2 && (
                              <Badge 
                                variant="outline" 
                                className="text-xs px-2 py-0.5 cursor-help"
                                title={`E mais ${user.serverAccess.length - 2} servidor(es)`}
                              >
                                +{user.serverAccess.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => toggleUserRole(user.uid, user.isAdmin)}
                            disabled={user.uid === currentUser.uid}
                            variant={user.isAdmin ? 'destructive' : 'default'}
                            size="sm"
                          >
                            {user.isAdmin ? 'Remover Admin' : 'Tornar Admin'}
                          </Button>
                          {!user.isAdmin && (
                            <Dialog open={dialogOpen && selectedUser?.uid === user.uid} onOpenChange={(open) => {
                              setDialogOpen(open);
                              if (!open) setSelectedUser(null);
                            }}>
                              <DialogTrigger asChild>
                                <Button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setDialogOpen(true);
                                  }}
                                  variant="outline"
                                  size="sm"
                                >
                                  <Server className="h-4 w-4 mr-2" />
                                  Acessos
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[525px]">
                                <DialogHeader>
                                  <DialogTitle>Gerenciar Acessos</DialogTitle>
                                  <DialogDescription>
                                    Controle quais servidores {user.displayName} pode acessar
                                  </DialogDescription>
                                </DialogHeader>
                                <Separator />
                                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                  {servers.map((server) => {
                                    const hasAccess = user.serverAccess.includes(server.id);
                                    return (
                                      <div
                                        key={server.id}
                                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                      >
                                        <div className="flex items-center gap-2">
                                          <Server className="h-4 w-4 text-muted-foreground" />
                                          <span className="font-medium">{server.name}</span>
                                        </div>
                                        <Button
                                          onClick={() => toggleServerAccess(user.uid, server.id, hasAccess)}
                                          variant={hasAccess ? 'destructive' : 'default'}
                                          size="sm"
                                        >
                                          {hasAccess ? 'Remover' : 'Conceder'}
                                        </Button>
                                      </div>
                                    );
                                  })}
                                </div>
                                <DialogFooter>
                                  <Button onClick={() => {
                                    setDialogOpen(false);
                                    setSelectedUser(null);
                                  }} variant="outline">
                                    Fechar
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
