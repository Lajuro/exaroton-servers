'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Home, RefreshCw, Pickaxe, Trophy, Volume2, VolumeX, Package, X } from 'lucide-react';

// Tipos de blocos com cores estilo Minecraft
const BLOCK_TYPES = [
  { name: 'stone', displayName: 'Pedra', baseColor: '#7F7F7F', highlightColor: '#9D9D9D', shadowColor: '#5A5A5A', breakTime: 3, pattern: 'stone', drops: 'cobblestone' },
  { name: 'dirt', displayName: 'Terra', baseColor: '#8B5A2B', highlightColor: '#9B6A3B', shadowColor: '#6B3A1B', breakTime: 2, pattern: 'dirt', drops: 'dirt' },
  { name: 'grass', displayName: 'Grama', baseColor: '#5D9B2F', highlightColor: '#7DBB4F', shadowColor: '#3D7B0F', breakTime: 2, pattern: 'grass', drops: 'dirt' },
  { name: 'oak_log', displayName: 'Tronco', baseColor: '#6B5A3B', highlightColor: '#8B7A5B', shadowColor: '#4B3A1B', breakTime: 4, pattern: 'wood', drops: 'wood' },
  { name: 'cobblestone', displayName: 'Pedregulho', baseColor: '#6B6B6B', highlightColor: '#8B8B8B', shadowColor: '#4B4B4B', breakTime: 4, pattern: 'cobble', drops: 'cobblestone' },
  { name: 'sand', displayName: 'Areia', baseColor: '#DBCB8B', highlightColor: '#EBDB9B', shadowColor: '#BBAB6B', breakTime: 1, pattern: 'sand', drops: 'sand' },
  { name: 'gold_block', displayName: 'Ouro', baseColor: '#FCDB4A', highlightColor: '#FFEB6A', shadowColor: '#DCBB2A', breakTime: 5, pattern: 'ore', drops: 'gold' },
  { name: 'diamond_block', displayName: 'Diamante', baseColor: '#4AEDD9', highlightColor: '#6AFFEB', shadowColor: '#2ACDB9', breakTime: 6, pattern: 'ore', drops: 'diamond' },
  { name: 'emerald_block', displayName: 'Esmeralda', baseColor: '#50C878', highlightColor: '#70E898', shadowColor: '#30A858', breakTime: 6, pattern: 'ore', drops: 'emerald' },
  { name: 'redstone_block', displayName: 'Redstone', baseColor: '#AA0000', highlightColor: '#DD0000', shadowColor: '#770000', breakTime: 4, pattern: 'ore', drops: 'redstone' },
  { name: 'lapis_block', displayName: 'Lápis', baseColor: '#1E4A9A', highlightColor: '#3E6ABA', shadowColor: '#0E2A7A', breakTime: 5, pattern: 'ore', drops: 'lapis' },
  { name: 'bricks', displayName: 'Tijolos', baseColor: '#966464', highlightColor: '#B68484', shadowColor: '#764444', breakTime: 4, pattern: 'brick', drops: 'brick' },
];

// Materiais para inventário
const MATERIALS: Record<string, { name: string; color: string; icon: string }> = {
  cobblestone: { name: 'Pedregulho', color: '#6B6B6B', icon: '🪨' },
  dirt: { name: 'Terra', color: '#8B5A2B', icon: '🟫' },
  wood: { name: 'Madeira', color: '#6B5A3B', icon: '🪵' },
  sand: { name: 'Areia', color: '#DBCB8B', icon: '🟨' },
  gold: { name: 'Ouro', color: '#FCDB4A', icon: '🥇' },
  diamond: { name: 'Diamante', color: '#4AEDD9', icon: '💎' },
  emerald: { name: 'Esmeralda', color: '#50C878', icon: '💚' },
  redstone: { name: 'Redstone', color: '#AA0000', icon: '🔴' },
  lapis: { name: 'Lápis', color: '#1E4A9A', icon: '🔵' },
  brick: { name: 'Tijolo', color: '#966464', icon: '🧱' },
  stick: { name: 'Graveto', color: '#8B6914', icon: '🥢' },
};

// Receitas de picaretas
const PICKAXE_RECIPES = [
  { name: 'Picareta de Madeira', material: 'wood', speedMultiplier: 1.5, color: '#6B5A3B', tier: 1 },
  { name: 'Picareta de Pedra', material: 'cobblestone', speedMultiplier: 2, color: '#6B6B6B', tier: 2 },
  { name: 'Picareta de Ouro', material: 'gold', speedMultiplier: 3, color: '#FCDB4A', tier: 3 },
  { name: 'Picareta de Diamante', material: 'diamond', speedMultiplier: 4, color: '#4AEDD9', tier: 4 },
  { name: 'Picareta de Esmeralda', material: 'emerald', speedMultiplier: 5, color: '#50C878', tier: 5 },
];

