'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Trash2, Eye } from 'lucide-react';
import { ServerDocument } from '@/types';
import { PDFViewer } from '@/components/PDFViewer';

interface DocumentListProps {
  documents: ServerDocument[];
  canEdit?: boolean;
  onDelete?: (documentId: string) => void;
}

export function DocumentList({ documents, canEdit = false, onDelete }: DocumentListProps) {
  const [viewingDoc, setViewingDoc] = useState<ServerDocument | null>(null);

  if (documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground italic">
            Nenhum documento foi adicionado ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                onClick={() => setViewingDoc(doc)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(doc.size)} • {formatDate(doc.uploadedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewingDoc(doc)}
                    title="Visualizar"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    title="Download"
                  >
                    <a href={doc.url} download={doc.name}>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  {canEdit && onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(doc.id)}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
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
