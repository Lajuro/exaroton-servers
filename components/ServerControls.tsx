'use client';

import { useState } from 'react';
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

const STATUS_NAMES: Record<number, string> = {
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

export function ServerControls({
  serverStatus,
  actionLoading,
  sendingCommand,
  onAction,
  onSendCommand,
  isAdmin = false,
  variant = 'card',
}: ServerControlsProps) {
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
      {/* Botão Iniciar - Aparece quando offline */}
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
            {isStarting ? STATUS_NAMES[serverStatus] : 'Iniciar Servidor'}
          </span>
          {isStarting && (
            <Badge variant="outline" className="ml-auto animate-pulse">
              {STATUS_NAMES[serverStatus]}...
            </Badge>
          )}
        </Button>
      )}
      
      {/* Botão Parar - Aparece quando online ou parando */}
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
            {isStopping ? 'Parando...' : 'Parar Servidor'}
          </span>
        </Button>
      )}
      
      {/* Botão Reiniciar - Só aparece quando online */}
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
            <span className="flex-1 text-left">Reiniciar</span>
          </Button>
        </>
      )}

      {/* Botão Enviar Comando - Só aparece quando online */}
      {isOnline && (
        <Button
          className="w-full justify-start gap-3 h-12"
          variant="secondary"
          onClick={() => setCommandDialog(true)}
          disabled={actionLoading !== null || sendingCommand}
        >
          <Terminal className="h-4 w-4" />
          <span className="flex-1 text-left">Enviar Comando</span>
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
            Enviar Comando
          </DialogTitle>
          <DialogDescription>
            Execute comandos diretamente no servidor Minecraft
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Tipo de comando */}
          <div className="space-y-2">
            <Label>Tipo de Comando</Label>
            <Select value={commandType} onValueChange={(v) => setCommandType(v as CommandType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    Comando Personalizado
                  </div>
                </SelectItem>
                <SelectItem value="message">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Enviar Mensagem
                  </div>
                </SelectItem>
                <SelectItem value="time">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Mudar Horário
                  </div>
                </SelectItem>
                <SelectItem value="weather">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    Mudar Clima
                  </div>
                </SelectItem>
                <SelectItem value="gamemode">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="h-4 w-4" />
                    Modo de Jogo
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Input baseado no tipo */}
          {(commandType === 'custom' || commandType === 'message') && (
            <div className="space-y-2">
              <Label>
                {commandType === 'custom' ? 'Comando' : 'Mensagem'}
              </Label>
              <Input
                placeholder={commandType === 'custom' ? 'Ex: give @a diamond 64' : 'Digite a mensagem...'}
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendCommand()}
              />
              {commandType === 'custom' && (
                <p className="text-xs text-muted-foreground">
                  Não inclua a barra (/) no início do comando
                </p>
              )}
            </div>
          )}

          {commandType === 'time' && (
            <div className="space-y-2">
              <Label>Horário</Label>
              <Select value={commandOption} onValueChange={setCommandOption}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o horário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">🌅 Dia</SelectItem>
                  <SelectItem value="noon">☀️ Meio-dia</SelectItem>
                  <SelectItem value="night">🌙 Noite</SelectItem>
                  <SelectItem value="midnight">🌑 Meia-noite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {commandType === 'weather' && (
            <div className="space-y-2">
              <Label>Clima</Label>
              <Select value={commandOption} onValueChange={setCommandOption}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o clima" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clear">☀️ Limpo</SelectItem>
                  <SelectItem value="rain">🌧️ Chuva</SelectItem>
                  <SelectItem value="thunder">⛈️ Tempestade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {commandType === 'gamemode' && (
            <div className="space-y-2">
              <Label>Modo de Jogo (para todos)</Label>
              <Select value={commandOption} onValueChange={setCommandOption}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o modo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="survival">⚔️ Survival</SelectItem>
                  <SelectItem value="creative">🎨 Creative</SelectItem>
                  <SelectItem value="adventure">🗺️ Adventure</SelectItem>
                  <SelectItem value="spectator">👻 Spectator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setCommandDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSendCommand} disabled={sendingCommand}>
            {sendingCommand ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Executar
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
            Controles
          </CardTitle>
          <CardDescription>
            Gerencie o estado do servidor
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
