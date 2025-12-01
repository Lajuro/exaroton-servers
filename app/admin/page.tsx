'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import { AdminSkeleton } from '@/components/AdminSkeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  Users, 
  Shield, 
  Server as ServerIcon, 
  Search, 
  Settings, 
  UserCog,
  Crown,
  User,
  Pencil,
  Check,
  X,
  ChevronDown,
  ShieldCheck,
  UserCheck,
  BarChart3,
  ArrowDownAZ,
  Clock
} from 'lucide-react';
import { ActionHistory } from '@/components/ActionHistory';

interface User {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  isAdmin: boolean;
  createdAt: string;
  serverAccess: string[];
}

interface Server {
  id: string;
  name: string;
  address: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  
  const [users, setUsers] = useState<User[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'servers'>('name');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user'>('user');
  const [selectedServers, setSelectedServers] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && !user.isAdmin) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      const [usersRes, serversRes] = await Promise.all([
        fetch('/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/servers', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!usersRes.ok) throw new Error(t('fetchUsersError'));
      if (!serversRes.ok) throw new Error(t('fetchServersError'));

      const usersData = await usersRes.json();
      const serversData = await serversRes.json();

      setUsers(usersData.users || []);
      setServers(serversData.servers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('errorOccurred'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchData();
    }
  }, [user?.isAdmin, fetchData]);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query)
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'role':
          if (a.isAdmin !== b.isAdmin) {
            return a.isAdmin ? -1 : 1;
          }
          return (a.name || '').localeCompare(b.name || '');
        
        case 'servers':
          const aServers = a.serverAccess?.length || 0;
          const bServers = b.serverAccess?.length || 0;
          if (aServers !== bServers) {
            return bServers - aServers;
          }
          return (a.name || '').localeCompare(b.name || '');
        
