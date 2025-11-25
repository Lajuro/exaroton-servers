'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface AccessInstructionsProps {
  content?: string;
}

export function AccessInstructions({ content }: AccessInstructionsProps) {
  if (!content) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Como Acessar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground italic">
            Nenhuma instrução de acesso foi adicionada ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Como Acessar
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {/* Renderizar como markdown ou HTML sanitizado */}
          <div 
            className="whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
