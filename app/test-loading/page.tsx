'use client';

import { useState } from 'react';
import { 
  GlobalLoading, 
  GlobalLoadingWithFade, 
  MiniLoading, 
  ButtonSpinner, 
  SectionLoading,
  LoadingWrapper,
  PageTransition 
} from '@/components/GlobalLoading';
import { DashboardSkeleton, DashboardCardsSkeleton } from '@/components/DashboardSkeleton';
import { AdminSkeleton } from '@/components/AdminSkeleton';
import { ServerCardSkeleton } from '@/components/ServerCardSkeleton';
import { ServerDetailSkeleton } from '@/components/ServerDetailSkeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type LoadingType = 'none' | 'global' | 'dashboard' | 'admin' | 'serverDetail';

export default function TestLoadingPage() {
  const [showFullscreen, setShowFullscreen] = useState<LoadingType>('none');
  const [isLoading, setIsLoading] = useState(false);
  const [minDuration, setMinDuration] = useState(1000);
  const [triggerCount, setTriggerCount] = useState(0);
  const [pageTransitionDemo, setPageTransitionDemo] = useState(true);

  // Simula um loading que dura um tempo variável
  const simulateLoading = (duration: number) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, duration);
  };

  // Força remontagem do GlobalLoading para testar fade in
  const triggerNewLoading = () => {
    setTriggerCount(c => c + 1);
    setShowFullscreen('global');
    // Fecha automaticamente após minDuration
    setTimeout(() => {
      setShowFullscreen('none');
    }, minDuration + 500);
  };

  const renderFullscreen = () => {
    switch (showFullscreen) {
      case 'global':
        return (
          <div className="fixed inset-0 z-50" key={`global-${triggerCount}`}>
            <GlobalLoading message="Carregando dados do servidor..." minDuration={minDuration} />
            <Button 
              className="fixed bottom-4 right-4 z-[60]" 
              variant="destructive"
              onClick={() => setShowFullscreen('none')}
            >
              Fechar
            </Button>
          </div>
        );
      case 'dashboard':
        return (
          <div className="fixed inset-0 z-50 overflow-auto" key={`dashboard-${triggerCount}`}>
            <DashboardSkeleton />
            <Button 
              className="fixed bottom-4 right-4 z-[60]" 
              variant="destructive"
              onClick={() => setShowFullscreen('none')}
            >
              Fechar
            </Button>
          </div>
        );
      case 'admin':
        return (
          <div className="fixed inset-0 z-50 overflow-auto" key={`admin-${triggerCount}`}>
            <AdminSkeleton />
            <Button 
              className="fixed bottom-4 right-4 z-[60]" 
              variant="destructive"
              onClick={() => setShowFullscreen('none')}
            >
              Fechar
            </Button>
          </div>
        );
      case 'serverDetail':
        return (
          <div className="fixed inset-0 z-50 overflow-auto" key={`serverDetail-${triggerCount}`}>
            <ServerDetailSkeleton />
            <Button 
              className="fixed bottom-4 right-4 z-[60]" 
              variant="destructive"
              onClick={() => setShowFullscreen('none')}
            >
              Fechar
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-8">
      {/* GlobalLoadingWithFade - controlado pelo isLoading (para testes de loading com estado externo) */}
      <GlobalLoadingWithFade 
        isLoading={isLoading} 
        minDuration={minDuration}
        message="Carregando com fade..." 
      />

      {renderFullscreen()}

      <div className="container mx-auto space-y-8 max-w-4xl">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">🧪 Página de Teste - Loading Components</h1>
          <p className="text-muted-foreground">
            Todos os loadings agora têm <strong>fade in/out</strong> e <strong>duração mínima</strong> por padrão!
          </p>
        </div>

        {/* Comportamento Padrão */}
        <Card className="border-2 border-emerald-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ✨ Comportamento Padrão (Fade In/Out + Duração Mínima)
            </CardTitle>
            <CardDescription>
              Todos os loadings aparecem com fade suave e permanecem visíveis por pelo menos {minDuration}ms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Duração mínima: {minDuration}ms</span>
                <span className="text-xs text-muted-foreground">(configurável via prop)</span>
              </div>
              <input
                type="range"
                value={minDuration}
                onChange={(e) => setMinDuration(Number(e.target.value))}
                min={500}
                max={3000}
                step={100}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div className="p-4 bg-muted/30 rounded-lg space-y-2">
              <p className="text-sm font-medium">Como usar:</p>
              <pre className="text-xs bg-background/50 p-2 rounded overflow-x-auto">
{`// RECOMENDADO: PageTransition para transição suave
<PageTransition
  isLoading={isLoading}
  loadingComponent={<DashboardSkeleton />}
>
  <YourPageContent />
</PageTransition>

// Com estado externo
<GlobalLoadingWithFade isLoading={isLoading} minDuration={1000} />

// Wrapper para conteúdo customizado
<LoadingWrapper minDuration={1000}>
  <YourCustomLoadingContent />
</LoadingWrapper>`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* PageTransition Demo */}
        <Card className="border-2 border-blue-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔄 PageTransition (NOVO! - Usado nas páginas)
            </CardTitle>
            <CardDescription>
              Transição suave entre loading skeleton e conteúdo real
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button 
                onClick={() => {
                  setPageTransitionDemo(true);
                  setTimeout(() => setPageTransitionDemo(false), 100);
                }}
                variant="outline"
              >
                Simular carregamento rápido (100ms)
              </Button>
              <Button 
                onClick={() => {
                  setPageTransitionDemo(true);
                  setTimeout(() => setPageTransitionDemo(false), 2000);
                }}
                variant="outline"
              >
                Simular carregamento lento (2s)
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden h-[300px]">
              <PageTransition
                isLoading={pageTransitionDemo}
                loadingComponent={
                  <div className="h-full bg-muted/30 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="flex gap-2 justify-center">
                        {['🟫', '🟩', '⬜'].map((block, i) => (
                          <span key={i} className="text-2xl animate-bounce-block" style={{ animationDelay: `${i * 0.1}s` }}>
                            {block}
                          </span>
                        ))}
                      </div>
                      <p className="text-muted-foreground">Carregando conteúdo...</p>
                    </div>
                  </div>
                }
              >
                <div className="h-full bg-gradient-to-br from-emerald-500/10 to-blue-500/10 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="text-4xl">✅</div>
                    <h3 className="text-xl font-bold">Conteúdo Carregado!</h3>
                    <p className="text-muted-foreground">Este conteúdo aparece com fade in suave</p>
                  </div>
                </div>
              </PageTransition>
            </div>
          </CardContent>
        </Card>

        {/* Testes com Estado Externo */}
        <Card>
          <CardHeader>
            <CardTitle>🔄 Teste com Estado Externo (GlobalLoadingWithFade)</CardTitle>
            <CardDescription>
              Use quando você precisa controlar quando o loading aparece/desaparece via estado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
                onClick={() => simulateLoading(100)} 
                variant="outline"
                disabled={isLoading}
              >
                Simular 100ms
              </Button>
              <Button 
                onClick={() => simulateLoading(500)} 
                variant="outline"
                disabled={isLoading}
              >
                Simular 500ms
              </Button>
              <Button 
                onClick={() => simulateLoading(1500)} 
                variant="outline"
                disabled={isLoading}
              >
                Simular 1.5s
              </Button>
              <Button 
                onClick={() => simulateLoading(3000)} 
                variant="outline"
                disabled={isLoading}
              >
                Simular 3s
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              💡 Mesmo clicando em &quot;Simular 100ms&quot;, o loading aparece por {minDuration}ms com fade suave!
            </p>
          </CardContent>
        </Card>

        {/* Fullscreen Loaders */}
        <Card>
          <CardHeader>
            <CardTitle>🖥️ Loadings Fullscreen (com fade automático)</CardTitle>
            <CardDescription>
              Clique para ver cada skeleton. Todos agora têm fade in/out e duração mínima.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={triggerNewLoading}>
              GlobalLoading
            </Button>
            <Button onClick={() => { setTriggerCount(c => c + 1); setShowFullscreen('dashboard'); }} variant="secondary">
              DashboardSkeleton
            </Button>
            <Button onClick={() => { setTriggerCount(c => c + 1); setShowFullscreen('admin'); }} variant="secondary">
              AdminSkeleton
            </Button>
            <Button onClick={() => { setTriggerCount(c => c + 1); setShowFullscreen('serverDetail'); }} variant="secondary">
              ServerDetailSkeleton
            </Button>
          </CardContent>
        </Card>

        {/* Inline Loaders */}
        <Card>
          <CardHeader>
            <CardTitle>📍 Loading Inline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">MiniLoading:</p>
              <MiniLoading />
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">MiniLoading com texto customizado:</p>
              <MiniLoading text="Buscando dados..." />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">ButtonSpinner (para botões):</p>
              <div className="flex gap-3">
                <Button disabled>
                  <ButtonSpinner className="mr-2" />
                  Carregando...
                </Button>
                <Button variant="secondary" disabled>
                  <ButtonSpinner className="mr-2" />
                  Salvando
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Loading */}
        <Card>
          <CardHeader>
            <CardTitle>📦 SectionLoading</CardTitle>
            <CardDescription>Para áreas específicas da página</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <SectionLoading message="Carregando seção..." />
            </div>
          </CardContent>
        </Card>

        {/* Server Card Skeletons */}
        <Card>
          <CardHeader>
            <CardTitle>🎴 ServerCardSkeleton</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ServerCardSkeleton />
              <ServerCardSkeleton />
              <ServerCardSkeleton />
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Cards */}
        <Card>
          <CardHeader>
            <CardTitle>📊 DashboardCardsSkeleton</CardTitle>
            <CardDescription>Skeleton só dos cards (sem navbar)</CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardCardsSkeleton />
          </CardContent>
        </Card>

        {/* LoadingWrapper Demo */}
        <Card>
          <CardHeader>
            <CardTitle>🎁 LoadingWrapper</CardTitle>
            <CardDescription>
              Wrapper que adiciona fade in/out a qualquer conteúdo de loading
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingWrapper className="p-8 bg-muted/30 rounded-lg">
              <div className="text-center space-y-4">
                <div className="text-4xl">🎮</div>
                <p className="text-muted-foreground">
                  Este conteúdo aparece com fade in e tem duração mínima de 1 segundo
                </p>
              </div>
            </LoadingWrapper>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