        case 'name':
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });

    return sorted;
  }, [users, searchQuery, sortBy]);

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setSelectedRole(user.isAdmin ? 'admin' : 'user');
    setSelectedServers(user.serverAccess || []);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    setIsSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Not authenticated');

      // Update role
      const roleRes = await fetch(`/api/users/${editingUser.id}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isAdmin: selectedRole === 'admin' }),
      });

      if (!roleRes.ok) throw new Error(t('updateRoleError'));

      // Update server access
      const accessRes = await fetch(`/api/users/${editingUser.id}/server-access`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serverAccess: selectedServers }),
      });

      if (!accessRes.ok) throw new Error(t('updateAccessError'));

      toast({
        title: t('userUpdated'),
        description: t('userUpdatedDesc', { name: editingUser.name }),
      });

      setEditingUser(null);
      fetchData();
    } catch (err) {
      toast({
        title: t('updateError'),
        description: err instanceof Error ? err.message : tCommon('errorOccurred'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  };

  const getServerName = (serverId: string) => {
    return servers.find(s => s.id === serverId)?.name || serverId;
  };

  // Stats
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.isAdmin).length;
  const totalServers = servers.length;

  if (authLoading || !user?.isAdmin) {
    return <AdminSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section - Compact */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">{t('title')}</h2>
              <p className="text-xs text-muted-foreground">{t('description')}</p>
            </div>
          </div>
          <Button
            onClick={fetchData}
            variant="outline"
            size="sm"
            disabled={loading}
            className="group gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
            )}
            <span className="hidden sm:inline">{tCommon('refresh')}</span>
          </Button>
        </div>

        {/* Search and Filter */}
        {!loading && users.length > 0 && (
          <div className="flex gap-2 sm:gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder={t('searchUserPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm border-muted-foreground/20 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
              />
            </div>
            <Select value={sortBy} onValueChange={(value: 'name' | 'role' | 'servers') => setSortBy(value)}>
              <SelectTrigger className="w-[100px] sm:w-[140px] h-9 sm:h-10 text-xs sm:text-sm border-muted-foreground/20 hover:border-primary/50 transition-colors">
                <SelectValue placeholder={tCommon('sort')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">
                  <div className="flex items-center gap-2">
                    <ArrowDownAZ className="h-3.5 w-3.5" />
                    <span className="text-xs sm:text-sm">{t('sortByName')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="role">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span className="text-xs sm:text-sm">{t('sortByRole')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="servers">
                  <div className="flex items-center gap-2">
                    <ServerIcon className="h-3.5 w-3.5" />
                    <span className="text-xs sm:text-sm">{t('sortByServers')}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Stats Cards */}
        {!loading && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            <Card className="relative border hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="relative p-2.5 sm:p-3 md:p-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  </div>
                  <div className="flex-1 text-center sm:text-left min-w-0 space-y-0.5 sm:space-y-1">
                    <p className="text-[9px] sm:text-xs font-semibold text-muted-foreground/80 leading-tight">{t('users.title')}</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-br from-blue-500 to-blue-600 bg-clip-text text-transparent">{totalUsers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative border hover:border-amber-500/50 transition-all hover:shadow-lg hover:shadow-amber-500/10 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {adminCount > 0 && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/50 via-yellow-500/50 to-amber-500/50" />
              )}
              <CardContent className="relative p-2.5 sm:p-3 md:p-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-3">
                  <div className="p-2 bg-gradient-to-br from-amber-500/20 to-amber-500/5 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                  </div>
                  <div className="flex-1 text-center sm:text-left min-w-0 space-y-0.5 sm:space-y-1">
                    <p className="text-[9px] sm:text-xs font-semibold text-muted-foreground/80 leading-tight">Admins</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-br from-amber-500 to-amber-600 bg-clip-text text-transparent">{adminCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="relative border hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10 group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="relative p-2.5 sm:p-3 md:p-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-1.5 sm:gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                    <ServerIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                  </div>
                  <div className="flex-1 text-center sm:text-left min-w-0 space-y-0.5 sm:space-y-1">
                    <p className="text-[9px] sm:text-xs font-semibold text-muted-foreground/80 leading-tight">{t('servers.title')}</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-br from-purple-500 to-purple-600 bg-clip-text text-transparent">{totalServers}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">{t('loadingData')}</p>
            </div>
          </div>
        ) : error ? (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="text-center py-12 space-y-4">
                <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-destructive">{t('errorLoadingData')}</p>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">{error}</p>
                </div>
                <Button
                  onClick={fetchData}
                  variant="destructive"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  {t('tryAgain')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : users.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="pt-6">
              <div className="text-center py-16 space-y-4">
                <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="text-xl font-medium">{t('noUsersFound')}</p>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {t('usersWillAppear')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : filteredAndSortedUsers.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="pt-6">
              <div className="text-center py-12 space-y-4">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium">{t('noUsersFound')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('noResultsFor', { query: searchQuery })}
                  </p>
                </div>
                <Button
                  onClick={() => setSearchQuery('')}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  {t('clearSearch')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Results counter */}
            {(searchQuery || sortBy !== 'name') && (
              <div className="flex items-center justify-between px-1">
                <p className="text-sm text-muted-foreground">
                  {t('showingUsers', { shown: filteredAndSortedUsers.length, total: users.length })}
                </p>
                {searchQuery && (
                  <Button
                    onClick={() => setSearchQuery('')}
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                  >
                    <RefreshCw className="h-3 w-3" />
                    {t('clearFilters')}
                  </Button>
                )}
              </div>
            )}

            {/* User List */}
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {filteredAndSortedUsers.map((userItem, index) => (
                    <div 
                      key={userItem.id} 
                      className="p-4 hover:bg-muted/50 transition-colors"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                          <AvatarImage src={userItem.photoURL} alt={userItem.name} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-medium">
                            {getInitials(userItem.name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{userItem.name}</p>
                            {userItem.isAdmin && (
                              <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20">
                                <Crown className="h-3 w-3" />
                                Admin
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{userItem.email}</p>
                        </div>

                        <div className="hidden sm:flex items-center gap-2 flex-wrap justify-end max-w-[300px] lg:max-w-[400px]">
                          {userItem.isAdmin ? (
                            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                              <Shield className="h-3 w-3 mr-1" />
                              {t('fullAccess')}
                            </Badge>
                          ) : userItem.serverAccess?.length > 0 ? (
                            userItem.serverAccess.map(serverId => (
                              <Badge key={serverId} variant="outline" className="text-xs gap-1">
                                <ServerIcon className="h-3 w-3" />
                                {getServerName(serverId)}
                              </Badge>
                            ))
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              {t('noAccess')}
                            </Badge>
                          )}
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5"
                              onClick={() => handleEditUser(userItem)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">{tCommon('edit')}</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={editingUser?.photoURL} />
                                  <AvatarFallback>{editingUser && getInitials(editingUser.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <span>{editingUser?.name}</span>
                                  <p className="text-sm font-normal text-muted-foreground">{editingUser?.email}</p>
                                </div>
                              </DialogTitle>
                            </DialogHeader>
                            
                            <div className="space-y-6 py-4">
                              {/* Role Selection */}
                              <div className="space-y-3">
                                <Label className="text-sm font-medium">{t('role')}</Label>
                                <div className="grid grid-cols-2 gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedRole('user')}
                                    className={`p-3 rounded-lg border-2 transition-all ${
                                      selectedRole === 'user'
                                        ? 'border-primary bg-primary/5'
                                        : 'border-muted hover:border-muted-foreground/50'
                                    }`}
                                  >
                                    <User className="h-5 w-5 mx-auto mb-1" />
                                    <p className="text-sm font-medium">{t('user')}</p>
                                    <p className="text-xs text-muted-foreground">{t('limitedAccess')}</p>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSelectedRole('admin')}
                                    className={`p-3 rounded-lg border-2 transition-all ${
                                      selectedRole === 'admin'
                                        ? 'border-amber-500 bg-amber-500/5'
                                        : 'border-muted hover:border-muted-foreground/50'
                                    }`}
                                  >
                                    <Crown className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                                    <p className="text-sm font-medium">Admin</p>
                                    <p className="text-xs text-muted-foreground">{t('fullAccess')}</p>
                                  </button>
                                </div>
                              </div>

                              {/* Server Access */}
                              {selectedRole === 'user' && (
                                <div className="space-y-3">
                                  <Label className="text-sm font-medium">{t('serverAccess')}</Label>
                                  <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border p-3">
                                    {servers.length === 0 ? (
                                      <p className="text-sm text-muted-foreground text-center py-2">
                                        {t('noServersAvailable')}
                                      </p>
                                    ) : (
                                      servers.map(server => (
                                        <label
                                          key={server.id}
                                          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                                        >
                                          <Checkbox
                                            checked={selectedServers.includes(server.id)}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                setSelectedServers([...selectedServers, server.id]);
                                              } else {
                                                setSelectedServers(selectedServers.filter(id => id !== server.id));
                                              }
                                            }}
                                          />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{server.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{server.address}</p>
                                          </div>
                                        </label>
                                      ))
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {t('serversSelected', { count: selectedServers.length })}
                                  </p>
                                </div>
                              )}

                              {selectedRole === 'admin' && (
                                <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
                                  <div className="flex gap-2">
                                    <Shield className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                      <p className="text-sm font-medium text-amber-600 dark:text-amber-400">{t('adminAccess')}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {t('adminAccessDesc')}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <DialogFooter className="gap-2 sm:gap-0">
                              <DialogClose asChild>
                                <Button variant="outline" disabled={isSaving}>
                                  {tCommon('cancel')}
                                </Button>
                              </DialogClose>
                              <Button onClick={handleSaveUser} disabled={isSaving}>
                                {isSaving ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t('saving')}
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-4 w-4 mr-2" />
                                    {t('saveChanges')}
                                  </>
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action History Section */}
            <div className="mt-8">
              <ActionHistory limit={10} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
