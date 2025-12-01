'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { FileText } from 'lucide-react';

interface AccessInstructionsProps {
  content?: string;
}

export function AccessInstructions({ content }: AccessInstructionsProps) {
  const t = useTranslations('servers.access');

  if (!content) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('howToConnect')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground italic">
            {t('noInstructions')}
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
          {t('howToConnect')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <MarkdownRenderer content={content} />
      </CardContent>
    </Card>
  );
}
