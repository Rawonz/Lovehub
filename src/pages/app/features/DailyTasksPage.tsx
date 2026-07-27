import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ListChecks, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useT } from '@/lib/i18n';
import { dailyTaskSchema, type DailyTaskValues } from '@/lib/schemas';
import {
  useDailyTasks,
  useCreateDailyTask,
  useToggleDailyTask,
  useDeleteDailyTask,
} from '@/features/daily-tasks/useDailyTasks';
import { useAuth } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { InlineLoader } from '@/components/ui/loader';
import { ProfileAvatar } from '@/components/ui/profile-avatar';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DailyTasksPage() {
  const t = useT();
  const { profile, partner } = useAuth();
  const [date] = useState(todayISO());

  const { data: tasks, isLoading } = useDailyTasks(date);
  const createMut = useCreateDailyTask();
  const toggleMut = useToggleDailyTask();
  const deleteMut = useDeleteDailyTask();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<DailyTaskValues>({
    resolver: zodResolver(dailyTaskSchema),
    defaultValues: { title: '', task_date: date },
  });

  const onSubmit = async (values: DailyTaskValues) => {
    try {
      await createMut.mutateAsync({ title: values.title, task_date: date });
      reset({ title: '', task_date: date });
    } catch (err) {
      toast.error(t('errors.generic'));
      console.error(err);
    }
  };

  const toggle = async (id: string, next: boolean) => {
    try {
      await toggleMut.mutateAsync({ id, is_done: next });
    } catch (err) {
      toast.error(t('errors.generic'));
      console.error(err);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteMut.mutateAsync(id);
      toast.success(t('toast.deleted'));
    } catch (err) {
      toast.error(t('errors.generic'));
      console.error(err);
    }
  };

  const done = (tasks ?? []).filter((x) => x.is_done).length;
  const total = tasks?.length ?? 0;

  const avatarFor = (userId: string) => {
    if (profile && userId === profile.id) return profile;
    if (partner && userId === partner.id) return partner;
    return null;
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>{t('dailyTasks.title')} — LoveHub</title>
      </Helmet>

      <PageHeader
        title={t('dailyTasks.title')}
        subtitle={t('dailyTasks.subtitle')}
        icon={ListChecks}
      />

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
            <Input
              placeholder={t('dailyTasks.addPlaceholder')}
              {...register('title')}
            />
            <Button type="submit" disabled={isSubmitting}>
              <Plus className="mr-2 h-4 w-4" />
              {t('common.create')}
            </Button>
          </form>

          {total > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('dailyTasks.progress', { done, total })}</span>
                <span>{Math.round((done / total) * 100)}%</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full gradient-bg"
                  initial={{ width: 0 }}
                  animate={{ width: `${total ? (done / total) * 100 : 0}%` }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <InlineLoader label={t('common.loading')} />
      ) : !tasks || tasks.length === 0 ? (
        <EmptyState icon={ListChecks} title={t('dailyTasks.empty')} />
      ) : (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            <AnimatePresence initial={false}>
              {tasks.map((task) => {
                const doneBy = task.done_by ? avatarFor(task.done_by) : null;
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="group flex items-center gap-3 px-5 py-3.5"
                  >
                    <Checkbox
                      checked={task.is_done}
                      onCheckedChange={(v) => void toggle(task.id, v === true)}
                      aria-label={task.title}
                    />
                    <span
                      className={
                        task.is_done
                          ? 'flex-1 text-sm text-muted-foreground line-through'
                          : 'flex-1 text-sm text-foreground'
                      }
                    >
                      {task.title}
                    </span>
                    {doneBy && (
                      <ProfileAvatar
                        path={doneBy.avatar_url}
                        name={doneBy.display_name}
                        className="h-6 w-6"
                      />
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                      onClick={() => void remove(task.id)}
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
