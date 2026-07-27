import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { CalendarHeart, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useT, type TranslationKey } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { timelineEventSchema } from '@/lib/schemas';
import {
  useTimelineEvents,
  useCreateTimelineEvent,
  useUpdateTimelineEvent,
  useDeleteTimelineEvent,
  TIMELINE_CATEGORIES,
} from '@/features/timeline/useTimeline';
import type { TimelineCategory, TimelineEvent } from '@/types/database';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { formatDate } from '@/lib/dates';
import { useDateLocale } from '@/lib/use-date-locale';
import { useSignedUrls } from '@/lib/use-signed-urls';

interface FormValues {
  title: string;
  description?: string;
  event_date: string;
  category: TimelineCategory;
  cover_url?: string | null;
}

export function TimelinePage() {
  const t = useT();
  const dateLocale = useDateLocale();
  const { session } = useAuth();
  const { data: events, isLoading } = useTimelineEvents();
  const createMut = useCreateTimelineEvent();
  const updateMut = useUpdateTimelineEvent();
  const deleteMut = useDeleteTimelineEvent();
  const { resolved: resolvedEvents } = useSignedUrls<TimelineEvent>(events, 'cover_url', 'memories');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TimelineEvent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimelineEvent | null>(null);
  const [coverPath, setCoverPath] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(timelineEventSchema),
    defaultValues: { title: '', description: '', event_date: '', category: 'milestone', cover_url: null },
  });

  const category = watch('category');

  const openCreate = () => {
    setEditing(null);
    setCoverPath(null);
    reset({ title: '', description: '', event_date: '', category: 'milestone', cover_url: null });
    setDialogOpen(true);
  };

  const openEdit = (event: TimelineEvent) => {
    setEditing(event);
    setCoverPath(event.cover_url);
    reset({
      title: event.title,
      description: event.description ?? '',
      event_date: event.event_date,
      category: event.category,
      cover_url: event.cover_url,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    const payload = { ...values, cover_url: coverPath };
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, ...payload });
        toast.success(t('toast.updated'));
      } else {
        await createMut.mutateAsync({ ...payload, description: payload.description ?? null, cover_url: payload.cover_url ?? null });
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
        <title>{t('timeline.title')} — LoveHub</title>
      </Helmet>

      <PageHeader
        title={t('timeline.title')}
        subtitle={t('timeline.subtitle')}
        icon={CalendarHeart}
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('timeline.add')}
          </Button>
        }
      />

      {isLoading ? (
        <InlineLoader label={t('common.loading')} />
      ) : !events || events.length === 0 ? (
        <EmptyState
          icon={CalendarHeart}
          title={t('timeline.empty')}
          action={
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('timeline.add')}
            </Button>
          }
        />
      ) : (
        <div className="relative space-y-6 before:absolute before:left-[19px] before:top-2 before:h-full before:w-px before:bg-border">
          {(resolvedEvents ?? []).map((event, idx) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: Math.min(idx * 0.04, 0.3) }}
              className="relative pl-12"
            >
              <div className="absolute left-0 top-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                <CalendarHeart className="h-4 w-4" />
              </div>
              <Card className="overflow-hidden">
                {event.__signedUrl && (
                  <div className="aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={event.__signedUrl}
                      alt={event.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {t(`timeline.categories.${event.category}` as TranslationKey)}
                      </span>
                      <h3 className="mt-2 text-lg font-semibold text-foreground">{event.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(event.event_date, 'PPP', dateLocale)}
                      </p>
                      {event.description && (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(event)} aria-label={t('common.edit')}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(event)}
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
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
            <DialogTitle>{editing ? t('timeline.edit') : t('timeline.new')}</DialogTitle>
            <DialogDescription>{t('timeline.subtitle')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">{t('common.title')}</Label>
              <Input id="title" {...register('title')} />
              {errors.title && <p className="text-xs text-destructive">{t('common.required')}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="event_date">{t('timeline.eventDate')}</Label>
                <Input id="event_date" type="date" {...register('event_date')} />
                {errors.event_date && <p className="text-xs text-destructive">{t('common.required')}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>{t('common.category')}</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setValue('category', v as TimelineCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMELINE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {t(`timeline.categories.${c}` as TranslationKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">{t('common.description')}</Label>
              <Textarea id="description" rows={3} {...register('description')} />
            </div>

            <ImageUploader
              bucket="memories"
              userId={session?.user.id ?? ''}
              label={t('timeline.coverImage')}
              hint={t('timeline.coverHint')}
              onUploaded={(path) => setCoverPath(path)}
              onClear={() => setCoverPath(null)}
              currentPreview={undefined}
            />

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
        title={t('timeline.deleteConfirm')}
        confirmLabel={t('common.delete')}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
