'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { AutomationAction, AutomationActionType } from '@/types';
import {
  GripVertical,
  Trash2,
  ChevronDown,
  Terminal,
  Type,
  MessageSquare,
  Clock,
  Timer,
  Volume2,
  Sparkles,
  Sun,
  Cloud,
  Copy,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ActionBlockProps {
  action: AutomationAction;
  onUpdate: (action: AutomationAction) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  triggerType?: 'onStart' | 'onStop' | 'onPlayerJoin' | 'onPlayerLeave';
}

// Configuração de tipos de ação
const actionTypeConfig: Record<AutomationActionType, {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  command: {
    icon: <Terminal className="h-4 w-4" />,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  title: {
    icon: <Type className="h-4 w-4" />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  subtitle: {
    icon: <Type className="h-4 w-4" />,
    color: 'text-sky-500',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
  },
  actionbar: {
    icon: <Type className="h-4 w-4" />,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
  },
  message: {
    icon: <MessageSquare className="h-4 w-4" />,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
  },
  delay: {
    icon: <Clock className="h-4 w-4" />,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  countdown: {
    icon: <Timer className="h-4 w-4" />,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
  },
  sound: {
    icon: <Volume2 className="h-4 w-4" />,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
  },
  effect: {
    icon: <Sparkles className="h-4 w-4" />,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
  time: {
    icon: <Sun className="h-4 w-4" />,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
  },
  weather: {
    icon: <Cloud className="h-4 w-4" />,
    color: 'text-slate-500',
    bgColor: 'bg-slate-500/10',
    borderColor: 'border-slate-500/30',
  },
};

// Cores do Minecraft
const minecraftColors = [
  { value: 'white', label: 'White', hex: '#FFFFFF' },
  { value: 'yellow', label: 'Yellow', hex: '#FFFF55' },
  { value: 'gold', label: 'Gold', hex: '#FFAA00' },
  { value: 'aqua', label: 'Aqua', hex: '#55FFFF' },
  { value: 'green', label: 'Green', hex: '#55FF55' },
  { value: 'blue', label: 'Blue', hex: '#5555FF' },
  { value: 'light_purple', label: 'Light Purple', hex: '#FF55FF' },
  { value: 'red', label: 'Red', hex: '#FF5555' },
  { value: 'gray', label: 'Gray', hex: '#AAAAAA' },
  { value: 'dark_gray', label: 'Dark Gray', hex: '#555555' },
  { value: 'dark_red', label: 'Dark Red', hex: '#AA0000' },
  { value: 'dark_green', label: 'Dark Green', hex: '#00AA00' },
  { value: 'dark_blue', label: 'Dark Blue', hex: '#0000AA' },
  { value: 'dark_purple', label: 'Dark Purple', hex: '#AA00AA' },
  { value: 'dark_aqua', label: 'Dark Aqua', hex: '#00AAAA' },
  { value: 'black', label: 'Black', hex: '#000000' },
];

export function ActionBlock({ action, onUpdate, onDelete, onDuplicate, triggerType }: ActionBlockProps) {
  const t = useTranslations('automation');
  const [isExpanded, setIsExpanded] = useState(true);
  
  const isPlayerTrigger = triggerType === 'onPlayerJoin' || triggerType === 'onPlayerLeave';
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: action.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeConfig = actionTypeConfig[action.type];

  const updateConfig = (key: string, value: any) => {
    onUpdate({
      ...action,
      config: {
        ...action.config,
        [key]: value,
      },
    });
  };

  const renderConfigFields = () => {
    switch (action.type) {
      case 'command':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">{t('fields.command')}</Label>
              <Input
                value={action.config.command || ''}
                onChange={(e) => updateConfig('command', e.target.value)}
                placeholder={t('placeholders.command')}
                className="font-mono text-sm mt-1"
              />
            </div>
          </div>
        );

      case 'title':
      case 'subtitle':
      case 'actionbar':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">{t('fields.text')}</Label>
              <Input
                value={action.config.text || ''}
                onChange={(e) => updateConfig('text', e.target.value)}
                placeholder={t('placeholders.text')}
                className="mt-1"
              />
              {isPlayerTrigger && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  💡 {t('hints.playerPlaceholder')}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">{t('fields.color')}</Label>
                <Select
                  value={action.config.color || 'white'}
                  onValueChange={(value) => updateConfig('color', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {minecraftColors.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full border border-white/20"
                            style={{ backgroundColor: color.hex }}
                          />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t('fields.target')}</Label>
                <Select
                  value={action.config.targetSelector || '@a'}
                  onValueChange={(value) => updateConfig('targetSelector', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isPlayerTrigger && (
                      <SelectItem value="{player}">{t('targets.triggeringPlayer')}</SelectItem>
                    )}
                    <SelectItem value="@a">{t('targets.allPlayers')}</SelectItem>
                    <SelectItem value="@p">{t('targets.nearestPlayer')}</SelectItem>
                    <SelectItem value="@r">{t('targets.randomPlayer')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={action.config.bold || false}
                  onCheckedChange={(checked) => updateConfig('bold', checked)}
                />
                <Label className="text-xs">{t('fields.bold')}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={action.config.italic || false}
                  onCheckedChange={(checked) => updateConfig('italic', checked)}
                />
                <Label className="text-xs">{t('fields.italic')}</Label>
              </div>
            </div>
            {action.type === 'title' && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">{t('fields.fadeIn')}</Label>
                  <Input
                    type="number"
                    value={action.config.fadeIn ?? 10}
                    onChange={(e) => updateConfig('fadeIn', parseInt(e.target.value) || 10)}
                    className="mt-1"
                    min={0}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t('fields.stay')}</Label>
                  <Input
                    type="number"
                    value={action.config.stay ?? 70}
                    onChange={(e) => updateConfig('stay', parseInt(e.target.value) || 70)}
                    className="mt-1"
                    min={0}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">{t('fields.fadeOut')}</Label>
                  <Input
                    type="number"
                    value={action.config.fadeOut ?? 20}
                    onChange={(e) => updateConfig('fadeOut', parseInt(e.target.value) || 20)}
                    className="mt-1"
                    min={0}
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 'message':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">{t('fields.message')}</Label>
              <Input
                value={action.config.text || ''}
                onChange={(e) => updateConfig('text', e.target.value)}
                placeholder={t('placeholders.message')}
                className="mt-1"
              />
              {isPlayerTrigger && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  💡 {t('hints.playerPlaceholder')}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">{t('fields.color')}</Label>
                <Select
                  value={action.config.color || 'white'}
                  onValueChange={(value) => updateConfig('color', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {minecraftColors.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full border border-white/20"
                            style={{ backgroundColor: color.hex }}
                          />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t('fields.target')}</Label>
                <Select
                  value={action.config.targetSelector || '@a'}
                  onValueChange={(value) => updateConfig('targetSelector', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isPlayerTrigger && (
                      <SelectItem value="{player}">{t('targets.triggeringPlayer')}</SelectItem>
                    )}
                    <SelectItem value="@a">{t('targets.allPlayers')}</SelectItem>
                    <SelectItem value="@p">{t('targets.nearestPlayer')}</SelectItem>
                    <SelectItem value="@r">{t('targets.randomPlayer')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'delay':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">{t('fields.delaySeconds')}</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  value={action.config.delaySeconds ?? 1}
                  onChange={(e) => updateConfig('delaySeconds', parseInt(e.target.value) || 1)}
                  min={1}
                  max={300}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">{t('fields.seconds')}</span>
              </div>
            </div>
          </div>
        );

      case 'countdown':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">{t('fields.countdownFrom')}</Label>
                <Input
                  type="number"
                  value={action.config.countdownFrom ?? 5}
                  onChange={(e) => updateConfig('countdownFrom', parseInt(e.target.value) || 5)}
                  min={1}
                  max={60}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t('fields.interval')}</Label>
                <Input
                  type="number"
                  value={action.config.countdownInterval ?? 1}
                  onChange={(e) => updateConfig('countdownInterval', parseInt(e.target.value) || 1)}
                  min={1}
                  max={10}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t('fields.countdownMessage')}</Label>
              <Input
                value={action.config.countdownMessage || '{seconds}'}
                onChange={(e) => updateConfig('countdownMessage', e.target.value)}
                placeholder="{seconds}"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">{t('hints.countdownMessage')}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t('fields.color')}</Label>
              <Select
                value={action.config.color || 'gold'}
                onValueChange={(value) => updateConfig('color', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {minecraftColors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full border border-white/20"
                          style={{ backgroundColor: color.hex }}
                        />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'sound':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">{t('fields.soundName')}</Label>
              <Input
                value={action.config.soundName || ''}
                onChange={(e) => updateConfig('soundName', e.target.value)}
                placeholder="minecraft:entity.player.levelup"
                className="font-mono text-sm mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">{t('fields.volume')}</Label>
                <Input
                  type="number"
                  value={action.config.volume ?? 1}
                  onChange={(e) => updateConfig('volume', parseFloat(e.target.value) || 1)}
                  min={0}
                  max={2}
                  step={0.1}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t('fields.pitch')}</Label>
                <Input
                  type="number"
                  value={action.config.pitch ?? 1}
                  onChange={(e) => updateConfig('pitch', parseFloat(e.target.value) || 1)}
                  min={0.5}
                  max={2}
                  step={0.1}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );

      case 'effect':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">{t('fields.effectName')}</Label>
              <Input
                value={action.config.effectName || ''}
                onChange={(e) => updateConfig('effectName', e.target.value)}
                placeholder="minecraft:speed"
                className="font-mono text-sm mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">{t('fields.duration')}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    value={action.config.duration ?? 30}
                    onChange={(e) => updateConfig('duration', parseInt(e.target.value) || 30)}
                    min={1}
                    max={1000000}
                  />
                  <span className="text-xs text-muted-foreground">s</span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t('fields.amplifier')}</Label>
                <Input
                  type="number"
                  value={action.config.amplifier ?? 0}
                  onChange={(e) => updateConfig('amplifier', parseInt(e.target.value) || 0)}
                  min={0}
                  max={255}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        );

      case 'time':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">{t('fields.timeValue')}</Label>
              <Select
                value={String(action.config.timeValue ?? 0)}
                onValueChange={(value) => updateConfig('timeValue', parseInt(value))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{t('time.dawn')} (0)</SelectItem>
                  <SelectItem value="1000">{t('time.day')} (1000)</SelectItem>
                  <SelectItem value="6000">{t('time.noon')} (6000)</SelectItem>
                  <SelectItem value="12000">{t('time.sunset')} (12000)</SelectItem>
                  <SelectItem value="13000">{t('time.night')} (13000)</SelectItem>
                  <SelectItem value="18000">{t('time.midnight')} (18000)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'weather':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">{t('fields.weatherType')}</Label>
              <Select
                value={action.config.weatherType || 'clear'}
                onValueChange={(value) => updateConfig('weatherType', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clear">{t('weather.clear')}</SelectItem>
                  <SelectItem value="rain">{t('weather.rain')}</SelectItem>
                  <SelectItem value="thunder">{t('weather.thunder')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t('fields.weatherDuration')}</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  value={action.config.weatherDuration ?? 300}
                  onChange={(e) => updateConfig('weatherDuration', parseInt(e.target.value) || 300)}
                  min={1}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">{t('fields.seconds')}</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'transition-all',
        isDragging && 'opacity-50 scale-105 z-50'
      )}
    >
      <Card
        className={cn(
          'border-2 overflow-hidden transition-all duration-200',
          typeConfig.borderColor,
          !action.enabled && 'opacity-50'
        )}
      >
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <div
            className={cn(
              'flex items-center gap-2 p-3',
              typeConfig.bgColor
            )}
          >
            {/* Drag handle */}
            <button
              className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded cursor-grab active:cursor-grabbing touch-none"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Icon */}
            <div className={cn('p-1.5 rounded-md', typeConfig.bgColor, typeConfig.color)}>
              {typeConfig.icon}
            </div>

            {/* Type label */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">
                  {t(`types.${action.type}`)}
                </span>
                {!action.enabled && (
                  <Badge variant="secondary" className="text-xs">
                    {t('disabled')}
                  </Badge>
                )}
              </div>
              {action.config.text && (
                <p className="text-xs text-muted-foreground truncate">
                  {action.config.text}
                </p>
              )}
              {action.config.command && (
                <p className="text-xs text-muted-foreground truncate font-mono">
                  /{action.config.command}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Switch
                checked={action.enabled}
                onCheckedChange={(checked) => onUpdate({ ...action, enabled: checked })}
                className="scale-75"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onDuplicate}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 transition-transform',
                      isExpanded && 'rotate-180'
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          <CollapsibleContent>
            <div className="p-4 border-t border-border/50 bg-background/50">
              {renderConfigFields()}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
