import { Helmet } from 'react-helmet-async';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Clock, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useT, type TranslationKey } from '@/lib/i18n';
import { anniversarySchema } from '@/lib/schemas';
import {
  useAnniversaries,
  useCreateAnniversary,
  useUpdateAnniversary,
  useDeleteAnniversary,
} from '@/features/anniversary/useAnniversaries';
import type { Anniversary, Recurrence } from '@/types/database';
import { nextRecurrence } from '@/lib/dates';
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
import { useDateLocale } from '@/lib/use-date-locale';
import { formatDate } from '@/lib/dates';

interface FormValues {
  title: string;
  description?: string;
  anniversary_date: string;
  recurrence: Recurrence;
}

const RECURRENCES: Recurrence[] = ['once', 'yearly', 'monthly'];

export function AnniversaryPage() {
  const t = useT();
  const dateLocale = useDateLocale();
  const { data: anniversaries, isLoading } = useAnniversaries();
  const createMut = useCreateAnniversary();
  const updateMut = useUpdateAnniversary();
  const deleteMut = useDeleteAnniversary();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Anniversary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Anniversary | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(anniversarySchema),
    defaultValues: { title: '', description: '', anniversary_date: '', recurrence: 'yearly' },
  });

  const recurrence = watch('recurrence');

  const openCreate = () => {
    setEditing(null);
    reset({ title: '', description: '', anniversary_date: '', recurrence: 'yearly' });
    setDialogOpen(true);
  };

  const openEdit = (ann: Anniversary) => {
    setEditing(ann);
    reset({
      title: ann.title,
      description: ann.description ?? '',
      anniversary_date: ann.anniversary_date,
      recurrence: ann.recurrence,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, ...values });
        toast.success(t('toast.updated'));
      } else {
        await createMut.mutateAsync({ ...values, description: values.description ?? null });
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
      await deleteMut.mutateAsync(deleteTarget.id);
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
        <title>{t('anniversary.title')} — LoveHub</title>
      </Helmet>

      <PageHeader
        title={t('anniversary.title')}
        subtitle={t('anniversary.subtitle')}
        icon={Clock}
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('anniversary.add')}
          </Button>
        }
      />

      {isLoading ? (
        <InlineLoader label={t('common.loading')} />
      ) : !anniversaries || anniversaries.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={t('anniversary.empty')}
          action={
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('anniversary.add')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {anniversaries.map((ann, idx) => (
            <motion.div
              key={ann.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.3) }}
            >
              <Card className="group h-full overflow-hidden">
                <div className="h-2 gradient-bg" />
                <CardContent className="flex h-full flex-col p-6">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-foreground">{ann.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(ann.anniversary_date, 'PPP', dateLocale)}
                      </p>
                      <span className="mt-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {t(`anniversary.recurrences.${ann.recurrence}` as TranslationKey)}
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(ann)} aria-label={t('common.edit')}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(ann)}
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  {ann.description && (
                    <p className="mt-3 text-sm text-muted-foreground">{ann.description}</p>
                  )}
                  <div className="mt-auto pt-5">
                    <Countdown anniversary={ann} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t('anniversary.edit') : t('anniversary.new')}</DialogTitle>
            <DialogDescription>{t('anniversary.subtitle')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">{t('common.title')}</Label>
              <Input id="title" {...register('title')} />
              {errors.title && <p className="text-xs text-destructive">{t('common.required')}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="anniversary_date">{t('anniversary.anniversaryDate')}</Label>
              <Input id="anniversary_date" type="date" {...register('anniversary_date')} />
              {errors.anniversary_date && <p className="text-xs text-destructive">{t('common.required')}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>{t('anniversary.recurrence')}</Label>
              <Select value={recurrence} onValueChange={(v) => setValue('recurrence', v as Recurrence)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {t(`anniversary.recurrences.${r}` as TranslationKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">{t('common.description')}</Label>
              <Textarea id="description" rows={2} {...register('description')} />
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
        title={t('anniversary.deleteConfirm')}
        confirmLabel={t('common.delete')}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function Countdown({ anniversary }: { anniversary: Anniversary }) {
  const t = useT();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const next = nextRecurrence(anniversary.anniversary_date, anniversary.recurrence);
  if (!next) return null;
  const diff = Math.max(0, next.getTime() - now);

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  if (diff <= 0) {
    return <p className="text-sm font-medium text-muted-foreground">{t('anniversary.past')}</p>;
  }

  const units = [
    { value: days, label: t('anniversary.daysLeft') },
    { value: hours, label: t('anniversary.hoursLeft') },
    { value: minutes, label: t('anniversary.minutesLeft') },
    { value: seconds, label: t('anniversary.secondsLeft') },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {units.map((u) => (
        <div key={u.label} className="rounded-lg bg-muted/50 p-2 text-center">
          <p className="text-xl font-semibold tabular-nums text-foreground">{u.value}</p>
          <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{u.label}</p>
        </div>
      ))}
    </div>
  );
}

