'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface PDFViewerProps {
  url: string;
  filename: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PDFViewer({ url, filename, isOpen, onClose }: PDFViewerProps) {
  const [zoom, setZoom] = useState(100);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleReset = () => setZoom(100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-4 py-3 border-b flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-sm font-medium truncate flex-1 mr-4">
            {filename}
          </DialogTitle>
          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border rounded-md px-2 py-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
              <span className="text-xs w-12 text-center">{zoom}%</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleReset}
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
            </div>

            {/* Action Buttons */}
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1" />
                Abrir
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={url} download={filename}>
                <Download className="h-4 w-4 mr-1" />
                Baixar
              </a>
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto bg-muted/50 p-4">
          <div 
            className="mx-auto bg-white shadow-lg"
            style={{ 
              width: `${zoom}%`,
              maxWidth: '100%',
              transition: 'width 0.2s ease'
            }}
          >
            <iframe
              src={`${url}#toolbar=0&navpanes=0`}
              className="w-full border-0"
              style={{ height: 'calc(90vh - 100px)' }}
              title={filename}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
