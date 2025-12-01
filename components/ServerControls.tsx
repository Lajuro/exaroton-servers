'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play, 
  Square, 
  RotateCw, 
  Zap, 
  Terminal,
  Send,
  MessageSquare,
  Clock,
  Cloud,
  Gamepad2
} from 'lucide-react';

interface ServerControlsProps {
  serverStatus: number;
  actionLoading: string | null;
  sendingCommand: boolean;
  onAction: (action: 'start' | 'stop' | 'restart') => void;
  onSendCommand: (command: string) => void;
  isAdmin?: boolean;
  variant?: 'card' | 'inline';
}

type CommandType = 'custom' | 'message' | 'time' | 'weather' | 'gamemode';

export function ServerControls({
  serverStatus,
  actionLoading,
  sendingCommand,
  onAction,
  onSendCommand,
  isAdmin = false,
  variant = 'card',
}: ServerControlsProps) {
  const t = useTranslations('servers.commands');
  const tStatus = useTranslations('servers.status');
  const tCommon = useTranslations('common');
  
  const [commandDialog, setCommandDialog] = useState(false);
  const [commandType, setCommandType] = useState<CommandType>('custom');
  const [command, setCommand] = useState('');
  const [commandOption, setCommandOption] = useState('');

  const isOnline = serverStatus === 1;
  const isOffline = serverStatus === 0;
  const isStarting = serverStatus === 2 || serverStatus === 10 || serverStatus === 6;
  const isStopping = serverStatus === 3;
  const isRestarting = serverStatus === 4;
  const isTransitioning = isStarting || isStopping || isRestarting;

  const handleSendCommand = () => {
    let finalCommand = '';
    
    if (commandType === 'custom') {
      finalCommand = command.trim();
    } else if (commandType === 'message') {
      finalCommand = `say ${command.trim()}`;
    } else if (commandType === 'time') {
      finalCommand = `time set ${commandOption}`;
    } else if (commandType === 'weather') {
      finalCommand = `weather ${commandOption}`;
    } else if (commandType === 'gamemode') {
      finalCommand = `gamemode ${commandOption} @a`;
    }

    if (finalCommand) {
      onSendCommand(finalCommand);
      setCommand('');
      setCommandOption('');
      setCommandType('custom');
      setCommandDialog(false);
    }
  };

  const renderControls = () => (
    <div className="space-y-3">
      {/* Start Button - Appears when offline */}
      {(isOffline || isStarting) && (
        <Button
          className="w-full justify-start gap-3 h-12"
          variant="default"
          onClick={() => onAction('start')}
          disabled={actionLoading !== null || isStarting}
        >
          {actionLoading === 'start' || isStarting ? (
            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <span className="flex-1 text-left">
            {isStarting ? tStatus(String(serverStatus)) : t('startServer')}
          </span>
          {isStarting && (
            <Badge variant="outline" className="ml-auto animate-pulse">
              {tStatus(String(serverStatus))}...
            </Badge>
          )}
        </Button>
      )}
      
      {/* Stop Button - Appears when online or stopping */}
      {(isOnline || isStopping) && (
        <Button
          className="w-full justify-start gap-3 h-12"
          variant="destructive"
          onClick={() => onAction('stop')}
          disabled={actionLoading !== null || isStopping}
        >
          {actionLoading === 'stop' || isStopping ? (
            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Square className="h-4 w-4" />
          )}
          <span className="flex-1 text-left">
            {isStopping ? t('stopping') : t('stopServer')}
          </span>
        </Button>
      )}
      
      {/* Restart Button - Only appears when online */}
      {isOnline && (
        <>
          <Separator />
          <Button
            className="w-full justify-start gap-3 h-12"
            variant="outline"
            onClick={() => onAction('restart')}
            disabled={actionLoading !== null}
          >
            {actionLoading === 'restart' ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <RotateCw className="h-4 w-4" />
            )}
            <span className="flex-1 text-left">{tCommon('restart')}</span>
          </Button>
        </>
      )}

      {/* Send Command Button - Only appears when online */}
      {isOnline && (
        <Button
          className="w-full justify-start gap-3 h-12"
          variant="secondary"
          onClick={() => setCommandDialog(true)}
          disabled={actionLoading !== null || sendingCommand}
        >
          <Terminal className="h-4 w-4" />
          <span className="flex-1 text-left">{t('sendCommand')}</span>
        </Button>
      )}
    </div>
  );

  const commandDialogContent = (
    <Dialog open={commandDialog} onOpenChange={setCommandDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Command type */}
          <div className="space-y-2">
            <Label>{t('type')}</Label>
            <Select value={commandType} onValueChange={(v) => setCommandType(v as CommandType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    {t('custom')}
                  </div>
                </SelectItem>
                <SelectItem value="message">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {t('message')}
                  </div>
                </SelectItem>
                <SelectItem value="time">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {t('time')}
                  </div>
                </SelectItem>
                <SelectItem value="weather">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    {t('weather')}
                  </div>
                </SelectItem>
                <SelectItem value="gamemode">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4" />
                    {t('gamemode')}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Input based on type */}
          {(commandType === 'custom' || commandType === 'message') && (
            <div className="space-y-2">
              <Label>
                {commandType === 'custom' ? t('command') : t('messageLabel')}
              </Label>
              <Input
                placeholder={commandType === 'custom' ? t('commandPlaceholder') : t('messagePlaceholder')}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendCommand()}
              />
              {commandType === 'custom' && (
                <p className="text-xs text-muted-foreground">
                  {t('noSlashNote')}
                </p>
              )}
            </div>
          )}

          {commandType === 'time' && (
            <div className="space-y-2">
              <Label>{t('timeLabel')}</Label>
              <Select value={commandOption} onValueChange={setCommandOption}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectTime')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">🌅 {t('times.day')}</SelectItem>
                  <SelectItem value="noon">☀️ {t('times.noon')}</SelectItem>
                  <SelectItem value="night">🌙 {t('times.night')}</SelectItem>
                  <SelectItem value="midnight">🌑 {t('times.midnight')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {commandType === 'weather' && (
            <div className="space-y-2">
              <Label>{t('weatherLabel')}</Label>
              <Select value={commandOption} onValueChange={setCommandOption}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectWeather')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clear">☀️ {t('weathers.clear')}</SelectItem>
                  <SelectItem value="rain">🌧️ {t('weathers.rain')}</SelectItem>
                  <SelectItem value="thunder">⛈️ {t('weathers.thunder')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {commandType === 'gamemode' && (
            <div className="space-y-2">
              <Label>{t('gamemodeLabel')}</Label>
              <Select value={commandOption} onValueChange={setCommandOption}>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectGamemode')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="survival">⚔️ {t('gamemodes.survival')}</SelectItem>
                  <SelectItem value="creative">🎨 {t('gamemodes.creative')}</SelectItem>
                  <SelectItem value="adventure">🗺️ {t('gamemodes.adventure')}</SelectItem>
                  <SelectItem value="spectator">👻 {t('gamemodes.spectator')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setCommandDialog(false)}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={handleSendCommand} disabled={sendingCommand}>
            {sendingCommand ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {t('execute')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (variant === 'inline') {
    return (
      <>
        {renderControls()}
        {commandDialogContent}
      </>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5" />
            {t('controls')}
          </CardTitle>
          <CardDescription>
            {t('controlsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderControls()}
        </CardContent>
      </Card>
      {commandDialogContent}
    </>
  );
}
