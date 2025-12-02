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
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <BookOpen className="h-5 w-5 text-blue-500" />
            </div>
            {t('howToConnect')}
          </CardTitle>
        </CardHeader>
        <CardContent>
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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <BookOpen className="h-5 w-5 text-blue-500" />
          </div>
          {t('howToConnect')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MarkdownRenderer content={content} />
      </CardContent>
    </Card>
  );
}
