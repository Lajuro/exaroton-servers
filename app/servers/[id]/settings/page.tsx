'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import { PageTransition } from '@/components/GlobalLoading';
import { ServerSettingsSkeleton } from '@/components/ServerSettingsSkeleton';
import { AutomationConfig } from '@/components/automation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Settings,
  Wand2,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { ExarotonServer } from '@/types';

interface ServerSettingsPageProps {
  params: Promise<{ id: string }>;
}

export default function ServerSettingsPage({ params }: ServerSettingsPageProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations('serverSettings');
  const tCommon = useTranslations('common');
  
  const resolvedParams = use(params);
  const serverId = resolvedParams.id;
  
  const [server, setServer] = useState<ExarotonServer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && user && !user.isAdmin) {
      router.push(`/servers/${serverId}`);
    }
  }, [user, authLoading, router, serverId]);

  useEffect(() => {
    if (user && serverId) {
      fetchServerData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, serverId]);

  const fetchServerData = async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      
      const response = await fetch(`/api/servers/${serverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch server');
      }

      const data = await response.json();
      setServer(data.server);
      setError(null);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      if (error.message === 'Access denied') {
        router.push('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const isPageLoading = authLoading || loading;

  if (!user?.isAdmin && !isPageLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold mb-2">{t('accessDenied')}</h2>
              <p className="text-muted-foreground mb-6">{t('adminRequired')}</p>
              <Button onClick={() => router.push(`/servers/${serverId}`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('backToServer')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold mb-2">{tCommon('error')}</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('backToDashboard')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!server) return null;

  return (
    <PageTransition
      isLoading={isPageLoading}
      loadingComponent={<ServerSettingsSkeleton />}
    >
      <div className="min-h-screen bg-background">
        <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/servers/${serverId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  {t('title')}
                  <Badge variant="outline" className="font-normal">
                    {server.name}
                  </Badge>
                </h1>
                <p className="text-muted-foreground">{t('subtitle')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="automation" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="automation" className="gap-2">
              <Wand2 className="h-4 w-4" />
              {t('tabs.automation')}
            </TabsTrigger>
            {/* Future tabs */}
            {/* <TabsTrigger value="general" className="gap-2">
              <Server className="h-4 w-4" />
              {t('tabs.general')}
            </TabsTrigger> */}
          </TabsList>
          
          <TabsContent value="automation">
            <AutomationConfig
              serverId={serverId}
              serverName={server.name}
              serverStatus={server.status}
            />
          </TabsContent>
          
          {/* <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>{t('general.title')}</CardTitle>
                <CardDescription>{t('general.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{t('comingSoon')}</p>
              </CardContent>
            </Card>
          </TabsContent> */}
        </Tabs>
      </div>
      </div>
    </PageTransition>
  );
}
