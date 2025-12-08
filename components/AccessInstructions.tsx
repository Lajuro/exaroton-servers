'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { BookOpen, FileQuestion } from 'lucide-react';

interface AccessInstructionsProps {
  content?: string;
}

export function AccessInstructions({ content }: AccessInstructionsProps) {
  const t = useTranslations('servers.access');

  if (!content) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2.5 text-lg">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <BookOpen className="h-4 w-4 text-blue-500" />
            </span>
            {t('howToConnect')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-4 rounded-full bg-muted/50 mb-3">
              <FileQuestion className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              {t('noInstructions')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3 border-b bg-muted/30">
        <CardTitle className="flex items-center gap-2.5 text-lg">
          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <BookOpen className="h-4 w-4 text-blue-500" />
          </span>
          {t('howToConnect')}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <MarkdownRenderer content={content} />
      </CardContent>
    </Card>
  );
}
