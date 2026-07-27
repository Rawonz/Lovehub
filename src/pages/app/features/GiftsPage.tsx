import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Gift, Plus, Pencil, Trash2, Sparkles, ExternalLink, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import { useT, type TranslationKey } from '@/lib/i18n';
import { giftSchema } from '@/lib/schemas';
import {
  useGifts,
  useCreateGift,
  useUpdateGift,
  useDeleteGift,
  GIFT_RECIPIENTS,
  GIFT_STATUSES,
} from '@/features/gifts/useGifts';
import type { GiftSuggestion, GiftRecipient, GiftStatus } from '@/types/database';
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
import { cn } from '@/lib/utils';

interface FormValues {
  recipient: GiftRecipient;
  name: string;
  description?: string;
  occasion?: string;
  budget_estimate?: number | null;
  link_url?: string | null;
  status: GiftStatus;
}

const statusTint: Record<GiftStatus, string> = {
  idea: 'bg-muted text-muted-foreground',
  purchased: 'bg-info/15 text-info',
  given: 'bg-success/15 text-success',
  archived: 'bg-muted text-muted-foreground',
};

export function GiftsPage() {
  const t = useT();
  const { data: gifts, isLoading } = useGifts();
  const createMut = useCreateGift();
  const updateMut = useUpdateGift();
  const deleteMut = useDeleteGift();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GiftSuggestion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GiftSuggestion | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(giftSchema),
    defaultValues: {
      recipient: 'partner',
      name: '',
      description: '',
      occasion: '',
      budget_estimate: null,
      link_url: null,
      status: 'idea',
    },
  });

  const recipient = watch('recipient');
  const status = watch('status');

  const openCreate = () => {
    setEditing(null);
    reset({
      recipient: 'partner',
      name: '',
      description: '',
      occasion: '',
      budget_estimate: null,
      link_url: null,
      status: 'idea',
    });
    setDialogOpen(true);
  };

  const openEdit = (gift: GiftSuggestion) => {
    setEditing(gift);
    reset({
      recipient: gift.recipient,
      name: gift.name,
      description: gift.description ?? '',
      occasion: gift.occasion ?? '',
      budget_estimate: gift.budget_estimate,
      link_url: gift.link_url,
      status: gift.status,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, ...values });
        toast.success(t('toast.updated'));
      } else {
        await createMut.mutateAsync({ ...values, description: values.description ?? null, occasion: values.occasion ?? null, budget_estimate: values.budget_estimate ?? null, link_url: values.link_url ?? null });
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

  const fetchSuggestions = async () => {
    setSuggesting(true);
    setSuggestions([]);
    try {
      const { supabase } = await import('@/lib/supabase');
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gift-recommender`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token ?? ''}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({}),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { suggestions?: string[]; error?: string };
      if (data.error) throw new Error(data.error);
      setSuggestions(data.suggestions ?? []);
    } catch (err) {
      toast.error(t('errors.generic'));
      console.error(err);
    } finally {
      setSuggesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>{t('gifts.title')} — LoveHub</title>
      </Helmet>

      <PageHeader
        title={t('gifts.title')}
        subtitle={t('gifts.subtitle')}
        icon={Gift}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchSuggestions} disabled={suggesting}>
              {suggesting ? <ButtonLoader className="mr-2" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {suggesting ? t('gifts.recommending') : t('gifts.recommend')}
            </Button>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('gifts.add')}
            </Button>
          </div>
        }
      />

      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              {t('gifts.recommend')}
            </h2>
            <Button size="sm" variant="ghost" onClick={() => setSuggestions([])}>
              {t('common.close')}
            </Button>
          </div>
          <ul className="mt-3 space-y-2">
            {suggestions.map((s, i) => (
              <li key={i} className="rounded-lg bg-muted/50 p-3 text-sm text-foreground">
                {s}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {isLoading ? (
        <InlineLoader label={t('common.loading')} />
      ) : !gifts || gifts.length === 0 ? (
        <EmptyState
          icon={Gift}
          title={t('gifts.empty')}
          action={
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('gifts.add')}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gifts.map((gift, idx) => (
            <motion.div
              key={gift.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(idx * 0.04, 0.3) }}
            >
              <Card className="group h-full">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {t(`gifts.recipients.${gift.recipient}` as TranslationKey)}
                      </span>
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', statusTint[gift.status])}>
                        {t(`gifts.statuses.${gift.status}` as TranslationKey)}
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(gift)} aria-label={t('common.edit')}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteTarget(gift)}
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-foreground">{gift.name}</h3>
                  {gift.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{gift.description}</p>
                  )}
                  <div className="mt-auto space-y-1.5 pt-4 text-xs text-muted-foreground">
                    {gift.occasion && <p>{t('common.occasion')}: {gift.occasion}</p>}
                    {gift.budget_estimate != null && (
                      <p className="flex items-center gap-1.5">
                        <Wallet className="h-3.5 w-3.5" />
                        {gift.budget_estimate}
                      </p>
                    )}
                    {gift.link_url && (
                      <a
                        href={gift.link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {t('common.link')}
                      </a>
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
            <DialogTitle>{editing ? t('gifts.edit') : t('gifts.new')}</DialogTitle>
            <DialogDescription>{t('gifts.subtitle')}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t('gifts.recipient')}</Label>
                <Select value={recipient} onValueChange={(v) => setValue('recipient', v as GiftRecipient)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GIFT_RECIPIENTS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {t(`gifts.recipients.${r}` as TranslationKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('common.status')}</Label>
                <Select value={status} onValueChange={(v) => setValue('status', v as GiftStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GIFT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`gifts.statuses.${s}` as TranslationKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">{t('common.title')}</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{t('common.required')}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">{t('common.description')}</Label>
              <Textarea id="description" rows={2} {...register('description')} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="occasion">{t('common.occasion')}</Label>
                <Input id="occasion" {...register('occasion')} />
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

            <div className="space-y-1.5">
              <Label htmlFor="link_url">{t('common.link')}</Label>
              <Input id="link_url" type="url" placeholder="https://…" {...register('link_url')} />
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
        title={t('gifts.deleteConfirm')}
        confirmLabel={t('common.delete')}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
