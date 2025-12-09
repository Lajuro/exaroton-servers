'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ActionBlock } from './ActionBlock';
import { AutomationSequence, AutomationAction, AutomationActionType } from '@/types';
import {
  Plus,
  Play,
  Zap,
  Terminal,
  Type,
  MessageSquare,
  Clock,
  Timer,
  Volume2,
  Sparkles,
  Sun,
  Cloud,
  Layers,
  Trash2,
  Save,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

interface SequenceBuilderProps {
  sequence: AutomationSequence | undefined;
  onChange: (sequence: AutomationSequence) => void;
  triggerType: 'onStart' | 'onStop' | 'onPlayerJoin' | 'onPlayerLeave';
  serverName: string;
  onTest?: () => void;
  isTesting?: boolean;
}

// Templates de ações por categoria
const actionTemplates: {
  category: string;
  categoryIcon: React.ReactNode;
  actions: {
    type: AutomationActionType;
    label: string;
    icon: React.ReactNode;
    defaultConfig: AutomationAction['config'];
  }[];
}[] = [
  {
    category: 'messages',
    categoryIcon: <MessageSquare className="h-4 w-4" />,
    actions: [
      {
        type: 'title',
        label: 'Title',
        icon: <Type className="h-4 w-4" />,
        defaultConfig: { text: '', color: 'gold', fadeIn: 10, stay: 70, fadeOut: 20 },
      },
      {
        type: 'subtitle',
        label: 'Subtitle',
        icon: <Type className="h-4 w-4" />,
        defaultConfig: { text: '', color: 'yellow' },
      },
      {
        type: 'actionbar',
        label: 'Action Bar',
        icon: <Type className="h-4 w-4" />,
        defaultConfig: { text: '', color: 'white' },
      },
      {
        type: 'message',
        label: 'Chat Message',
        icon: <MessageSquare className="h-4 w-4" />,
        defaultConfig: { text: '', color: 'white' },
      },
    ],
  },
  {
    category: 'timing',
    categoryIcon: <Clock className="h-4 w-4" />,
    actions: [
      {
        type: 'delay',
        label: 'Delay',
        icon: <Clock className="h-4 w-4" />,
        defaultConfig: { delaySeconds: 1 },
      },
      {
        type: 'countdown',
        label: 'Countdown',
        icon: <Timer className="h-4 w-4" />,
        defaultConfig: {
          countdownFrom: 5,
          countdownMessage: 'Server shutting down in {seconds}...',
          countdownInterval: 1,
          color: 'gold',
        },
      },
    ],
  },
  {
    category: 'effects',
    categoryIcon: <Sparkles className="h-4 w-4" />,
    actions: [
      {
        type: 'sound',
        label: 'Play Sound',
        icon: <Volume2 className="h-4 w-4" />,
        defaultConfig: { soundName: 'minecraft:entity.player.levelup', volume: 1, pitch: 1 },
      },
      {
        type: 'effect',
        label: 'Apply Effect',
        icon: <Sparkles className="h-4 w-4" />,
        defaultConfig: { effectName: 'minecraft:speed', duration: 30, amplifier: 0 },
      },
    ],
  },
  {
    category: 'world',
    categoryIcon: <Sun className="h-4 w-4" />,
    actions: [
      {
        type: 'time',
        label: 'Set Time',
        icon: <Sun className="h-4 w-4" />,
        defaultConfig: { timeValue: 1000 },
      },
      {
        type: 'weather',
        label: 'Set Weather',
        icon: <Cloud className="h-4 w-4" />,
        defaultConfig: { weatherType: 'clear', weatherDuration: 300 },
      },
    ],
  },
  {
    category: 'advanced',
    categoryIcon: <Terminal className="h-4 w-4" />,
    actions: [
      {
        type: 'command',
        label: 'Custom Command',
        icon: <Terminal className="h-4 w-4" />,
        defaultConfig: { command: '' },
      },
    ],
  },
];

const triggerConfig = {
  onStart: {
    icon: <Play className="h-5 w-5" />,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  onStop: {
    icon: <Zap className="h-5 w-5" />,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
  onPlayerJoin: {
    icon: <Plus className="h-5 w-5" />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  onPlayerLeave: {
    icon: <Layers className="h-5 w-5" />,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
};

export function SequenceBuilder({
  sequence,
  onChange,
  triggerType,
  serverName,
  onTest,
  isTesting,
}: SequenceBuilderProps) {
  const t = useTranslations('automation');
  const tCommon = useTranslations('common');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const config = triggerConfig[triggerType];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Criar sequência padrão se não existir
  const ensureSequence = useCallback((): AutomationSequence => {
    if (sequence) return sequence;
    return {
      id: uuidv4(),
      name: t(`triggers.${triggerType}`),
      description: '',
      enabled: true,
      actions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: '',
    };
  }, [sequence, triggerType, t]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const currentSequence = ensureSequence();
      const oldIndex = currentSequence.actions.findIndex(a => a.id === active.id);
      const newIndex = currentSequence.actions.findIndex(a => a.id === over.id);
      
      const newActions = arrayMove(currentSequence.actions, oldIndex, newIndex).map(
        (action, index) => ({ ...action, order: index })
      );
      
      onChange({
        ...currentSequence,
        actions: newActions,
        updatedAt: new Date(),
      });
      setHasUnsavedChanges(true);
    }
  };

  const addAction = (type: AutomationActionType, defaultConfig: AutomationAction['config']) => {
    const currentSequence = ensureSequence();
    const newAction: AutomationAction = {
      id: uuidv4(),
      type,
      order: currentSequence.actions.length,
      enabled: true,
      config: defaultConfig,
    };
    
    onChange({
      ...currentSequence,
      actions: [...currentSequence.actions, newAction],
      updatedAt: new Date(),
    });
    setHasUnsavedChanges(true);
  };

  const updateAction = (updatedAction: AutomationAction) => {
    const currentSequence = ensureSequence();
    onChange({
      ...currentSequence,
      actions: currentSequence.actions.map(a =>
        a.id === updatedAction.id ? updatedAction : a
      ),
      updatedAt: new Date(),
    });
    setHasUnsavedChanges(true);
  };

  const deleteAction = (actionId: string) => {
    const currentSequence = ensureSequence();
    onChange({
      ...currentSequence,
      actions: currentSequence.actions
        .filter(a => a.id !== actionId)
        .map((action, index) => ({ ...action, order: index })),
      updatedAt: new Date(),
    });
    setHasUnsavedChanges(true);
  };

  const duplicateAction = (actionId: string) => {
    const currentSequence = ensureSequence();
    const actionToDuplicate = currentSequence.actions.find(a => a.id === actionId);
    if (!actionToDuplicate) return;

    const newAction: AutomationAction = {
      ...actionToDuplicate,
      id: uuidv4(),
      order: currentSequence.actions.length,
    };

    onChange({
      ...currentSequence,
      actions: [...currentSequence.actions, newAction],
      updatedAt: new Date(),
    });
    setHasUnsavedChanges(true);
  };

  const clearAllActions = () => {
    const currentSequence = ensureSequence();
    onChange({
      ...currentSequence,
      actions: [],
      updatedAt: new Date(),
    });
    setHasUnsavedChanges(true);
  };

  const toggleEnabled = (enabled: boolean) => {
    const currentSequence = ensureSequence();
    onChange({
      ...currentSequence,
      enabled,
      updatedAt: new Date(),
    });
    setHasUnsavedChanges(true);
  };

  const updateName = (name: string) => {
    const currentSequence = ensureSequence();
    onChange({
      ...currentSequence,
      name,
      updatedAt: new Date(),
    });
    setHasUnsavedChanges(true);
  };

  const currentSequence = sequence || ensureSequence();
  const actions = currentSequence.actions || [];

  return (
    <Card className={cn('border-2', config.borderColor)}>
      <CardHeader className={cn('pb-4', config.bgColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-xl', config.bgColor, config.color)}>
              {config.icon}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Input
                  value={currentSequence.name || t(`triggers.${triggerType}`)}
                  onChange={(e) => updateName(e.target.value)}
                  className="h-8 w-48 bg-background/50"
                  placeholder={t(`triggers.${triggerType}`)}
                />
                {actions.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {actions.length} {t('actions')}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="mt-1">
                {t(`triggerDescriptions.${triggerType}`, { serverName })}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={currentSequence.enabled}
                onCheckedChange={toggleEnabled}
              />
              <Label className="text-sm">{t('enabled')}</Label>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {/* Action List */}
        <div className="space-y-3">
          {actions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-muted/20">
              <Layers className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium">{t('noActions')}</p>
              <p className="text-sm text-muted-foreground/70 mt-1 max-w-xs">
                {t('noActionsDescription')}
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={actions.map(a => a.id)}
                strategy={verticalListSortingStrategy}
              >
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-2 pr-4">
                    {actions
                      .sort((a, b) => a.order - b.order)
                      .map((action) => (
                        <ActionBlock
                          key={action.id}
                          action={action}
                          onUpdate={updateAction}
                          onDelete={() => deleteAction(action.id)}
                          onDuplicate={() => duplicateAction(action.id)}
                          triggerType={triggerType}
                        />
                      ))}
                  </div>
                </ScrollArea>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Add Action Dropdown */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                {t('addAction')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {actionTemplates.map((category, idx) => (
                <div key={category.category}>
                  {idx > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="flex items-center gap-2">
                    {category.categoryIcon}
                    {t(`categories.${category.category}`)}
                  </DropdownMenuLabel>
                  {category.actions.map((action) => (
                    <DropdownMenuItem
                      key={action.type}
                      onClick={() => addAction(action.type, action.defaultConfig)}
                      className="flex items-center gap-2"
                    >
                      {action.icon}
                      {t(`types.${action.type}`)}
                    </DropdownMenuItem>
                  ))}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {actions.length > 0 && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={clearAllActions}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {onTest && (
                <Button
                  variant="secondary"
                  onClick={onTest}
                  disabled={isTesting || !currentSequence.enabled}
                >
                  {isTesting ? (
                    <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {t('testSequence')}
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
