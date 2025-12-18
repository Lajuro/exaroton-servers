'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useTranslations } from 'next-intl';
import { Volume2, VolumeX } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const t = useTranslations('settings');
  const [playSuccessSound, setPlaySuccessSound] = useState(true);
  const [volume, setVolume] = useState(50);

  useEffect(() => {
    const stored = localStorage.getItem('playSuccessSound');
    if (stored !== null) {
      setPlaySuccessSound(stored === 'true');
    }
    
    const storedVolume = localStorage.getItem('successSoundVolume');
    if (storedVolume !== null) {
      setVolume(parseInt(storedVolume, 10));
    }
  }, []);

  const handleSoundToggle = (checked: boolean) => {
    setPlaySuccessSound(checked);
    localStorage.setItem('playSuccessSound', String(checked));
    
    // Play a test sound if enabling
    if (checked) {
      const audio = new Audio('/success_sound.wav');
      audio.volume = Math.max(0.1, volume / 100);
      audio.play().catch(e => console.error('Error playing sound:', e));
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    localStorage.setItem('successSoundVolume', String(newVolume));
  };

  const playTestSound = (vol: number) => {
    if (!playSuccessSound) return;
    const audio = new Audio('/success_sound.wav');
    audio.volume = Math.max(0.1, vol / 100);
    audio.play().catch(e => console.error('Error playing sound:', e));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex flex-col space-y-1">
              <Label htmlFor="sound-toggle" className="flex items-center gap-2">
                {playSuccessSound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                {t('sound.label')}
              </Label>
              <span className="text-xs text-muted-foreground">
                {t('sound.description')}
              </span>
            </div>
            <Switch
              id="sound-toggle"
              checked={playSuccessSound}
              onCheckedChange={handleSoundToggle}
            />
          </div>

          {playSuccessSound && (
            <div className="flex flex-col space-y-3 pt-2 px-1">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{t('sound.volume')}</Label>
                <span className="text-sm text-muted-foreground">{volume}%</span>
              </div>
              <Slider
                value={[volume]}
                min={10}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                onValueCommit={(val) => playTestSound(val[0])}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
