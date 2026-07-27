import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Plus, Pencil, Trash2, MapPin, X, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { memorySchema } from '@/lib/schemas';
import { useMemories, useCreateMemory, useUpdateMemory, useDeleteMemory } from '@/features/memories/useMemories';
import type { Memory, MediaType } from '@/types/database';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { InlineLoader, ButtonLoader } from '@/components/ui/loader';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ImageUploader } from '@/components/ui/image-uploader';
import { useSignedUrls } from '@/lib/use-signed-urls';
import { formatDate } from '@/lib/dates';
import { useDateLocale } from '@/lib/use-date-locale';

interface FormValues {
  title: string;
  caption?: string;
  media_url: string;
  media_type: MediaType;
  location?: string;
  taken_at?: string | null;
}

export function MemoriesPage() {
  const t = useT();
  const dateLocale = useDateLocale();
  const { session } = useAuth();
  const { data: memories, isLoading } = useMemories();
  const { resolved } = useSignedUrls<Memory>(memories, 'media_url', 'memories');
  const createMut = useCreateMemory();
  const updateMut = useUpdateMemory();
  const deleteMut = useDeleteMemory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Memory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Memory | null>(null);
  const [mediaPath, setMediaPath] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(memorySchema),
    defaultValues: { title: '', caption: '', media_url: '', media_type: 'image', location: '', taken_at: null },
  });

  const openCreate = () => {
    setEditing(null);
    setMediaPath(null);
    reset({ title: '', caption: '', media_url: '', media_type: 'image', location: '', taken_at: null });
    setDialogOpen(true);
  };

  const openEdit = (memory: Memory) => {
    setEditing(memory);
    setMediaPath(memory.media_url);
    reset({
      title: memory.title,
      caption: memory.caption ?? '',
      media_url: memory.media_url,
      media_type: memory.media_type,
      location: memory.location ?? '',
      taken_at: memory.taken_at,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    if (!mediaPath) {
      toast.error(t('memories.upload'));
      return;
    }
    const payload = { ...values, media_url: mediaPath };
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, ...payload });
        toast.success(t('toast.updated'));
      } else {
        await createMut.mutateAsync({ ...payload, caption: payload.caption ?? null, location: payload.location ?? null, taken_at: payload.taken_at ?? null });
        toast.success(t('toast.created'));
      }
      setDialogOpen(false);
    } catch (err) {
      toast.error(t('errors.generic'));
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget);
      toast.success(t('toast.deleted'));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(t('errors.generic'));
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>{t('memories.title')} — LoveHub</title>
      </Helmet>

      <PageHeader
        title={t('memories.title')}
        subtitle={t('memories.subtitle')}
        icon={ImageIcon}
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('memories.add')}
          </Button>
        }
      />

      {isLoading ? (
        <InlineLoader label={t('common.loading')} />
      ) : !resolved || resolved.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title={t('memories.empty')}
          action={
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('memories.add')}
            </Button>
          }
        />
      ) : (
        <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 [&>*]:mb-4">
          {resolved.map((memory, idx) => (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: Math.min(idx * 0.03, 0.3) }}
              className="break-inside-avoid"
            >
              <Card className="group overflow-hidden">
                <button
                  onClick={() => setLightbox(memory.__signedUrl)}
                  className="block w-full"
                  aria-label={memory.title}
                >
                  <div className="overflow-hidden bg-muted">
                    <img
                      src={memory.__signedUrl ?? undefined}
                      alt={memory.title}
                      loading="lazy"
                      className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                </button>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{memory.title}</p>
                      {memory.caption && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{memory.caption}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        {memory.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {memory.location}
                          </span>
                        )}
                        {memory.taken_at && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(memory.taken_at, 'MMM d, yyyy', dateLocale)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(memory)} aria-label={t('common.edit')}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(memory)}
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t('memories.edit') : t('memories.new')}</DialogTitle>
            <DialogDescription>{t('memories.uploadHint')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <ImageUploader
              bucket="memories"
              userId={session?.user.id ?? ''}
              label={t('memories.upload')}
              hint={t('memories.uploadHint')}
              onUploaded={(path) => setMediaPath(path)}
              onClear={() => setMediaPath(null)}
              currentPreview={undefined}
            />
            <input type="hidden" {...register('media_url')} />
            <input type="hidden" value="image" {...register('media_type')} />

            <div className="space-y-1.5">
              <Label htmlFor="title">{t('common.title')}</Label>
              <Input id="title" {...register('title')} />
              {errors.title && <p className="text-xs text-destructive">{t('common.required')}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="caption">{t('memories.caption')}</Label>
              <Textarea id="caption" rows={2} {...register('caption')} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="location">{t('common.location')}</Label>
                <Input id="location" {...register('location')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taken_at">{t('memories.takenAt')}</Label>
                <Input id="taken_at" type="date" {...register('taken_at')} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <ButtonLoader className="mr-2" />}
                {editing ? t('common.update') : t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={t('memories.deleteConfirm')}
        confirmLabel={t('common.delete')}
        onConfirm={confirmDelete}
      />

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          >
            <Button
              size="icon"
              variant="secondary"
              className="absolute right-4 top-4"
              onClick={() => setLightbox(null)}
              aria-label={t('common.close')}
            >
              <X className="h-5 w-5" />
            </Button>
            <motion.img
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={lightbox}
              alt=""
              className="max-h-full max-w-full rounded-lg object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
