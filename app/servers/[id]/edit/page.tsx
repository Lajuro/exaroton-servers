'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import Navbar from '@/components/layout/Navbar';
import { PageTransition } from '@/components/GlobalLoading';
import { ServerDetailSkeleton } from '@/components/ServerDetailSkeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { MarkdownEditorPro } from '@/components/MarkdownEditorPro';
import { PDFViewer } from '@/components/PDFViewer';
import { 
  ArrowLeft, 
  Upload, 
  X, 
  Loader2, 
  ImageIcon, 
  FileText, 
  Save,
  Trash2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Check,
  Eye,
  Download,
  PenLine,
  Palette,
  FileImage,
  Info,
  Pencil,
  Move,
  ZoomIn,
  Settings2,
  CheckCircle2,
  CloudUpload,
} from 'lucide-react';
import { ServerContent, ServerDocument } from '@/types';
import { cn } from '@/lib/utils';

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
  const [serverName, setServerName] = useState<string>('');
  const [content, setContent] = useState<ServerContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: string; documentId?: string }>({ open: false, type: '' });
  const [unsavedDialog, setUnsavedDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');
  
  // Icon preview dialog
  const [iconPreviewOpen, setIconPreviewOpen] = useState(false);
  
  // PDF viewer state
  const [pdfViewer, setPdfViewer] = useState<{ open: boolean; url: string; filename: string }>({ open: false, url: '', filename: '' });

  // Form state
  const [accessInstructions, setAccessInstructions] = useState('');
  const [description, setDescription] = useState('');
  
  // Banner position (0-100, representa a posição Y do object-position)
  const [bannerPosition, setBannerPosition] = useState(50);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  // Section refs for intersection observer
  const sectionRefs = {
    banner: useRef<HTMLDivElement>(null),
    icon: useRef<HTMLDivElement>(null),
    description: useRef<HTMLDivElement>(null),
    instructions: useRef<HTMLDivElement>(null),
    documents: useRef<HTMLDivElement>(null),
  };

  // File input refs
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Track active section for nav indicator
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: '-100px 0px -50% 0px' }
    );

    Object.values(sectionRefs).forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => observer.disconnect();
  }, [loading]);

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
      
      // Fetch server details for name
      const serverResponse = await fetch(`/api/servers/${serverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (serverResponse.ok) {
        const serverData = await serverResponse.json();
        setServerName(serverData.server?.name || 'Server');
      }

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
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      
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
      setUploadProgress(0);
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const token = await auth.currentUser?.getIdToken();
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch(`/api/servers/${serverId}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

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
      setUploadProgress(0);
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

  // Stable handler for access instructions change
  const handleAccessInstructionsChange = useCallback((value: string) => {
    setAccessInstructions(value);
    setHasUnsavedChanges(true);
  }, []);

  // Stable handler for description change  
  const handleDescriptionChange = useCallback((value: string) => {
    setDescription(value);
    setHasUnsavedChanges(true);
  }, []);

  // Scroll to section
  const scrollToSection = (sectionId: string) => {
    const ref = sectionRefs[sectionId as keyof typeof sectionRefs];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const isLoading = authLoading || loading;

  // Section navigation items
  const navItems = [
    { id: 'banner', label: t('banner'), icon: <FileImage className="h-4 w-4" /> },
    { id: 'icon', label: t('serverIcon.title'), icon: <Palette className="h-4 w-4" /> },
    { id: 'description', label: t('description.title'), icon: <PenLine className="h-4 w-4" /> },
    { id: 'instructions', label: t('accessInstructions.title'), icon: <FileText className="h-4 w-4" /> },
    { id: 'documents', label: t('documents.title'), icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <TooltipProvider>
      <PageTransition
        isLoading={isLoading}
        loadingComponent={<ServerDetailSkeleton />}
      >
        <div className="min-h-screen bg-background">
          <Navbar />
          
          {/* Header com banner editável */}
          <div 
            id="banner"
            ref={sectionRefs.banner}
            className="relative h-72 md:h-80 overflow-hidden group"
          >
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
            </div>

            {/* Banner image */}
            <div 
              ref={bannerRef}
              className="absolute inset-0"
              onMouseMove={handleBannerMouseMove}
              onMouseUp={handleBannerMouseUp}
            >
              {content?.bannerUrl ? (
                <>
                  <img
                    src={content.bannerUrl}
                    alt={t('banner')}
                    className="w-full h-full object-cover transition-all duration-200"
                    style={{ objectPosition: `center ${bannerPosition}%` }}
                    draggable={false}
                  />
                  {/* Gradient overlay for readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  
                  {/* Drag overlay */}
                  <div 
                    className={cn(
                      "absolute inset-0 transition-all duration-200",
                      isDraggingBanner 
                        ? 'bg-black/40 cursor-grabbing' 
                        : 'bg-transparent hover:bg-black/20 cursor-grab'
                    )}
                    onMouseDown={handleBannerMouseDown}
                  />
                  
                  {/* Drag indicator */}
                  <div className={cn(
                    "absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 text-white transition-all duration-300 pointer-events-none",
                    isDraggingBanner ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-100'
                  )}>
                    <div className="bg-white/20 backdrop-blur-md rounded-full p-3 border border-white/30">
                      <Move className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium bg-black/50 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10">
                      {t('dragToReposition')}
                    </span>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/90">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                    <ImageIcon className="h-16 w-16 mb-4 mx-auto opacity-80" />
                    <p className="text-xl font-semibold">{t('noBannerSet')}</p>
                    <p className="text-sm text-white/70 mt-1">{t('clickBelowToAdd')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Banner action buttons */}
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
                aria-label={content?.bannerUrl ? t('changeBanner') : t('addBanner')}
              />
              <Button
                size="sm"
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploading === 'banner'}
                className="bg-white/95 hover:bg-white text-black shadow-lg border-0"
              >
                {uploading === 'banner' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="hidden sm:inline">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{content?.bannerUrl ? t('changeBanner') : t('addBanner')}</span>
                  </>
                )}
              </Button>
              {content?.bannerUrl && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteDialog({ open: true, type: 'banner' })}
                      className="shadow-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{tCommon('delete')}</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Upload progress */}
            {uploading === 'banner' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                <div 
                  className="h-full bg-white transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {/* Back button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 left-4 bg-black/30 hover:bg-black/50 text-white backdrop-blur-md border border-white/20 z-10 shadow-lg"
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

            {/* Server name badge */}
            {serverName && (
              <div className="absolute top-4 right-4 z-10">
                <Badge variant="secondary" className="bg-black/30 backdrop-blur-md border-white/20 text-white text-sm px-3 py-1">
                  <Pencil className="h-3 w-3 mr-1.5" />
                  {serverName}
                </Badge>
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="container mx-auto px-4 py-8 max-w-5xl">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="animate-fade-in">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-violet-500/20">
                    <Settings2 className="h-5 w-5 text-white" />
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    {t('title')}
                  </h1>
                </div>
                <p className="text-muted-foreground pl-12">
                  {t('subtitle')}
                </p>
              </div>
              
              {/* Status badge */}
              <div className="flex items-center gap-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                {hasUnsavedChanges ? (
                  <Badge variant="outline" className="border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 gap-1.5 py-1.5 px-3">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {t('unsavedChanges')}
                  </Badge>
                ) : saveSuccess ? (
                  <Badge variant="outline" className="border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 gap-1.5 py-1.5 px-3">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t('changesSaved')}
                  </Badge>
                ) : null}
              </div>
            </div>

            {/* Quick nav - hidden on mobile */}
            <div className="hidden lg:block mb-8 animate-fade-in" style={{ animationDelay: '0.15s' }}>
              <div className="flex items-center gap-2 p-1.5 bg-muted/50 rounded-xl border w-fit">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all",
                      activeSection === item.id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}
                  >
                    {item.icon}
                    <span className="hidden xl:inline">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6 stagger-animation">
              {/* Server Icon Card */}
              <Card 
                id="icon" 
                ref={sectionRefs.icon}
                className="overflow-hidden border-2 hover:border-primary/20 transition-colors"
              >
                <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Palette className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{t('serverIcon.title')}</CardTitle>
                      <CardDescription className="text-sm">
                        {t('serverIcon.description')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="relative group">
                      {content?.iconUrl ? (
                        <div className="relative">
                          <img
                            src={content.iconUrl}
                            alt={t('serverIcon.title')}
                            className="w-28 h-28 rounded-2xl object-cover border-2 border-border shadow-lg transition-transform group-hover:scale-105 cursor-pointer"
                            onClick={() => setIconPreviewOpen(true)}
                          />
                          {/* Remove button with tooltip */}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteDialog({ open: true, type: 'icon' });
                                }}
                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:scale-110 z-10"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>{t('serverIcon.remove')}</TooltipContent>
                          </Tooltip>
                          {/* Zoom overlay - clickable to preview */}
                          <div 
                            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={() => setIconPreviewOpen(true)}
                          >
                            <ZoomIn className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                          onClick={() => iconInputRef.current?.click()}
                        >
                          <ImageIcon className="h-8 w-8 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Click to add</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-3">
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
                        aria-label={content?.iconUrl ? t('serverIcon.change') : t('serverIcon.upload')}
                      />
                      <Button
                        variant="outline"
                        onClick={() => iconInputRef.current?.click()}
                        disabled={uploading === 'icon'}
                        className="relative overflow-hidden"
                      >
                        {uploading === 'icon' ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <CloudUpload className="h-4 w-4 mr-2" />
                            {content?.iconUrl ? t('serverIcon.change') : t('serverIcon.upload')}
                          </>
                        )}
                      </Button>
                      {uploading === 'icon' && (
                        <Progress value={uploadProgress} className="h-1" />
                      )}
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        {t('serverIcon.formats')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description Card */}
              <Card 
                id="description" 
                ref={sectionRefs.description}
                className="overflow-hidden border-2 hover:border-primary/20 transition-colors"
              >
                <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/10 p-2 rounded-lg">
                      <PenLine className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{t('description.title')}</CardTitle>
                      <CardDescription className="text-sm">
                        {t('description.description')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <Textarea
                    value={description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleDescriptionChange(e.target.value)}
                    placeholder={t('description.placeholder')}
                    rows={4}
                    className="resize-none text-base focus-ring"
                  />
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    {description.length} / 500 characters
                  </p>
                </CardContent>
              </Card>

              {/* Access Instructions Card */}
              <Card 
                id="instructions" 
                ref={sectionRefs.instructions}
                className="overflow-hidden border-2 hover:border-primary/20 transition-colors"
              >
                <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-500/10 p-2 rounded-lg">
                      <Sparkles className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{t('accessInstructions.title')}</CardTitle>
                        <Badge variant="secondary" className="text-xs">Markdown</Badge>
                      </div>
                      <CardDescription className="text-sm">
                        {t('accessInstructions.description')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <MarkdownEditorPro
                    value={accessInstructions}
                    onChange={handleAccessInstructionsChange}
                    placeholder={t('accessInstructions.placeholder')}
                    minHeight="450px"
                  />
                </CardContent>
              </Card>

              {/* Documents Card */}
              <Card 
                id="documents" 
                ref={sectionRefs.documents}
                className="overflow-hidden border-2 hover:border-primary/20 transition-colors"
              >
                <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-500/10 p-2 rounded-lg">
                      <FileText className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{t('documents.title')}</CardTitle>
                        {content?.documents && content.documents.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {content.documents.length}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-sm">
                        {t('documents.description')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {content?.documents && content.documents.length > 0 && (
                    <div className="mb-4 space-y-2">
                      {content.documents.map((doc: ServerDocument, index: number) => (
                        <div 
                          key={doc.id} 
                          className="flex items-center justify-between p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors group"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="bg-red-500/10 p-2.5 rounded-lg">
                              <FileText className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                              <p className="font-medium">{doc.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {t('documents.fileSize', { size: (doc.size / 1024).toFixed(1) })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {doc.url && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setPdfViewer({ open: true, url: doc.url!, filename: doc.name })}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t('documents.view')}</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      asChild
                                    >
                                      <a href={doc.url} download={doc.name}>
                                        <Download className="h-4 w-4" />
                                      </a>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>{t('documents.download')}</TooltipContent>
                                </Tooltip>
                              </>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteDialog({ open: true, type: 'document', documentId: doc.id })}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{t('documents.delete')}</TooltipContent>
                            </Tooltip>
                          </div>
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
                      aria-label={t('documents.addPdf')}
                    />
                    <Button
                      variant="outline"
                      onClick={() => documentInputRef.current?.click()}
                      disabled={uploading === 'document'}
                      className="w-full border-dashed border-2 h-14 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                    >
                      {uploading === 'document' ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-5 w-5 mr-2" />
                          {t('documents.addPdf')}
                        </>
                      )}
                    </Button>
                    {uploading === 'document' && (
                      <Progress value={uploadProgress} className="h-1 mt-2" />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Sticky action bar */}
              <div className="sticky bottom-4 z-20 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <div className="flex gap-3 justify-end glass rounded-xl border shadow-lg p-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (hasUnsavedChanges) {
                        setUnsavedDialog(true);
                      } else {
                        router.push(`/servers/${serverId}`);
                      }
                    }}
                    className="min-w-[100px]"
                  >
                    {tCommon('cancel')}
                  </Button>
                  <Button 
                    onClick={() => handleSave()} 
                    disabled={saving || !hasUnsavedChanges}
                    className={cn(
                      "min-w-[140px] transition-all",
                      saveSuccess && "bg-emerald-600 hover:bg-emerald-600"
                    )}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('saving')}
                      </>
                    ) : saveSuccess ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {t('changesSaved')}
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
          </div>

          {/* Delete confirmation dialog */}
          <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <Trash2 className="h-6 w-6 text-destructive" />
                </div>
                <DialogTitle className="text-center">{t('deleteConfirm.title')}</DialogTitle>
                <DialogDescription className="text-center">
                  {t('deleteConfirm.description')}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button variant="outline" onClick={() => setDeleteDialog({ open: false, type: '' })} className="flex-1">
                  {tCommon('cancel')}
                </Button>
                <Button variant="destructive" onClick={handleDeleteFile} className="flex-1">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {tCommon('delete')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Unsaved changes dialog */}
          <AlertDialog open={unsavedDialog} onOpenChange={setUnsavedDialog}>
            <AlertDialogContent className="sm:max-w-[450px]">
              <AlertDialogHeader className="text-center sm:text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/40 dark:to-amber-800/40">
                  <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                </div>
                <AlertDialogTitle className="text-xl">
                  {t('unsavedChangesTitle')}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-center">
                  {t('unsavedChangesConfirm')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="my-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4">
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

          {/* Icon Preview Dialog */}
          <Dialog open={iconPreviewOpen} onOpenChange={setIconPreviewOpen}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden">
              <div className="relative aspect-square bg-muted">
                {content?.iconUrl && (
                  <img
                    src={content.iconUrl}
                    alt={t('serverIcon.title')}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <div className="p-4 flex items-center justify-between border-t">
                <p className="text-sm font-medium">{t('serverIcon.title')}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIconPreviewOpen(false);
                    iconInputRef.current?.click();
                  }}
                >
                  {t('serverIcon.change')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* PDF Viewer */}
          <PDFViewer
            url={pdfViewer.url}
            filename={pdfViewer.filename}
            isOpen={pdfViewer.open}
            onClose={() => setPdfViewer({ open: false, url: '', filename: '' })}
          />
        </div>
      </PageTransition>
    </TooltipProvider>
  );
}
