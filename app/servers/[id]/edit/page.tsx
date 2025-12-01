'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import { GlobalLoading } from '@/components/GlobalLoading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Loader2, 
  ImageIcon, 
  FileText, 
  Save,
  Trash2,
  GripVertical,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { ServerContent, ServerDocument } from '@/types';

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default function ServerEditPage({ params }: EditPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations('serverEdit');
  const tCommon = useTranslations('common');
  const [serverId, setServerId] = useState<string>('');
  const [content, setContent] = useState<ServerContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; documentId?: string }>({ open: false, type: '' });
  const [unsavedDialog, setUnsavedDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Form state
  const [accessInstructions, setAccessInstructions] = useState('');
  const [description, setDescription] = useState('');
  
  // Banner position (0-100, representa a posição Y do object-position)
  const [bannerPosition, setBannerPosition] = useState(50);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  // File input refs
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    params.then(p => setServerId(p.id));
  }, [params]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && serverId) {
      fetchServerContent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, serverId]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const fetchServerContent = async () => {
    try {
      setLoading(true);
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/servers/${serverId}/content`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setContent(data.content);
        setAccessInstructions(data.content?.accessInstructions || '');
        setDescription(data.content?.description || '');
        setBannerPosition(data.content?.bannerPosition ?? 50);
      }
    } catch (err) {
      console.error('Error fetching content:', err);
      toast({
        title: t('errorLoading'),
        description: t('errorLoadingDesc'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (redirectAfterSave = false) => {
    try {
      setSaving(true);
      const token = await auth.currentUser?.getIdToken();
      
      const response = await fetch(`/api/servers/${serverId}/content`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessInstructions,
          description,
          bannerPosition,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save content');
      }

      setHasUnsavedChanges(false);
      toast({
        title: t('changesSaved'),
        description: t('changesSavedDesc'),
      });

      if (redirectAfterSave) {
        router.push(`/servers/${serverId}`);
      }
    } catch (err: any) {
      toast({
        title: t('errorSaving'),
        description: err.message || t('errorSavingDesc'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (type: 'banner' | 'icon' | 'document', file: File) => {
    // Validar tamanho antes de enviar
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: t('fileTooLarge'),
        description: t('fileTooLargeDesc', { size: (file.size / (1024 * 1024)).toFixed(2) }),
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(type);
      const token = await auth.currentUser?.getIdToken();
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch(`/api/servers/${serverId}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to upload file');
      }

      toast({
        title: t('uploadComplete'),
        description: type === 'document' 
          ? t('documentUploaded')
          : type === 'banner' 
            ? t('bannerUpdated')
            : t('iconUpdated'),
      });
      
      await fetchServerContent();
    } catch (err: any) {
      toast({
        title: t('uploadError'),
        description: err.message || t('uploadErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setUploading(null);
    }
  };

  const handleDeleteFile = async () => {
    const { type, documentId } = deleteDialog;
    setDeleteDialog({ open: false, type: '' });

    try {
      const token = await auth.currentUser?.getIdToken();
      const url = documentId
        ? `/api/servers/${serverId}/upload?type=${type}&documentId=${documentId}`
        : `/api/servers/${serverId}/upload?type=${type}`;

      const response = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      toast({
        title: t('fileRemoved'),
        description: t('fileRemovedDesc'),
      });
      
      await fetchServerContent();
    } catch (err: any) {
      toast({
        title: t('errorRemoving'),
        description: err.message || t('errorRemovingDesc'),
        variant: 'destructive',
      });
    }
  };

  // Banner position drag handler
  const handleBannerMouseDown = useCallback((e: React.MouseEvent) => {
    if (!content?.bannerUrl) return;
    e.preventDefault();
    setIsDraggingBanner(true);
  }, [content?.bannerUrl]);

  const handleBannerMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingBanner || !bannerRef.current) return;
    
    const rect = bannerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percentage = Math.max(0, Math.min(100, (y / rect.height) * 100));
    
    setBannerPosition(percentage);
    setHasUnsavedChanges(true);
  }, [isDraggingBanner]);

  const handleBannerMouseUp = useCallback(() => {
    setIsDraggingBanner(false);
  }, []);

  useEffect(() => {
    if (isDraggingBanner) {
      const handleGlobalMouseUp = () => setIsDraggingBanner(false);
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!bannerRef.current) return;
        const rect = bannerRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const percentage = Math.max(0, Math.min(100, (y / rect.height) * 100));
        setBannerPosition(percentage);
        setHasUnsavedChanges(true);
      };

      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('mousemove', handleGlobalMouseMove);
      
      return () => {
        window.removeEventListener('mouseup', handleGlobalMouseUp);
        window.removeEventListener('mousemove', handleGlobalMouseMove);
      };
    }
  }, [isDraggingBanner]);

  const handleFieldChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setHasUnsavedChanges(true);
  };

  if (authLoading || loading) {
    return <GlobalLoading message={t('loadingEditor')} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header com banner editável */}
      <div 
        ref={bannerRef}
        className="relative h-64 bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden group"
        onMouseMove={handleBannerMouseMove}
        onMouseUp={handleBannerMouseUp}
      >
        {content?.bannerUrl ? (
          <>
            <img
              src={content.bannerUrl}
              alt={t('banner')}
              className="w-full h-full object-cover transition-all"
              style={{ objectPosition: `center ${bannerPosition}%` }}
              draggable={false}
            />
            {/* Overlay para drag */}
            <div 
              className={`absolute inset-0 transition-opacity ${
                isDraggingBanner 
                  ? 'bg-black/30 cursor-grabbing' 
                  : 'bg-black/0 hover:bg-black/20 cursor-grab'
              }`}
              onMouseDown={handleBannerMouseDown}
            />
            {/* Indicador de drag */}
            <div className={`absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 text-white transition-opacity pointer-events-none ${
              isDraggingBanner ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
              <GripVertical className="h-6 w-6" />
              <span className="text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
                {t('dragToReposition')}
              </span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80">
            <ImageIcon className="h-12 w-12 mb-2" />
            <p className="text-lg font-medium">{t('noBannerSet')}</p>
            <p className="text-sm text-white/60">{t('clickBelowToAdd')}</p>
          </div>
        )}

        {/* Botões de ação do banner */}
        <div className="absolute bottom-4 right-4 flex gap-2 z-10">
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload('banner', file);
              e.target.value = '';
            }}
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => bannerInputRef.current?.click()}
            disabled={uploading === 'banner'}
            className="bg-white/90 hover:bg-white text-black"
          >
            {uploading === 'banner' ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {content?.bannerUrl ? t('changeBanner') : t('addBanner')}
          </Button>
          {content?.bannerUrl && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setDeleteDialog({ open: true, type: 'banner' })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Botão voltar com estilo acrílico */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 bg-black/20 hover:bg-black/40 text-white backdrop-blur-md border border-white/10 z-10"
          onClick={() => {
            if (hasUnsavedChanges) {
              setUnsavedDialog(true);
            } else {
              router.push(`/servers/${serverId}`);
            }
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tCommon('back')}
        </Button>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('subtitle')}
            </p>
          </div>
          
          {/* Status de mudanças */}
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{t('unsavedChanges')}</span>
            </div>
          )}
        </div>

        <div className="space-y-8">
          {/* Ícone do Servidor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                {t('serverIcon.title')}
              </CardTitle>
              <CardDescription>
                {t('serverIcon.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {content?.iconUrl ? (
                    <div className="relative group">
                      <img
                        src={content.iconUrl}
                        alt={t('serverIcon.title')}
                        className="w-24 h-24 rounded-xl object-cover border-2 border-border"
                      />
                      <button
                        onClick={() => setDeleteDialog({ open: true, type: 'icon' })}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <input
                    ref={iconInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('icon', file);
                      e.target.value = '';
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => iconInputRef.current?.click()}
                    disabled={uploading === 'icon'}
                  >
                    {uploading === 'icon' ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {content?.iconUrl ? t('serverIcon.change') : t('serverIcon.upload')}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('serverIcon.formats')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Descrição */}
          <Card>
            <CardHeader>
              <CardTitle>{t('description.title')}</CardTitle>
              <CardDescription>
                {t('description.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleFieldChange(setDescription)(e.target.value)}
                placeholder={t('description.placeholder')}
                rows={3}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Instruções de Acesso */}
          <Card>
            <CardHeader>
              <CardTitle>{t('accessInstructions.title')}</CardTitle>
              <CardDescription>
                {t('accessInstructions.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MarkdownEditor
                value={accessInstructions}
                onChange={(value) => handleFieldChange(setAccessInstructions)(value)}
                placeholder={t('accessInstructions.placeholder')}
                minHeight="350px"
              />
            </CardContent>
          </Card>

          {/* Documentos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('documents.title')}
              </CardTitle>
              <CardDescription>
                {t('documents.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {content?.documents && content.documents.length > 0 && (
                <div className="mb-4 space-y-2">
                  {content.documents.map((doc: ServerDocument) => (
                    <div 
                      key={doc.id} 
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="font-medium text-sm">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('documents.fileSize', { size: (doc.size / 1024).toFixed(1) })}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, type: 'document', documentId: doc.id })}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div>
                <input
                  ref={documentInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('document', file);
                    e.target.value = '';
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => documentInputRef.current?.click()}
                  disabled={uploading === 'document'}
                  className="w-full border-dashed"
                >
                  {uploading === 'document' ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {t('documents.addPdf')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Botões de ação */}
          <div className="flex gap-3 justify-end sticky bottom-4 bg-background/95 backdrop-blur p-4 -mx-4 rounded-lg border shadow-lg">
            <Button
              variant="outline"
              onClick={() => {
                if (hasUnsavedChanges) {
                  setUnsavedDialog(true);
                } else {
                  router.push(`/servers/${serverId}`);
                }
              }}
            >
              {tCommon('cancel')}
            </Button>
            <Button onClick={() => handleSave()} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('saveChanges')}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog de confirmação de exclusão */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteConfirm.title')}</DialogTitle>
            <DialogDescription>
              {t('deleteConfirm.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, type: '' })}>
              {tCommon('cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteFile}>
              <Trash2 className="h-4 w-4 mr-2" />
              {tCommon('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de confirmação de saída com alterações não salvas */}
      <AlertDialog open={unsavedDialog} onOpenChange={setUnsavedDialog}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader className="text-center sm:text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>
            <AlertDialogTitle className="text-xl">
              {t('unsavedChangesTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {t('unsavedChangesConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="my-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
              {t('unsavedChangesTip')}
            </p>
          </div>

          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              variant="default"
              className="w-full"
              onClick={() => {
                setUnsavedDialog(false);
                handleSave(true);
              }}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {t('saveAndExit')}
            </Button>
            <div className="flex gap-2 w-full">
              <AlertDialogCancel className="flex-1 mt-0">
                {t('continueEditing')}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => router.push(`/servers/${serverId}`)}
                className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {t('discardChanges')}
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
