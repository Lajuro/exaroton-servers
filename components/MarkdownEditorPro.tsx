'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { MarkdownRenderer } from './MarkdownRenderer';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Link,
  Image as ImageIcon,
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
  Columns2,
  Maximize2,
  Minimize2,
  Undo2,
  Redo2,
  Copy,
  Download,
  ChevronDown,
  Keyboard,
  Loader2,
  Check,
  FileCode,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import type { editor } from 'monaco-editor';
import { useTheme } from 'next-themes';

// Dynamically import Monaco Editor with SSR disabled
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then(mod => mod.default),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full min-h-[300px] bg-muted/20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading editor...</span>
        </div>
      </div>
    ),
  }
);

type ViewMode = 'write' | 'preview' | 'split';

interface MarkdownEditorProProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
}

interface CursorPosition {
  lineNumber: number;
  column: number;
}

// Toolbar button component - defined outside to prevent recreation
interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
}

function ToolbarButton({ 
  icon, 
  label, 
  shortcut, 
  onClick,
  disabled = false,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className="h-8 w-8 p-0 hover:bg-accent"
        >
          {icon}
          <span className="sr-only">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="flex items-center gap-2">
        <span>{label}</span>
        {shortcut && (
          <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 inline-flex">
            {shortcut}
          </kbd>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

// View mode button component
interface ViewModeButtonProps {
  mode: ViewMode;
  currentMode: ViewMode;
  icon: React.ReactNode;
  label: string;
  onModeChange: (mode: ViewMode) => void;
}

function ViewModeButton({ 
  mode, 
  currentMode,
  icon, 
  label,
  onModeChange,
}: ViewModeButtonProps) {
  return (
    <Toggle
      pressed={currentMode === mode}
      onPressedChange={() => onModeChange(mode)}
      size="sm"
      className="h-8 px-2.5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
    >
      {icon}
      <span className="ml-1.5 hidden sm:inline">{label}</span>
    </Toggle>
  );
}

export function MarkdownEditorPro({
  value,
  onChange,
  minHeight = '500px',
  className,
}: MarkdownEditorProProps) {
  const t = useTranslations('markdownEditor');
  const { resolvedTheme } = useTheme();
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ lineNumber: 1, column: 1 });
  const [copied, setCopied] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  
  // Refs
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Calculate stats
  const stats = useMemo(() => {
    const lines = value.split('\n').length;
    const words = value.trim() ? value.trim().split(/\s+/).length : 0;
    const chars = value.length;
    return { lines, words, chars };
  }, [value]);

  // Handle Monaco Editor mount
  const handleEditorDidMount = useCallback((editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    setEditorReady(true);
    
    // Set up cursor position tracking
    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({
        lineNumber: e.position.lineNumber,
        column: e.position.column,
      });
    });

    // Focus editor
    editor.focus();
  }, []);

  // Insert text at cursor position
  const insertText = useCallback((
    prefix: string,
    suffix: string = '',
    defaultText: string = ''
  ) => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = editor.getSelection();
    if (!selection) return;

    const model = editor.getModel();
    if (!model) return;

    const selectedText = model.getValueInRange(selection) || defaultText;
    const textToInsert = `${prefix}${selectedText}${suffix}`;

    editor.executeEdits('markdown-toolbar', [
      {
        range: selection,
        text: textToInsert,
        forceMoveMarkers: true,
      },
    ]);

    // Position cursor appropriately
    if (selectedText === defaultText && suffix) {
      const newPosition = {
        lineNumber: selection.startLineNumber,
        column: selection.startColumn + prefix.length,
      };
      const newSelection = {
        startLineNumber: newPosition.lineNumber,
        startColumn: newPosition.column,
        endLineNumber: newPosition.lineNumber,
        endColumn: newPosition.column + defaultText.length,
      };
      editor.setSelection(newSelection);
    }

    editor.focus();
  }, []);

  // Insert text at the beginning of lines
  const insertLinePrefix = useCallback((prefix: string, defaultText: string = '') => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = editor.getSelection();
    if (!selection) return;

    const model = editor.getModel();
    if (!model) return;

    const startLine = selection.startLineNumber;
    const endLine = selection.endLineNumber;
    
    const edits: editor.IIdentifiedSingleEditOperation[] = [];
    
    for (let line = startLine; line <= endLine; line++) {
      const lineContent = model.getLineContent(line);
      const range = {
        startLineNumber: line,
        startColumn: 1,
        endLineNumber: line,
        endColumn: lineContent.length + 1,
      };
      
      if (lineContent.trim() === '') {
        edits.push({
          range,
          text: prefix + defaultText,
          forceMoveMarkers: true,
        });
      } else {
        edits.push({
          range,
          text: prefix + lineContent,
          forceMoveMarkers: true,
        });
      }
    }

    editor.executeEdits('markdown-toolbar', edits);
    editor.focus();
  }, []);

  // Toolbar actions
  const formatBold = useCallback(() => insertText('**', '**', 'bold text'), [insertText]);
  const formatItalic = useCallback(() => insertText('*', '*', 'italic text'), [insertText]);
  const formatStrikethrough = useCallback(() => insertText('~~', '~~', 'strikethrough'), [insertText]);
  const formatInlineCode = useCallback(() => insertText('`', '`', 'code'), [insertText]);
  const formatQuote = useCallback(() => insertLinePrefix('> ', 'quote'), [insertLinePrefix]);
  const formatBulletList = useCallback(() => insertLinePrefix('- ', 'list item'), [insertLinePrefix]);
  const formatNumberedList = useCallback(() => insertLinePrefix('1. ', 'list item'), [insertLinePrefix]);
  const formatChecklist = useCallback(() => insertLinePrefix('- [ ] ', 'task'), [insertLinePrefix]);
  
  const formatLink = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = editor.getSelection();
    if (!selection) return;

    const model = editor.getModel();
    if (!model) return;

    const selectedText = model.getValueInRange(selection);
    
    if (selectedText) {
      insertText('[', '](url)', '');
    } else {
      insertText('[', '](url)', 'link text');
    }
  }, [insertText]);

  const formatImage = useCallback(() => {
    insertText('![', '](image-url)', 'alt text');
  }, [insertText]);

  const formatHeading = useCallback((level: 1 | 2 | 3) => {
    const prefix = '#'.repeat(level) + ' ';
    insertLinePrefix(prefix, `Heading ${level}`);
  }, [insertLinePrefix]);

  const formatTable = useCallback(() => {
    const tableTemplate = `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`;
    insertText(tableTemplate.trim(), '', '');
  }, [insertText]);

  const formatHorizontalRule = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = editor.getSelection();
    if (!selection) return;

    editor.executeEdits('markdown-toolbar', [
      {
        range: {
          startLineNumber: selection.startLineNumber,
          startColumn: 1,
          endLineNumber: selection.startLineNumber,
          endColumn: 1,
        },
        text: '\n---\n\n',
        forceMoveMarkers: true,
      },
    ]);

    editor.focus();
  }, []);

  const formatCodeBlock = useCallback(() => {
    insertText('\n```\n', '\n```\n', 'code');
  }, [insertText]);

  // Undo/Redo
  const handleUndo = useCallback(() => {
    editorRef.current?.trigger('keyboard', 'undo', null);
  }, []);

  const handleRedo = useCallback(() => {
    editorRef.current?.trigger('keyboard', 'redo', null);
  }, []);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [value]);

  // Download as .md file
  const handleDownload = useCallback(() => {
    const blob = new Blob([value], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [value]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Handle view mode change
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  // Handle Escape key for fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Lock body scroll when fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Register keyboard shortcuts in Monaco
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !editorReady) return;

    const disposables = [
      // Bold: Ctrl/Cmd + B
      editor.addAction({
        id: 'markdown-bold',
        label: 'Bold',
        keybindings: [2048 + 32], // Ctrl/Cmd + B
        run: formatBold,
      }),
      // Italic: Ctrl/Cmd + I
      editor.addAction({
        id: 'markdown-italic',
        label: 'Italic',
        keybindings: [2048 + 39], // Ctrl/Cmd + I
        run: formatItalic,
      }),
      // Link: Ctrl/Cmd + K
      editor.addAction({
        id: 'markdown-link',
        label: 'Link',
        keybindings: [2048 + 41], // Ctrl/Cmd + K
        run: formatLink,
      }),
      // Code: Ctrl/Cmd + `
      editor.addAction({
        id: 'markdown-code',
        label: 'Inline Code',
        keybindings: [2048 + 192], // Ctrl/Cmd + `
        run: formatInlineCode,
      }),
    ];

    return () => {
      disposables.forEach(d => d.dispose());
    };
  }, [editorReady, formatBold, formatItalic, formatLink, formatInlineCode]);

  // Keyboard shortcuts data
  const shortcutsList = useMemo(() => [
    { keys: 'Ctrl/⌘ + B', description: t('shortcuts.bold') },
    { keys: 'Ctrl/⌘ + I', description: t('shortcuts.italic') },
    { keys: 'Ctrl/⌘ + K', description: t('shortcuts.link') },
    { keys: 'Ctrl/⌘ + `', description: t('shortcuts.code') },
    { keys: 'Ctrl/⌘ + Z', description: t('shortcuts.undo') },
    { keys: 'Ctrl/⌘ + Shift + Z', description: t('shortcuts.redo') },
    { keys: 'Tab', description: t('shortcuts.indent') },
    { keys: 'Escape', description: t('shortcuts.exitFullscreen') },
  ], [t]);

  // Monaco editor options
  const monacoOptions: editor.IStandaloneEditorConstructionOptions = useMemo(() => ({
    minimap: { enabled: false },
    lineNumbers: 'on',
    wordWrap: 'on',
    wrappingStrategy: 'advanced',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
    lineHeight: 24,
    padding: { top: 16, bottom: 16 },
    renderLineHighlight: 'line',
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling: true,
    folding: true,
    foldingHighlight: true,
    showFoldingControls: 'mouseover',
    bracketPairColorization: { enabled: true },
    guides: {
      indentation: true,
      bracketPairs: true,
    },
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    acceptSuggestionOnEnter: 'off',
    tabSize: 2,
    insertSpaces: true,
    formatOnPaste: false,
    formatOnType: false,
    autoClosingBrackets: 'always',
    autoClosingQuotes: 'always',
    scrollbar: {
      vertical: 'auto',
      horizontal: 'auto',
      useShadows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,
    overviewRulerLanes: 0,
  }), []);

  // Editor content
  const editorContent = (
    <div 
      ref={containerRef}
      className={cn(
        'flex flex-col border rounded-lg overflow-hidden bg-background',
        isFullscreen && 'fixed inset-0 z-50 rounded-none border-0',
        className
      )}
      style={{ minHeight: isFullscreen ? '100vh' : minHeight }}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/30 flex-wrap">
        <TooltipProvider delayDuration={300}>
          {/* Headings dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 gap-1">
                <Heading1 className="h-4 w-4" />
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => formatHeading(1)}>
                <Heading1 className="h-4 w-4 mr-2" />
                {t('toolbar.heading1')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => formatHeading(2)}>
                <Heading2 className="h-4 w-4 mr-2" />
                {t('toolbar.heading2')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => formatHeading(3)}>
                <Heading3 className="h-4 w-4 mr-2" />
                {t('toolbar.heading3')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Text formatting */}
          <ToolbarButton
            icon={<Bold className="h-4 w-4" />}
            label={t('toolbar.bold')}
            shortcut="⌘B"
            onClick={formatBold}
          />
          <ToolbarButton
            icon={<Italic className="h-4 w-4" />}
            label={t('toolbar.italic')}
            shortcut="⌘I"
            onClick={formatItalic}
          />
          <ToolbarButton
            icon={<Strikethrough className="h-4 w-4" />}
            label={t('toolbar.strikethrough')}
            onClick={formatStrikethrough}
          />
          <ToolbarButton
            icon={<Code className="h-4 w-4" />}
            label={t('toolbar.inlineCode')}
            shortcut="⌘`"
            onClick={formatInlineCode}
          />

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Lists */}
          <ToolbarButton
            icon={<List className="h-4 w-4" />}
            label={t('toolbar.bulletList')}
            onClick={formatBulletList}
          />
          <ToolbarButton
            icon={<ListOrdered className="h-4 w-4" />}
            label={t('toolbar.numberedList')}
            onClick={formatNumberedList}
          />
          <ToolbarButton
            icon={<CheckSquare className="h-4 w-4" />}
            label={t('toolbar.checklist')}
            onClick={formatChecklist}
          />

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Insert elements */}
          <ToolbarButton
            icon={<Quote className="h-4 w-4" />}
            label={t('toolbar.quote')}
            onClick={formatQuote}
          />
          <ToolbarButton
            icon={<Link className="h-4 w-4" />}
            label={t('toolbar.link')}
            shortcut="⌘K"
            onClick={formatLink}
          />
          <ToolbarButton
            icon={<ImageIcon className="h-4 w-4" />}
            label={t('toolbar.image')}
            onClick={formatImage}
          />
          <ToolbarButton
            icon={<Table className="h-4 w-4" />}
            label={t('toolbar.table')}
            onClick={formatTable}
          />
          <ToolbarButton
            icon={<FileCode className="h-4 w-4" />}
            label={t('toolbar.codeBlock')}
            onClick={formatCodeBlock}
          />
          <ToolbarButton
            icon={<Minus className="h-4 w-4" />}
            label={t('toolbar.horizontalRule')}
            onClick={formatHorizontalRule}
          />

          <div className="flex-1" />

          {/* View mode toggles */}
          <div className="flex items-center gap-1 border rounded-md p-0.5 bg-muted/50">
            <ViewModeButton
              mode="write"
              currentMode={viewMode}
              icon={<Edit3 className="h-4 w-4" />}
              label={t('modes.write')}
              onModeChange={handleViewModeChange}
            />
            <ViewModeButton
              mode="split"
              currentMode={viewMode}
              icon={<Columns2 className="h-4 w-4" />}
              label={t('modes.split')}
              onModeChange={handleViewModeChange}
            />
            <ViewModeButton
              mode="preview"
              currentMode={viewMode}
              icon={<Eye className="h-4 w-4" />}
              label={t('modes.preview')}
              onModeChange={handleViewModeChange}
            />
          </div>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Actions */}
          <ToolbarButton
            icon={<Undo2 className="h-4 w-4" />}
            label={t('actions.undo')}
            shortcut="⌘Z"
            onClick={handleUndo}
          />
          <ToolbarButton
            icon={<Redo2 className="h-4 w-4" />}
            label={t('actions.redo')}
            shortcut="⌘⇧Z"
            onClick={handleRedo}
          />
          <ToolbarButton
            icon={copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            label={t('actions.copy')}
            onClick={handleCopy}
          />
          <ToolbarButton
            icon={<Download className="h-4 w-4" />}
            label={t('actions.download')}
            onClick={handleDownload}
          />
          <ToolbarButton
            icon={<Keyboard className="h-4 w-4" />}
            label={t('actions.shortcuts')}
            onClick={() => setShowShortcuts(true)}
          />
          <ToolbarButton
            icon={isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            label={isFullscreen ? t('actions.exitFullscreen') : t('actions.fullscreen')}
            onClick={toggleFullscreen}
          />
        </TooltipProvider>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden" style={{ minHeight: 0 }}>
        {/* Editor panel */}
        {(viewMode === 'write' || viewMode === 'split') && (
          <div 
            className={cn(
              'flex-1 min-w-0 overflow-hidden',
              viewMode === 'split' && 'border-r'
            )}
          >
            <MonacoEditor
              height="100%"
              language="markdown"
              theme={resolvedTheme === 'dark' ? 'vs-dark' : 'vs'}
              value={value}
              onChange={(val) => onChange(val || '')}
              onMount={handleEditorDidMount}
              options={monacoOptions}
            />
          </div>
        )}

        {/* Preview panel */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div 
            ref={previewRef}
            className={cn(
              'flex-1 min-w-0 overflow-auto',
              viewMode === 'split' && 'max-w-[50%]'
            )}
          >
            <ScrollArea className="h-full">
              <div className="p-6">
                {value.trim() ? (
                  <MarkdownRenderer content={value} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <Eye className="h-12 w-12 mb-4 opacity-20" />
                    <p className="text-lg font-medium">{t('emptyPreview')}</p>
                    <p className="text-sm">{t('emptyPreviewHint')}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t bg-muted/30 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>
            {t('status.line')} {cursorPosition.lineNumber}, {t('status.column')} {cursorPosition.column}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>{stats.lines} {t('status.lines')}</span>
          <span>{stats.words} {t('status.words')}</span>
          <span>{stats.chars} {t('status.chars')}</span>
        </div>
      </div>

      {/* Keyboard shortcuts dialog */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              {t('shortcuts.title')}
            </DialogTitle>
            <DialogDescription>
              {t('shortcuts.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            {shortcutsList.map((shortcut, index) => (
              <div 
                key={index}
                className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50"
              >
                <span className="text-sm">{shortcut.description}</span>
                <kbd className="pointer-events-none h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-xs font-medium opacity-100 inline-flex">
                  {shortcut.keys}
                </kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  // Render in portal when fullscreen
  if (isFullscreen && typeof document !== 'undefined') {
    return createPortal(editorContent, document.body);
  }

  return editorContent;
}

export default MarkdownEditorPro;
