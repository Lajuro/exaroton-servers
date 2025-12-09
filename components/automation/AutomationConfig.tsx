'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { auth } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { SequenceBuilder } from './SequenceBuilder';
import { ServerAutomation, AutomationSequence } from '@/types';
import {
  Wand2,
  Play,
  Power,
  Save,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutomationConfigProps {
  serverId: string;
  serverName: string;
  serverStatus: number;
}

export function AutomationConfig({ serverId, serverName, serverStatus }: AutomationConfigProps) {
  const t = useTranslations('automation');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  
  const [automation, setAutomation] = useState<Partial<ServerAutomation> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch automation config
  const fetchAutomation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await auth.currentUser?.getIdToken();
      
      const response = await fetch(`/api/servers/${serverId}/automations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 403) {
          setError(t('errors.adminRequired'));
          return;
        }
        throw new Error('Failed to fetch automation');
      }

      const data = await response.json();
      setAutomation(data.automation);
    } catch (err: any) {
      console.error('Error fetching automation:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [serverId, t]);

  useEffect(() => {
    fetchAutomation();
  }, [fetchAutomation]);

  // Save automation config
  const saveAutomation = async () => {
    if (!automation) return;
    
    try {
      setSaving(true);
      const token = await auth.currentUser?.getIdToken();
      
      const response = await fetch(`/api/servers/${serverId}/automations`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enabled: automation.enabled ?? false,
          onStart: automation.onStart,
          onStop: automation.onStop,
          onPlayerJoin: automation.onPlayerJoin,
          onPlayerLeave: automation.onPlayerLeave,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save automation');
      }

      toast({
        title: tCommon('success'),
        description: t('savedSuccessfully'),
      });
      setHasChanges(false);
    } catch (err: any) {
      console.error('Error saving automation:', err);
      toast({
        title: tCommon('error'),
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Test a sequence
  const testSequence = async (trigger: 'start' | 'stop') => {
    if (serverStatus !== 1) {
      toast({
        title: t('errors.serverMustBeOnline'),
        description: t('errors.serverMustBeOnlineDescription'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setTesting(trigger);
      const token = await auth.currentUser?.getIdToken();
      
      const response = await fetch(`/api/servers/${serverId}/automations/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trigger }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to execute automation');
      }

      if (data.executed) {
        toast({
          title: t('testSuccess'),
          description: t('testSuccessDescription', { 
            count: data.actionsExecuted,
            failed: data.actionsFailed 
          }),
        });
      } else {
        toast({
          title: t('testSkipped'),
          description: data.message,
        });
      }
    } catch (err: any) {
      console.error('Error testing automation:', err);
      toast({
        title: tCommon('error'),
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setTesting(null);
    }
  };

  // Update sequence
  const updateSequence = (key: keyof ServerAutomation, sequence: AutomationSequence) => {
    setAutomation(prev => ({
      ...prev,
      [key]: sequence,
    }));
    setHasChanges(true);
  };

  // Toggle global enabled
  const toggleEnabled = (enabled: boolean) => {
    setAutomation(prev => ({
      ...prev,
      enabled,
    }));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-lg font-medium text-destructive">{error}</p>
          <Button variant="outline" onClick={fetchAutomation} className="mt-4">
            <RotateCcw className="h-4 w-4 mr-2" />
            {tCommon('refresh')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20">
                <Wand2 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  {t('title')}
                  <Badge 
                    variant={automation?.enabled ? 'default' : 'secondary'}
                    className={cn(
                      automation?.enabled && 'bg-emerald-500 hover:bg-emerald-600'
                    )}
                  >
                    {automation?.enabled ? t('enabled') : t('disabled')}
                  </Badge>
                </CardTitle>
                <CardDescription className="mt-1">
                  {t('description', { serverName })}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="automation-enabled"
                  checked={automation?.enabled ?? false}
                  onCheckedChange={toggleEnabled}
                />
                <Label htmlFor="automation-enabled" className="font-medium">
                  {t('enableAutomation')}
                </Label>
              </div>
              <Button 
                onClick={saveAutomation} 
                disabled={saving || !hasChanges}
                className="gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {tCommon('save')}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {hasChanges && (
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{t('unsavedChanges')}</span>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Automation Sequences */}
      <Tabs defaultValue="onStart" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="onStart" className="gap-2">
            <Play className="h-4 w-4" />
            <span className="hidden sm:inline">{t('triggers.onStart')}</span>
            {automation?.onStart?.actions?.length ? (
              <Badge variant="secondary" className="ml-1">
                {automation.onStart.actions.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="onStop" className="gap-2">
            <Power className="h-4 w-4" />
            <span className="hidden sm:inline">{t('triggers.onStop')}</span>
            {automation?.onStop?.actions?.length ? (
              <Badge variant="secondary" className="ml-1">
                {automation.onStop.actions.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="onPlayerJoin" className="gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('triggers.onPlayerJoin')}</span>
            {automation?.onPlayerJoin?.actions?.length ? (
              <Badge variant="secondary" className="ml-1">
                {automation.onPlayerJoin.actions.length}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="onPlayerLeave" className="gap-2">
            <UserMinus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('triggers.onPlayerLeave')}</span>
            {automation?.onPlayerLeave?.actions?.length ? (
              <Badge variant="secondary" className="ml-1">
                {automation.onPlayerLeave.actions.length}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="onStart">
          <SequenceBuilder
            sequence={automation?.onStart}
            onChange={(seq) => updateSequence('onStart', seq)}
            triggerType="onStart"
            serverName={serverName}
            onTest={() => testSequence('start')}
            isTesting={testing === 'start'}
          />
        </TabsContent>
        
        <TabsContent value="onStop">
          <SequenceBuilder
            sequence={automation?.onStop}
            onChange={(seq) => updateSequence('onStop', seq)}
            triggerType="onStop"
            serverName={serverName}
            onTest={() => testSequence('stop')}
            isTesting={testing === 'stop'}
          />
        </TabsContent>

        <TabsContent value="onPlayerJoin">
          <SequenceBuilder
            sequence={automation?.onPlayerJoin}
            onChange={(seq) => updateSequence('onPlayerJoin', seq)}
            triggerType="onPlayerJoin"
            serverName={serverName}
          />
        </TabsContent>

        <TabsContent value="onPlayerLeave">
          <SequenceBuilder
            sequence={automation?.onPlayerLeave}
            onChange={(seq) => updateSequence('onPlayerLeave', seq)}
            triggerType="onPlayerLeave"
            serverName={serverName}
          />
        </TabsContent>
      </Tabs>

      {/* Quick Tips */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium mb-2">{t('tips.title')}</h4>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li>• {t('tips.tip1')}</li>
                <li>• {t('tips.tip2')}</li>
                <li>• {t('tips.tip3')}</li>
                <li>• {t('tips.tip4')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
