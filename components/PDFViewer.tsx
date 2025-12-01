'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Download, 
  ExternalLink, 
  ZoomIn, 
  ZoomOut, 
  RotateCw,
  X,
  FileText,
  Loader2,
  Maximize,
  Minimize,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PDFViewerProps {
  url: string;
  filename: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PDFViewer({ url, filename, isOpen, onClose }: PDFViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = useCallback(() => setZoom(prev => Math.min(prev + 25, 300)), []);
  const handleZoomOut = useCallback(() => setZoom(prev => Math.max(prev - 25, 25)), []);
  const handleReset = useCallback(() => setZoom(100), []);

  // Reset states when opening
   
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setHasError(false);
      setZoom(100);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      }
      if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      }
      if (e.key === '0') {
        e.preventDefault();
        handleReset();
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setIsFullscreen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, onClose, handleZoomIn, handleZoomOut, handleReset]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      // Fallback to simple link
      window.open(url, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <TooltipProvider>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-200",
          isFullscreen && "top-[40px]"
        )}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        className={cn(
          "fixed z-50 flex flex-col bg-background border rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200",
          isFullscreen 
            ? "inset-x-0 top-[40px] bottom-0 rounded-none border-0" 
            : "inset-4 sm:inset-6 md:inset-8 lg:inset-12"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b bg-muted/30">
          {/* Left: File info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 bg-red-500/10 rounded-lg flex-shrink-0">
              <FileText className="h-5 w-5 text-red-500" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold truncate text-sm sm:text-base">{filename}</h2>
              <p className="text-xs text-muted-foreground">Documento PDF</p>
            </div>
          </div>

          {/* Center: Zoom Controls */}
          <div className="hidden sm:flex items-center gap-1 bg-background border rounded-lg px-2 py-1.5 shadow-sm">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleZoomOut}
                  disabled={zoom <= 25}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Diminuir zoom (-)</TooltipContent>
            </Tooltip>

            <div className="w-16 text-center">
              <Badge variant="secondary" className="font-mono text-xs px-2">
                {zoom}%
              </Badge>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleZoomIn}
                  disabled={zoom >= 300}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Aumentar zoom (+)</TooltipContent>
            </Tooltip>

            <div className="w-px h-5 bg-border mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={handleReset}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Resetar zoom (0)</TooltipContent>
            </Tooltip>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hidden sm:flex"
                  onClick={() => setIsFullscreen(prev => !prev)}
                >
                  {isFullscreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isFullscreen ? 'Sair da tela cheia (F)' : 'Tela cheia (F)'}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  asChild
                >
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Abrir em nova aba</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2 h-8"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Baixar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Baixar PDF</TooltipContent>
            </Tooltip>

            <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fechar (Esc)</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Mobile Zoom Controls */}
        <div className="sm:hidden flex items-center justify-center gap-2 py-2 border-b bg-muted/20">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleZoomOut}
            disabled={zoom <= 25}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Badge variant="secondary" className="font-mono text-xs px-3 py-1">
            {zoom}%
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleZoomIn}
            disabled={zoom >= 300}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleReset}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-muted/30 relative">
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <div className="relative p-4 bg-background rounded-full shadow-lg">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground animate-pulse">Carregando documento...</p>
            </div>
          )}

          {/* Error State */}
          {hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10">
              <div className="text-center space-y-4 p-8">
                <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                  <FileText className="h-8 w-8 text-destructive" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Erro ao carregar PDF</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Não foi possível exibir o documento. Tente baixar o arquivo ou abrir em uma nova aba.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" onClick={handleRetry} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Tentar novamente
                  </Button>
                  <Button onClick={handleDownload} className="gap-2">
                    <Download className="h-4 w-4" />
                    Baixar PDF
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* PDF Iframe */}
          <div 
            className="min-h-full flex items-start justify-center p-4 sm:p-6"
            style={{ 
              minHeight: 'calc(100% - 1rem)',
            }}
          >
            <div 
              className="bg-white rounded-lg shadow-xl overflow-hidden transition-all duration-300 ease-out"
              style={{ 
                width: `${zoom}%`,
                maxWidth: zoom > 100 ? 'none' : '100%',
                minWidth: zoom < 100 ? `${zoom}%` : 'auto',
              }}
            >
              <iframe
                src={`${url}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
                className="w-full border-0 bg-white"
                style={{ 
                  height: isFullscreen ? 'calc(100vh - 120px)' : 'calc(100vh - 200px)',
                  minHeight: '500px'
                }}
                title={filename}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
              />
            </div>
          </div>
        </div>

        {/* Footer with keyboard shortcuts hint */}
        <div className="hidden md:flex items-center justify-center gap-6 px-4 py-2 border-t bg-muted/20 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Esc</kbd>
            <span>Fechar</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">+</kbd>
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">-</kbd>
            <span>Zoom</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">0</kbd>
            <span>Resetar</span>
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">F</kbd>
            <span>Tela cheia</span>
          </span>
        </div>
      </div>
    </TooltipProvider>
  );
}
