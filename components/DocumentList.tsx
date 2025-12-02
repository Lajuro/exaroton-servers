'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Trash2, Eye, File } from 'lucide-react';
import { ServerDocument } from '@/types';
import { PDFViewer } from '@/components/PDFViewer';
import { cn } from '@/lib/utils';

interface DocumentListProps {
  documents: ServerDocument[];
  canEdit?: boolean;
  onDelete?: (documentId: string) => void;
}

export function DocumentList({ documents, canEdit = false, onDelete }: DocumentListProps) {
  const t = useTranslations('servers.content.documents');
  const locale = useLocale();
  const [viewingDoc, setViewingDoc] = useState<ServerDocument | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date | string | { seconds: number; nanoseconds: number } | undefined) => {
    if (!date) return '';
    
    let dateObj: Date;
    
    // Handle Firestore Timestamp object
    if (typeof date === 'object' && 'seconds' in date) {
      dateObj = new Date(date.seconds * 1000);
    } 
    // Handle string date
    else if (typeof date === 'string') {
      dateObj = new Date(date);
    }
    // Handle Date object
    else {
      dateObj = new Date(date);
    }
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    return dateObj.toLocaleDateString(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (documents.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-red-500/10">
              <FileText className="h-5 w-5 text-red-500" />
            </div>
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-4 rounded-full bg-muted/50 mb-3">
              <File className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('noDocuments')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-red-500/10">
              <FileText className="h-5 w-5 text-red-500" />
            </div>
            {t('title')}
            <Badge variant="secondary" className="ml-auto text-xs">
              {documents.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {documents.map((doc, index) => (
              <div
                key={doc.id}
                className={cn(
                  "group flex items-center justify-between p-3 rounded-xl",
                  "bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border/50",
                  "transition-all duration-200 cursor-pointer"
                )}
                onClick={() => setViewingDoc(doc)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                    <FileText className="h-4 w-4 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {doc.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(doc.size)}{formatDate(doc.uploadedAt) && ` • ${formatDate(doc.uploadedAt)}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                    onClick={() => setViewingDoc(doc)}
                    title={t('view')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-blue-500/10 hover:text-blue-500"
                    asChild
                    title={t('download')}
                  >
                    <a href={doc.url} download={doc.name}>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  {canEdit && onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onDelete(doc.id)}
                      title={t('delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* PDF Viewer Modal */}
      {viewingDoc && (
        <PDFViewer
          url={viewingDoc.url}
          filename={viewingDoc.name}
          isOpen={!!viewingDoc}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </>
  );
}
