'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Link,
  Image,
  Code,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Table,
  CheckSquare,
  Minus,
  Eye,
  Edit3,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function MarkdownEditor({ 
  value, 
  onChange, 
  placeholder = 'Escreva em Markdown...',
  minHeight = '400px'
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  // Função para inserir formatação
  const insertFormatting = useCallback((
    prefix: string, 
    suffix: string = '', 
    defaultText: string = '',
    textarea?: HTMLTextAreaElement | null
  ) => {
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || defaultText;
    
    const before = value.substring(0, start);
    const after = value.substring(end);
    
    const newText = `${before}${prefix}${selectedText}${suffix}${after}`;
    onChange(newText);
    
    // Reposicionar cursor
    setTimeout(() => {
      const newCursorPos = start + prefix.length + selectedText.length;
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length, 
        start + prefix.length + selectedText.length
      );
    }, 0);
  }, [value, onChange]);

  const toolbarButtons: { icon: React.ReactNode; label: string; prefix: string; suffix?: string; defaultText?: string }[] = [
    { icon: <Heading1 className="h-4 w-4" />, label: 'Título 1', prefix: '# ', defaultText: 'Título' },
    { icon: <Heading2 className="h-4 w-4" />, label: 'Título 2', prefix: '## ', defaultText: 'Título' },
    { icon: <Heading3 className="h-4 w-4" />, label: 'Título 3', prefix: '### ', defaultText: 'Título' },
    { icon: <Bold className="h-4 w-4" />, label: 'Negrito', prefix: '**', suffix: '**', defaultText: 'texto' },
    { icon: <Italic className="h-4 w-4" />, label: 'Itálico', prefix: '_', suffix: '_', defaultText: 'texto' },
    { icon: <Strikethrough className="h-4 w-4" />, label: 'Riscado', prefix: '~~', suffix: '~~', defaultText: 'texto' },
    { icon: <Code className="h-4 w-4" />, label: 'Código', prefix: '`', suffix: '`', defaultText: 'código' },
    { icon: <Quote className="h-4 w-4" />, label: 'Citação', prefix: '> ', defaultText: 'citação' },
    { icon: <List className="h-4 w-4" />, label: 'Lista', prefix: '- ', defaultText: 'item' },
    { icon: <ListOrdered className="h-4 w-4" />, label: 'Lista Numerada', prefix: '1. ', defaultText: 'item' },
    { icon: <CheckSquare className="h-4 w-4" />, label: 'Checklist', prefix: '- [ ] ', defaultText: 'tarefa' },
    { icon: <Link className="h-4 w-4" />, label: 'Link', prefix: '[', suffix: '](url)', defaultText: 'texto do link' },
    { icon: <Image className="h-4 w-4" aria-hidden />, label: 'Imagem', prefix: '![', suffix: '](url)', defaultText: 'descrição' },
    { icon: <Minus className="h-4 w-4" />, label: 'Linha Horizontal', prefix: '\n---\n', defaultText: '' },
  ];

  const insertCodeBlock = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || 'código';
    
    const before = value.substring(0, start);
    const after = value.substring(end);
    
    const newText = `${before}\n\`\`\`\n${selectedText}\n\`\`\`\n${after}`;
    onChange(newText);
  };

  const insertTable = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const before = value.substring(0, start);
    const after = value.substring(start);
    
    const table = `
| Coluna 1 | Coluna 2 | Coluna 3 |
|----------|----------|----------|
| Valor 1  | Valor 2  | Valor 3  |
| Valor 4  | Valor 5  | Valor 6  |
`;
    
    onChange(`${before}${table}${after}`);
  };

  return (
    <TooltipProvider>
      <div className="border rounded-lg overflow-hidden bg-background">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'write' | 'preview')}>
          {/* Toolbar */}
          <div className="border-b bg-muted/30 p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-0.5 flex-wrap">
                {toolbarButtons.map((btn, index) => (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => {
                          const textarea = document.getElementById('markdown-textarea') as HTMLTextAreaElement;
                          insertFormatting(btn.prefix, btn.suffix || '', btn.defaultText || '', textarea);
                        }}
                        disabled={activeTab === 'preview'}
                      >
                        {btn.icon}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{btn.label}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                
                {/* Botão de bloco de código */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        const textarea = document.getElementById('markdown-textarea') as HTMLTextAreaElement;
                        insertCodeBlock(textarea);
                      }}
                      disabled={activeTab === 'preview'}
                    >
                      <Code className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Bloco de Código</p>
                  </TooltipContent>
                </Tooltip>

                {/* Botão de tabela */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        const textarea = document.getElementById('markdown-textarea') as HTMLTextAreaElement;
                        insertTable(textarea);
                      }}
                      disabled={activeTab === 'preview'}
                    >
                      <Table className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Tabela</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Tabs de Write/Preview */}
              <TabsList className="h-8">
                <TabsTrigger value="write" className="h-7 px-3 text-xs gap-1">
                  <Edit3 className="h-3 w-3" />
                  Escrever
                </TabsTrigger>
                <TabsTrigger value="preview" className="h-7 px-3 text-xs gap-1">
                  <Eye className="h-3 w-3" />
                  Visualizar
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          {/* Content */}
          <TabsContent value="write" className="m-0">
            <Textarea
              id="markdown-textarea"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="border-0 rounded-none focus-visible:ring-0 resize-none font-mono text-sm"
              style={{ minHeight }}
            />
          </TabsContent>

          <TabsContent value="preview" className="m-0">
            <div 
              className="p-4 overflow-auto"
              style={{ minHeight }}
            >
              {value ? (
                <MarkdownRenderer content={value} />
              ) : (
                <p className="text-muted-foreground italic">
                  Nenhum conteúdo para visualizar...
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Help text */}
        <div className="border-t bg-muted/30 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Suporta <span className="font-medium">Markdown</span> com GFM (GitHub Flavored Markdown). 
            Use **negrito**, _itálico_, `código`, listas, tabelas e mais.
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}