interface Block {
  id: number;
  type: typeof BLOCK_TYPES[number];
  isBreaking: boolean;
  breakProgress: number;
  isBroken: boolean;
  x: number;
  y: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
}

interface Inventory {
  [key: string]: number;
}

interface EquippedPickaxe {
  name: string;
  speedMultiplier: number;
  color: string;
  tier: number;
}

// Padrão do "404" em blocos
const PATTERN_404 = [
  [1,0,0,1,0,0,1,1,1,0,0,1,0,0,1],
  [1,0,0,1,0,1,0,0,0,1,0,1,0,0,1],
  [1,1,1,1,0,1,0,0,0,1,0,1,1,1,1],
  [0,0,0,1,0,1,0,0,0,1,0,0,0,0,1],
  [0,0,0,1,0,1,0,0,0,1,0,0,0,0,1],
  [0,0,0,1,0,0,1,1,1,0,0,0,0,0,1],
];

export default function NotFound() {
  const t = useTranslations('notFound');
  
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [score, setScore] = useState(0);
  const [totalBlocks, setTotalBlocks] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCongrats, setShowCongrats] = useState(false);
  const [inventory, setInventory] = useState<Inventory>({});
  const [equippedPickaxe, setEquippedPickaxe] = useState<EquippedPickaxe | null>(null);
  const [showCrafting, setShowCrafting] = useState(false);
  const [craftingSlots, setCraftingSlots] = useState<(string | null)[]>([null, null, null, null, null, null, null, null, null]);
  const [craftedItem, setCraftedItem] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const breakIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const particleIdRef = useRef(0);

  // Inicializar blocos
  useEffect(() => {
    const newBlocks: Block[] = [];
    let id = 0;
    
    PATTERN_404.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 1) {
          const blockType = BLOCK_TYPES[Math.floor(Math.random() * BLOCK_TYPES.length)];
          newBlocks.push({
            id: id++,
            type: blockType,
            isBreaking: false,
            breakProgress: 0,
            isBroken: false,
            x,
            y,
          });
        }
      });
    });
    
    setBlocks(newBlocks);
    setTotalBlocks(newBlocks.length);
    // Dar alguns gravetos iniciais para craftar
    setInventory({ stick: 10, wood: 2 });
  }, []);

  // Verificar receita de crafting
  useEffect(() => {
    // Padrão da picareta: material no topo (0,1,2), gravetos no centro (4,7)
    const topRow = [craftingSlots[0], craftingSlots[1], craftingSlots[2]];
    const middleCenter = craftingSlots[4];
    const bottomCenter = craftingSlots[7];
    
    // Verificar se é padrão de picareta
    if (topRow[0] && topRow[0] === topRow[1] && topRow[1] === topRow[2] &&
        middleCenter === 'stick' && bottomCenter === 'stick' &&
        !craftingSlots[3] && !craftingSlots[5] && !craftingSlots[6] && !craftingSlots[8]) {
      
      const material = topRow[0];
      const recipe = PICKAXE_RECIPES.find(r => r.material === material);
      if (recipe) {
        setCraftedItem(`pickaxe_${material}`);
        return;
      }
    }
    
    // Receita de gravetos: 2 madeiras verticais = 4 gravetos
    if (craftingSlots[1] === 'wood' && craftingSlots[4] === 'wood' &&
        !craftingSlots[0] && !craftingSlots[2] && !craftingSlots[3] && 
        !craftingSlots[5] && !craftingSlots[6] && !craftingSlots[7] && !craftingSlots[8]) {
      setCraftedItem('sticks_4');
      return;
    }
    
    setCraftedItem(null);
  }, [craftingSlots]);

  // Verificar vitória
  useEffect(() => {
    if (totalBlocks > 0 && score === totalBlocks) {
      setShowCongrats(true);
    }
  }, [score, totalBlocks]);

  // Notificação temporária
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Criar partículas
  const createParticles = useCallback((x: number, y: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x: x + Math.random() * 40,
        y: y + Math.random() * 40,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 2,
        color,
        life: 1,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  // Atualizar partículas
  useEffect(() => {
    if (particles.length === 0) return;
    const interval = setInterval(() => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.5,
            life: p.life - 0.05,
          }))
          .filter(p => p.life > 0)
      );
    }, 30);
    return () => clearInterval(interval);
  }, [particles.length]);

  // Som de quebra
  const playBreakSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(150 + Math.random() * 100, audioContext.currentTime);
      oscillator.type = 'square';
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch { /* Audio não suportado */ }
  }, [soundEnabled]);

  // Som de craft
  const playCraftSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.type = 'square';
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch { /* Audio não suportado */ }
  }, [soundEnabled]);

  // Adicionar item ao inventário
  const addToInventory = useCallback((item: string, amount: number = 1) => {
    setInventory(prev => ({
      ...prev,
      [item]: (prev[item] || 0) + amount,
    }));
  }, []);

  // Iniciar quebra do bloco
  const startBreaking = useCallback((blockId: number) => {
    if (breakIntervalRef.current) {
      clearInterval(breakIntervalRef.current);
    }

    const speedMultiplier = equippedPickaxe?.speedMultiplier || 1;
    
    breakIntervalRef.current = setInterval(() => {
      setBlocks(prev => {
        const block = prev.find(b => b.id === blockId);
        if (!block || block.isBroken) {
          if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
          return prev;
        }

        const baseProgress = 100 / (block.type.breakTime * 10);
        const newProgress = block.breakProgress + (baseProgress * speedMultiplier);
        
        if (newProgress >= 100) {
          if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
          playBreakSound();
          setScore(s => s + 1);
          
          // Adicionar drop ao inventário
          addToInventory(block.type.drops);
          
          // Criar partículas
          const blockElement = document.getElementById(`block-${blockId}`);
          if (blockElement) {
            const rect = blockElement.getBoundingClientRect();
            createParticles(rect.left, rect.top, block.type.baseColor);
          }
          
          return prev.map(b => 
            b.id === blockId ? { ...b, isBroken: true, breakProgress: 100 } : b
          );
        }

        return prev.map(b => 
          b.id === blockId ? { ...b, isBreaking: true, breakProgress: newProgress } : b
        );
      });
    }, 50);
  }, [playBreakSound, createParticles, addToInventory, equippedPickaxe]);

  // Parar quebra
  const stopBreaking = useCallback(() => {
    if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
    setBlocks(prev => prev.map(b => ({ ...b, isBreaking: false, breakProgress: b.isBroken ? 100 : 0 })));
  }, []);

  // Adicionar item ao slot de crafting
  const addToCraftingSlot = useCallback((slotIndex: number, item: string) => {
    if (craftingSlots[slotIndex]) return; // Slot ocupado
    if (!inventory[item] || inventory[item] <= 0) return; // Sem itens
    
    setCraftingSlots(prev => {
      const newSlots = [...prev];
      newSlots[slotIndex] = item;
      return newSlots;
    });
    setInventory(prev => ({
      ...prev,
      [item]: prev[item] - 1,
    }));
  }, [craftingSlots, inventory]);

  // Remover item do slot de crafting
  const removeFromCraftingSlot = useCallback((slotIndex: number) => {
    const item = craftingSlots[slotIndex];
    if (!item) return;
    
    setCraftingSlots(prev => {
      const newSlots = [...prev];
      newSlots[slotIndex] = null;
      return newSlots;
    });
    addToInventory(item);
  }, [craftingSlots, addToInventory]);

  // Craftar item
  const craftItem = useCallback(() => {
    if (!craftedItem) return;
    
    playCraftSound();
    
    if (craftedItem.startsWith('pickaxe_')) {
      const material = craftedItem.replace('pickaxe_', '');
      const recipe = PICKAXE_RECIPES.find(r => r.material === material);
      if (recipe) {
        setEquippedPickaxe({
          name: recipe.name,
          speedMultiplier: recipe.speedMultiplier,
          color: recipe.color,
          tier: recipe.tier,
        });
        setNotification(`${recipe.name} equipada! Velocidade x${recipe.speedMultiplier}`);
      }
    } else if (craftedItem === 'sticks_4') {
      addToInventory('stick', 4);
      setNotification('+4 Gravetos!');
    }
    
    // Limpar slots de crafting
    setCraftingSlots([null, null, null, null, null, null, null, null, null]);
    setCraftedItem(null);
  }, [craftedItem, playCraftSound, addToInventory]);

  // Limpar mesa de crafting
  const clearCraftingTable = useCallback(() => {
    craftingSlots.forEach((item, index) => {
      if (item) {
        addToInventory(item);
      }
    });
    setCraftingSlots([null, null, null, null, null, null, null, null, null]);
  }, [craftingSlots, addToInventory]);

  // Reset do jogo
  const resetGame = useCallback(() => {
    const newBlocks: Block[] = [];
    let id = 0;
    
    PATTERN_404.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 1) {
          const blockType = BLOCK_TYPES[Math.floor(Math.random() * BLOCK_TYPES.length)];
          newBlocks.push({
            id: id++,
            type: blockType,
            isBreaking: false,
            breakProgress: 0,
            isBroken: false,
            x,
            y,
          });
        }
      });
    });
    
    setBlocks(newBlocks);
    setScore(0);
    setShowCongrats(false);
    setParticles([]);
    setInventory({ stick: 10, wood: 2 });
    setEquippedPickaxe(null);
    setCraftingSlots([null, null, null, null, null, null, null, null, null]);
  }, []);

  // Renderizar crack overlay
  const getCrackOverlay = (progress: number) => {
    if (progress < 15) return 0;
    return Math.min(Math.floor(progress / 15), 6);
  };

  // Gerar textura do bloco
  const getBlockTexture = (pattern: string, baseColor: string, highlight: string, shadow: string) => {
    const pixels: { x: number; y: number; color: string }[] = [];
    const size = 8;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        let color = baseColor;
        const rand = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453 % 1;
        
        switch (pattern) {
          case 'stone':
            if (rand > 0.7) color = highlight;
            else if (rand < 0.3) color = shadow;
            break;
          case 'dirt':
            if (rand > 0.8) color = highlight;
            else if (rand < 0.2) color = shadow;
            break;
          case 'grass':
            if (y < 2) color = rand > 0.5 ? '#5D9B2F' : '#4D8B1F';
            else color = rand > 0.6 ? '#8B5A2B' : '#7B4A1B';
            break;
          case 'wood':
            if (x === 0 || x === 7) color = shadow;
            else if (rand > 0.85) color = highlight;
            break;
          case 'cobble':
            if ((x + y) % 3 === 0) color = rand > 0.5 ? highlight : shadow;
            break;
          case 'sand':
            if (rand > 0.9) color = highlight;
            else if (rand < 0.1) color = shadow;
            break;
          case 'ore':
            if ((x === 2 || x === 5) && (y === 2 || y === 5)) color = highlight;
            else if ((x === 3 || x === 4) && (y === 3 || y === 4)) color = highlight;
            else if (rand > 0.8) color = highlight;
            break;
          case 'brick':
            if (y % 4 === 0 || (y % 2 === 0 && x % 4 === 0) || (y % 2 === 1 && (x + 2) % 4 === 0)) {
              color = shadow;
            }
            break;
        }
        
        pixels.push({ x, y, color });
      }
    }
    return pixels;
  };

  // Item selecionado para colocar no crafting
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 via-sky-300 to-green-400 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Notificação */}
      {notification && (
        <div 
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 animate-in slide-in-from-top-4 fade-in duration-300"
          style={{
            background: 'linear-gradient(to bottom, #3a3a3a 0%, #2a2a2a 100%)',
            border: '3px solid',
            borderTopColor: '#5a5a5a',
            borderLeftColor: '#4a4a4a',
            borderRightColor: '#1a1a1a',
            borderBottomColor: '#0a0a0a',
            color: '#5F5',
            textShadow: '1px 1px 0 #000',
            fontFamily: 'monospace',
          }}
        >
          {notification}
        </div>
      )}

      {/* Partículas */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="fixed pointer-events-none z-50"
          style={{
            left: particle.x,
            top: particle.y,
            width: 6,
            height: 6,
            backgroundColor: particle.color,
            opacity: particle.life,
            transform: `rotate(${particle.life * 180}deg)`,
            boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.3), inset -1px -1px 0 rgba(0,0,0,0.3)',
          }}
        />
      ))}

      {/* Header */}
      <div className="text-center mb-6 z-10">
        <div 
          className="inline-flex items-center gap-3 px-6 py-3 mb-4"
          style={{
            background: 'linear-gradient(to bottom, #4a4a4a 0%, #333333 50%, #2a2a2a 100%)',
            border: '3px solid',
            borderTopColor: '#6a6a6a',
            borderLeftColor: '#5a5a5a',
            borderRightColor: '#1a1a1a',
            borderBottomColor: '#0a0a0a',
            boxShadow: '0 4px 0 #000',
          }}
        >
          <Pickaxe className="h-6 w-6 text-amber-400" />
          <span style={{ color: '#FCFC54', textShadow: '2px 2px 0 #3F3F00', fontFamily: 'monospace' }} className="font-bold text-xl tracking-wider">
            {t('game.title')}
          </span>
        </div>
        <p style={{ color: '#fff', textShadow: '1px 1px 0 #000', fontFamily: 'monospace' }} className="text-sm">
          {t('game.subtitle')}
        </p>
      </div>

      {/* HUD Superior */}
      <div className="flex items-center gap-4 mb-4 z-10 flex-wrap justify-center">
        {/* Score */}
        <div 
          className="flex items-center gap-3 px-4 py-2"
          style={{
            background: 'linear-gradient(to bottom, #4a4a4a 0%, #333333 50%, #2a2a2a 100%)',
            border: '2px solid',
            borderTopColor: '#6a6a6a',
            borderLeftColor: '#5a5a5a',
            borderRightColor: '#1a1a1a',
            borderBottomColor: '#0a0a0a',
          }}
        >
          <Trophy className="h-5 w-5 text-yellow-400" />
          <span style={{ color: '#fff', textShadow: '1px 1px 0 #000' }} className="font-mono text-lg font-bold">
            {score}/{totalBlocks}
          </span>
        </div>

        {/* Picareta equipada */}
        <div 
          className="flex items-center gap-2 px-4 py-2"
          style={{
            background: 'linear-gradient(to bottom, #4a4a4a 0%, #333333 50%, #2a2a2a 100%)',
            border: '2px solid',
            borderTopColor: '#6a6a6a',
            borderLeftColor: '#5a5a5a',
            borderRightColor: '#1a1a1a',
            borderBottomColor: '#0a0a0a',
          }}
        >
          <Pickaxe className="h-5 w-5" style={{ color: equippedPickaxe?.color || '#888' }} />
          <span style={{ color: '#fff', textShadow: '1px 1px 0 #000', fontFamily: 'monospace' }} className="text-sm">
            {equippedPickaxe ? `x${equippedPickaxe.speedMultiplier}` : 'x1'}
          </span>
        </div>

        {/* Botão Crafting */}
        <button
          onClick={() => setShowCrafting(!showCrafting)}
          className="flex items-center gap-2 px-4 py-2 transition-all hover:brightness-110 active:translate-y-0.5"
          style={{
            background: showCrafting 
              ? 'linear-gradient(to bottom, #5B8731 0%, #4A7A28 50%, #3A6A18 100%)'
              : 'linear-gradient(to bottom, #4a4a4a 0%, #333333 50%, #2a2a2a 100%)',
            border: '2px solid',
            borderTopColor: showCrafting ? '#7BA751' : '#6a6a6a',
            borderLeftColor: showCrafting ? '#6B9741' : '#5a5a5a',
            borderRightColor: showCrafting ? '#2A5A08' : '#1a1a1a',
            borderBottomColor: showCrafting ? '#1A4A00' : '#0a0a0a',
          }}
        >
          <Package className="h-5 w-5 text-amber-400" />
          <span style={{ color: '#fff', textShadow: '1px 1px 0 #000', fontFamily: 'monospace' }} className="text-sm">
            Crafting
          </span>
        </button>

        {/* Som */}
        <button
          className="p-2 transition-transform hover:scale-110 active:scale-95"
          style={{
            background: 'linear-gradient(to bottom, #4a4a4a 0%, #333333 50%, #2a2a2a 100%)',
            border: '2px solid',
            borderTopColor: '#6a6a6a',
            borderLeftColor: '#5a5a5a',
            borderRightColor: '#1a1a1a',
            borderBottomColor: '#0a0a0a',
          }}
          onClick={() => setSoundEnabled(!soundEnabled)}
        >
          {soundEnabled ? <Volume2 className="h-5 w-5 text-white" /> : <VolumeX className="h-5 w-5 text-gray-400" />}
        </button>
      </div>

      {/* Mesa de Crafting */}
      {showCrafting && (
        <div 
          className="mb-4 p-4 z-20"
          style={{
            background: 'linear-gradient(to bottom, #3a3a3a 0%, #2a2a2a 100%)',
            border: '4px solid',
            borderTopColor: '#5a5a5a',
            borderLeftColor: '#4a4a4a',
            borderRightColor: '#0a0a0a',
            borderBottomColor: '#000',
            boxShadow: '0 4px 0 #000',
          }}
        >
          <div className="flex items-start gap-6">
            {/* Inventário */}
            <div>
              <p style={{ color: '#AAA', textShadow: '1px 1px 0 #000', fontFamily: 'monospace' }} className="text-xs mb-2 text-center">
                {t('game.inventory')}
              </p>
              <div className="grid grid-cols-5 gap-1">
                {Object.entries(inventory).filter(([_, count]) => count > 0).map(([item, count]) => (
                  <button
                    key={item}
                    onClick={() => setSelectedItem(selectedItem === item ? null : item)}
                    className={`w-10 h-10 flex flex-col items-center justify-center transition-all ${selectedItem === item ? 'scale-110' : 'hover:scale-105'}`}
                    style={{
                      background: selectedItem === item 
                        ? 'linear-gradient(to bottom, #5a5a5a 0%, #4a4a4a 100%)'
                        : 'linear-gradient(to bottom, #3a3a3a 0%, #2a2a2a 100%)',
                      border: '2px solid',
                      borderTopColor: selectedItem === item ? '#8a8a8a' : '#4a4a4a',
                      borderLeftColor: selectedItem === item ? '#7a7a7a' : '#3a3a3a',
                      borderRightColor: '#1a1a1a',
                      borderBottomColor: '#0a0a0a',
                    }}
                    title={t(`game.materials.${item}`)}
                  >
                    <span className="text-lg">{MATERIALS[item]?.icon || '📦'}</span>
                    <span style={{ color: '#fff', fontSize: '10px', textShadow: '1px 1px 0 #000' }}>{count}</span>
                  </button>
                ))}
              </div>
              {selectedItem && (
                <p style={{ color: '#5F5', textShadow: '1px 1px 0 #000', fontFamily: 'monospace' }} className="text-xs mt-2 text-center">
                  {t('game.selected', { item: t(`game.materials.${selectedItem}`) })}
                </p>
              )}
            </div>

            {/* Grid de Crafting 3x3 */}
            <div>
              <p style={{ color: '#AAA', textShadow: '1px 1px 0 #000', fontFamily: 'monospace' }} className="text-xs mb-2 text-center">
                {t('game.craftingTable')}
              </p>
              <div className="grid grid-cols-3 gap-1">
                {craftingSlots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (slot) {
                        removeFromCraftingSlot(index);
                      } else if (selectedItem) {
                        addToCraftingSlot(index, selectedItem);
                      }
                    }}
                    className="w-10 h-10 flex items-center justify-center transition-all hover:brightness-110"
                    style={{
                      background: slot 
                        ? `linear-gradient(to bottom, ${MATERIALS[slot]?.color || '#555'}88, ${MATERIALS[slot]?.color || '#333'})`
                        : 'linear-gradient(to bottom, #2a2a2a 0%, #1a1a1a 100%)',
                      border: '2px solid',
                      borderTopColor: '#4a4a4a',
                      borderLeftColor: '#3a3a3a',
                      borderRightColor: '#0a0a0a',
                      borderBottomColor: '#000',
                    }}
                  >
                    {slot && <span className="text-lg">{MATERIALS[slot]?.icon || '📦'}</span>}
                  </button>
                ))}
              </div>
              <button
                onClick={clearCraftingTable}
                className="mt-2 w-full text-xs py-1 transition-all hover:brightness-110"
                style={{
                  background: 'linear-gradient(to bottom, #5a3a3a 0%, #4a2a2a 100%)',
                  border: '2px solid',
                  borderTopColor: '#7a5a5a',
                  borderLeftColor: '#6a4a4a',
                  borderRightColor: '#2a0a0a',
                  borderBottomColor: '#1a0000',
                  color: '#fff',
                  textShadow: '1px 1px 0 #000',
                  fontFamily: 'monospace',
                }}
              >
                Limpar
              </button>
            </div>

            {/* Resultado */}
            <div className="flex flex-col items-center">
              <p style={{ color: '#AAA', textShadow: '1px 1px 0 #000', fontFamily: 'monospace' }} className="text-xs mb-2">
                {t('game.result')}
              </p>
              <button
                onClick={craftItem}
                disabled={!craftedItem}
                className={`w-12 h-12 flex items-center justify-center transition-all ${craftedItem ? 'hover:scale-110 animate-pulse' : 'opacity-50'}`}
                style={{
                  background: craftedItem 
                    ? 'linear-gradient(to bottom, #5B8731 0%, #4A7A28 100%)'
                    : 'linear-gradient(to bottom, #2a2a2a 0%, #1a1a1a 100%)',
                  border: '3px solid',
                  borderTopColor: craftedItem ? '#7BA751' : '#4a4a4a',
                  borderLeftColor: craftedItem ? '#6B9741' : '#3a3a3a',
                  borderRightColor: craftedItem ? '#2A5A08' : '#0a0a0a',
                  borderBottomColor: craftedItem ? '#1A4A00' : '#000',
                }}
              >
                {craftedItem?.startsWith('pickaxe_') && (
                  <Pickaxe className="h-6 w-6" style={{ color: PICKAXE_RECIPES.find(r => craftedItem.includes(r.material))?.color || '#fff' }} />
                )}
                {craftedItem === 'sticks_4' && <span className="text-xl">🥢</span>}
              </button>
              {craftedItem && (
                <p style={{ color: '#5F5', textShadow: '1px 1px 0 #000', fontFamily: 'monospace' }} className="text-xs mt-1 text-center">
                  {craftedItem.startsWith('pickaxe_') 
                    ? PICKAXE_RECIPES.find(r => craftedItem.includes(r.material))?.name
                    : craftedItem === 'sticks_4' ? '4x Gravetos' : craftedItem}
                </p>
              )}
            </div>
          </div>

          {/* Dicas de receitas */}
          <div className="mt-4 pt-3 border-t border-white/10">
            <p style={{ color: '#888', textShadow: '1px 1px 0 #000', fontFamily: 'monospace' }} className="text-xs">
              💡 {t('game.recipeTip')}
            </p>
          </div>
        </div>
      )}

      {/* Grid de Blocos */}
      <div 
        className="relative z-10"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(15, 1fr)',
          gap: '2px',
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
        }}
      >
        {PATTERN_404.map((row, y) =>
          row.map((cell, x) => {
            if (cell === 0) {
              return <div key={`empty-${x}-${y}`} className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14" />;
            }
            
            const block = blocks.find(b => b.x === x && b.y === y);
            if (!block) return <div key={`loading-${x}-${y}`} className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14" />;
            
            const crackStage = getCrackOverlay(block.breakProgress);
            const pixels = getBlockTexture(
              block.type.pattern, 
              block.type.baseColor, 
              block.type.highlightColor, 
              block.type.shadowColor
            );
            
            return (
              <div
                key={block.id}
                id={`block-${block.id}`}
                className={`
                  w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14
                  relative cursor-pointer select-none
                  transition-all duration-200
                  ${block.isBroken ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100 scale-100'}
                  ${block.isBreaking ? 'scale-95' : 'hover:scale-105'}
                `}
                style={{ imageRendering: 'pixelated' }}
                onMouseDown={() => !block.isBroken && startBreaking(block.id)}
                onMouseUp={stopBreaking}
                onMouseLeave={stopBreaking}
                onTouchStart={() => !block.isBroken && startBreaking(block.id)}
                onTouchEnd={stopBreaking}
                title={block.type.displayName}
              >
                {!block.isBroken && (
                  <svg viewBox="0 0 8 8" className="w-full h-full" style={{ imageRendering: 'pixelated' }}>
                    {pixels.map((pixel, i) => (
                      <rect key={i} x={pixel.x} y={pixel.y} width="1" height="1" fill={pixel.color} />
                    ))}
                    <rect x="0" y="0" width="8" height="1" fill="rgba(255,255,255,0.4)" />
                    <rect x="0" y="0" width="1" height="8" fill="rgba(255,255,255,0.3)" />
                    <rect x="0" y="7" width="8" height="1" fill="rgba(0,0,0,0.4)" />
                    <rect x="7" y="0" width="1" height="8" fill="rgba(0,0,0,0.3)" />
                    {crackStage > 0 && (
                      <>
                        {crackStage >= 1 && <line x1="1" y1="1" x2="3" y2="3" stroke="rgba(0,0,0,0.8)" strokeWidth="0.3" />}
                        {crackStage >= 2 && <line x1="5" y1="2" x2="7" y2="4" stroke="rgba(0,0,0,0.8)" strokeWidth="0.3" />}
                        {crackStage >= 3 && <line x1="2" y1="5" x2="4" y2="7" stroke="rgba(0,0,0,0.8)" strokeWidth="0.3" />}
                        {crackStage >= 4 && <line x1="4" y1="1" x2="6" y2="3" stroke="rgba(0,0,0,0.8)" strokeWidth="0.3" />}
                        {crackStage >= 5 && <line x1="1" y1="4" x2="3" y2="6" stroke="rgba(0,0,0,0.8)" strokeWidth="0.3" />}
                        {crackStage >= 6 && (
                          <>
                            <line x1="0" y1="0" x2="4" y2="4" stroke="rgba(0,0,0,0.9)" strokeWidth="0.4" />
                            <line x1="4" y1="4" x2="8" y2="8" stroke="rgba(0,0,0,0.9)" strokeWidth="0.4" />
                          </>
                        )}
                      </>
                    )}
                  </svg>
                )}
                {block.isBreaking && !block.isBroken && (
                  <div className="absolute -bottom-3 left-0 right-0 flex justify-center">
                    <div className="h-1.5 w-full max-w-[90%] bg-black/50 border border-black/30">
                      <div 
                        className="h-full transition-all duration-75"
                        style={{ 
                          width: `${block.breakProgress}%`,
                          background: 'linear-gradient(to bottom, #4ADE80 0%, #22C55E 50%, #16A34A 100%)',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Mensagem */}
      <div className="mt-10 text-center z-10">
        <h1 
          className="text-2xl sm:text-3xl font-bold mb-3"
          style={{ color: '#fff', textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', fontFamily: 'monospace' }}
        >
          {t('title')}
        </h1>
        <p 
          className="text-sm mb-8 max-w-md"
          style={{ color: '#ccc', textShadow: '1px 1px 0 #000', fontFamily: 'monospace' }}
        >
          {t('description')}
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 px-6 py-3 font-bold transition-all hover:brightness-110 active:translate-y-0.5"
            style={{
              background: 'linear-gradient(to bottom, #5a5a5a 0%, #3a3a3a 50%, #2a2a2a 100%)',
              border: '3px solid',
              borderTopColor: '#7a7a7a',
              borderLeftColor: '#6a6a6a',
              borderRightColor: '#1a1a1a',
              borderBottomColor: '#0a0a0a',
              color: '#fff',
              textShadow: '1px 1px 0 #000',
              fontFamily: 'monospace',
              boxShadow: '0 3px 0 #000',
            }}
          >
            <Home className="h-4 w-4" />
            {t('backHome')}
          </Link>
          <button 
            onClick={resetGame}
            className="flex items-center gap-2 px-6 py-3 font-bold transition-all hover:brightness-110 active:translate-y-0.5"
            style={{
              background: 'linear-gradient(to bottom, #5B8731 0%, #4A7A28 50%, #3A6A18 100%)',
              border: '3px solid',
              borderTopColor: '#7BA751',
              borderLeftColor: '#6B9741',
              borderRightColor: '#2A5A08',
              borderBottomColor: '#1A4A00',
              color: '#fff',
              textShadow: '1px 1px 0 #000',
              fontFamily: 'monospace',
              boxShadow: '0 3px 0 #1A4A00',
            }}
          >
            <RefreshCw className="h-4 w-4" />
            {t('reset')}
          </button>
        </div>
      </div>

      {/* Modal de Parabéns */}
      {showCongrats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-in fade-in-0">
          <div 
            className="text-center max-w-md mx-4 p-8 animate-in zoom-in-95"
            style={{
              background: 'linear-gradient(to bottom, #3a3a3a 0%, #2a2a2a 50%, #1a1a1a 100%)',
              border: '4px solid',
              borderTopColor: '#5a5a5a',
              borderLeftColor: '#4a4a4a',
              borderRightColor: '#0a0a0a',
              borderBottomColor: '#000',
              boxShadow: '0 8px 0 #000, 0 0 40px rgba(0,0,0,0.5)',
            }}
          >
            <div className="text-6xl mb-4">⛏️</div>
            <h2 style={{ color: '#FCFC54', textShadow: '2px 2px 0 #3F3F00', fontFamily: 'monospace' }} className="text-2xl font-bold mb-3">
              {t('congrats.title')}
            </h2>
            <p style={{ color: '#ccc', textShadow: '1px 1px 0 #000', fontFamily: 'monospace' }} className="mb-6">
              {t('congrats.message', { blocks: totalBlocks })}<br />
              {equippedPickaxe && t('congrats.withPickaxe', { pickaxe: equippedPickaxe.name })}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link 
                href="/dashboard"
                className="flex items-center gap-2 px-6 py-3 font-bold transition-all hover:brightness-110 active:translate-y-0.5"
                style={{
                  background: 'linear-gradient(to bottom, #5B8731 0%, #4A7A28 50%, #3A6A18 100%)',
                  border: '3px solid',
                  borderTopColor: '#7BA751',
                  borderLeftColor: '#6B9741',
                  borderRightColor: '#2A5A08',
                  borderBottomColor: '#1A4A00',
                  color: '#fff',
                  textShadow: '1px 1px 0 #000',
                  fontFamily: 'monospace',
                  boxShadow: '0 3px 0 #1A4A00',
                }}
              >
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <button 
                onClick={resetGame}
                className="flex items-center gap-2 px-6 py-3 font-bold transition-all hover:brightness-110 active:translate-y-0.5"
                style={{
                  background: 'linear-gradient(to bottom, #5a5a5a 0%, #3a3a3a 50%, #2a2a2a 100%)',
                  border: '3px solid',
                  borderTopColor: '#7a7a7a',
                  borderLeftColor: '#6a6a6a',
                  borderRightColor: '#1a1a1a',
                  borderBottomColor: '#0a0a0a',
                  color: '#fff',
                  textShadow: '1px 1px 0 #000',
                  fontFamily: 'monospace',
                  boxShadow: '0 3px 0 #000',
                }}
              >
                <RefreshCw className="h-4 w-4" />
                {t('playAgain')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decorações */}
      <div className="absolute top-10 left-10 w-24 h-8" style={{ background: '#fff', boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.5), inset -2px -2px 0 rgba(200,200,200,0.5)', opacity: 0.9 }} />
      <div className="absolute top-16 left-16 w-16 h-8" style={{ background: '#fff', boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.5), inset -2px -2px 0 rgba(200,200,200,0.5)', opacity: 0.9 }} />
      <div className="absolute top-20 right-32 w-32 h-8" style={{ background: '#fff', boxShadow: 'inset 2px 2px 0 rgba(255,255,255,0.5), inset -2px -2px 0 rgba(200,200,200,0.5)', opacity: 0.9 }} />
      
      <div className="absolute top-8 right-8 sm:top-12 sm:right-12">
        <div className="w-16 h-16 sm:w-20 sm:h-20" style={{ background: '#FFFF00', boxShadow: 'inset 4px 4px 0 rgba(255,255,255,0.5), inset -4px -4px 0 rgba(200,180,0,0.5), 0 0 40px rgba(255,255,0,0.5)' }} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-0">
        <div className="h-8" style={{ background: '#5D9B2F', boxShadow: 'inset 0 4px 0 rgba(255,255,255,0.2)' }} />
        <div className="h-16" style={{ background: '#8B5A2B', boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.2)' }} />
      </div>
    </div>
  );
}
