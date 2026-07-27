import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCoupleId } from '@/features/couple/useCouple';
import type { DailyTask } from '@/types/database';

export const dailyTasksKeys = {
  all: ['daily-tasks'] as const,
  list: (coupleId: string | null, date: string) =>
    [...dailyTasksKeys.all, 'list', coupleId, date] as const,
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useDailyTasks(date: string = todayISO()) {
  const coupleId = useCoupleId();
  return useQuery<DailyTask[]>({
    queryKey: dailyTasksKeys.list(coupleId, date),
    enabled: !!coupleId,
    staleTime: 30_000,
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('couple_id', coupleId)
        .eq('task_date', date)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as DailyTask[];
    },
  });
}

export function useCreateDailyTask() {
  const qc = useQueryClient();
  const coupleId = useCoupleId();
  return useMutation({
    mutationFn: async (input: { title: string; task_date: string }) => {
      if (!coupleId) throw new Error('No couple');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('daily_tasks')
        .insert({ ...input, couple_id: coupleId, author_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as DailyTask;
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: dailyTasksKeys.all });
    },
  });
}

export function useToggleDailyTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_done }: { id: string; is_done: boolean }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('daily_tasks')
        .update({
          is_done,
          done_by: is_done ? user!.id : null,
          done_at: is_done ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as DailyTask;
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: dailyTasksKeys.all });
    },
  });
}

export function useDeleteDailyTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('daily_tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: dailyTasksKeys.all });
    },
  });
}
