import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { CalendarClock, Plus, Pencil, Trash2, MapPin, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useT, type TranslationKey } from '@/lib/i18n';
import { datePlanSchema } from '@/lib/schemas';
import {
  useDates,
  useCreateDatePlan,
  useUpdateDatePlan,
  useDeleteDatePlan,
} from '@/features/dates/useDates';
import type { DatePlan, DatePlanStatus } from '@/types/database';
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
import { formatDate } from '@/lib/dates';
import { useDateLocale } from '@/lib/use-date-locale';
import { cn } from '@/lib/utils';

interface FormValues {
  title: string;
  description?: string;
  scheduled_at?: string | null;
  status: DatePlanStatus;
  location?: string;
  budget_estimate?: number | null;
}

const STATUSES: DatePlanStatus[] = ['idea', 'planned', 'completed', 'cancelled'];

const statusTint: Record<DatePlanStatus, string> = {
  idea: 'bg-muted text-muted-foreground',
  planned: 'bg-info/15 text-info',
  completed: 'bg-success/15 text-success',
  cancelled: 'bg-destructive/15 text-destructive',
};

export function DatePlannerPage() {
  const t = useT();
  const dateLocale = useDateLocale();
  const { data: dates, isLoading } = useDates();
  const createMut = useCreateDatePlan();
  const updateMut = useUpdateDatePlan();
  const deleteMut = useDeleteDatePlan();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DatePlan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DatePlan | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'ideas' | 'past'>('all');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(datePlanSchema),
    defaultValues: { title: '', description: '', scheduled_at: null, status: 'idea', location: '', budget_estimate: null },
  });

  const status = watch('status');

  const openCreate = () => {
    setEditing(null);
    reset({ title: '', description: '', scheduled_at: null, status: 'idea', location: '', budget_estimate: null });
    setDialogOpen(true);
  };

  const openEdit = (plan: DatePlan) => {
    setEditing(plan);
    reset({
      title: plan.title,
      description: plan.description ?? '',
      scheduled_at: plan.scheduled_at ? plan.scheduled_at.slice(0, 16) : null,
      status: plan.status,
      location: plan.location ?? '',
      budget_estimate: plan.budget_estimate,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    const scheduled = values.scheduled_at
      ? new Date(values.scheduled_at).toISOString()
      : null;
    const payload = { ...values, scheduled_at: scheduled };
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, ...payload });
        toast.success(t('toast.updated'));
      } else {
        await createMut.mutateAsync({ ...payload, description: payload.description ?? null, scheduled_at: payload.scheduled_at ?? null, location: payload.location ?? null, budget_estimate: payload.budget_estimate ?? null });
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

  const now = Date.now();
  const filtered = (dates ?? []).filter((d) => {
    if (filter === 'all') return true;
    if (filter === 'ideas') return d.status === 'idea';
    if (filter === 'past')
      return d.scheduled_at ? new Date(d.scheduled_at).getTime() < now : false;
    if (filter === 'upcoming')
      return d.scheduled_at ? new Date(d.scheduled_at).getTime() >= now && d.status !== 'completed' : false;
    return true;
  });

  const filterTabs: { key: typeof filter; label: string }[] = [
    { key: 'all', label: t('common.all') },
    { key: 'upcoming', label: t('datePlanner.upcoming') },
    { key: 'ideas', label: t('datePlanner.ideas') },
    { key: 'past', label: t('datePlanner.past') },
  ];

  return (
    <div className="space-y-6">
      <Helmet>
        <title>{t('datePlanner.title')} — LoveHub</title>
      </Helmet>

      <PageHeader
        title={t('datePlanner.title')}
        subtitle={t('datePlanner.subtitle')}
        icon={CalendarClock}
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('datePlanner.add')}
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
              filter === tab.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <InlineLoader label={t('common.loading')} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={t('datePlanner.empty')}
          action={
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('datePlanner.add')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(idx * 0.04, 0.3) }}
            >
              <Card className="group h-full">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusTint[plan.status])}>
                      {t(`datePlanner.statuses.${plan.status}` as TranslationKey)}
                    </span>
                    <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(plan)} aria-label={t('common.edit')}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(plan)}
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-foreground">{plan.title}</h3>
                  {plan.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{plan.description}</p>
                  )}
                  <div className="mt-auto space-y-1.5 pt-4 text-xs text-muted-foreground">
                    {plan.scheduled_at && (
                      <p className="flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {formatDate(plan.scheduled_at, 'PPP p', dateLocale)}
                      </p>
                    )}
                    {plan.location && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {plan.location}
                      </p>
                    )}
                    {plan.budget_estimate != null && (
                      <p className="flex items-center gap-1.5">
                        <Wallet className="h-3.5 w-3.5" />
                        {plan.budget_estimate}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t('datePlanner.edit') : t('datePlanner.new')}</DialogTitle>
            <DialogDescription>{t('datePlanner.subtitle')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">{t('common.title')}</Label>
              <Input id="title" {...register('title')} />
              {errors.title && <p className="text-xs text-destructive">{t('common.required')}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">{t('common.description')}</Label>
              <Textarea id="description" rows={3} {...register('description')} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="scheduled_at">{t('datePlanner.scheduledAt')}</Label>
                <Input id="scheduled_at" type="datetime-local" {...register('scheduled_at')} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('common.status')}</Label>
                <Select value={status} onValueChange={(v) => setValue('status', v as DatePlanStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`datePlanner.statuses.${s}` as TranslationKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="location">{t('common.location')}</Label>
                <Input id="location" {...register('location')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="budget_estimate">{t('common.budget')}</Label>
                <Input
                  id="budget_estimate"
                  type="number"
                  min="0"
                  {...register('budget_estimate', { setValueAs: (v) => (v === '' || v == null ? null : Number(v)) })}
                />
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
        title={t('datePlanner.deleteConfirm')}
        confirmLabel={t('common.delete')}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
