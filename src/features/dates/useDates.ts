import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCoupleId } from '@/features/couple/useCouple';
import type { DatePlan } from '@/types/database';

export const datesKeys = {
  all: ['dates'] as const,
  list: (coupleId: string | null) => [...datesKeys.all, 'list', coupleId] as const,
  upcoming: (coupleId: string | null) => [...datesKeys.all, 'upcoming', coupleId] as const,
};

export function useDates() {
  const coupleId = useCoupleId();
  return useQuery<DatePlan[]>({
    queryKey: datesKeys.list(coupleId),
    enabled: !!coupleId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('date_plans')
        .select('*')
        .eq('couple_id', coupleId)
        .order('scheduled_at', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as DatePlan[];
    },
  });
}

export function useUpcomingDates() {
  const coupleId = useCoupleId();
  return useQuery<DatePlan[]>({
    queryKey: datesKeys.upcoming(coupleId),
    enabled: !!coupleId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('date_plans')
        .select('*')
        .eq('couple_id', coupleId)
        .gte('scheduled_at', new Date().toISOString())
        .in('status', ['idea', 'planned'])
        .order('scheduled_at', { ascending: true })
        .limit(5);
      if (error) throw error;
      return data as DatePlan[];
    },
  });
}

export function useCreateDatePlan() {
  const qc = useQueryClient();
  const coupleId = useCoupleId();
  return useMutation({
    mutationFn: async (input: Omit<DatePlan, 'id' | 'couple_id' | 'author_id' | 'created_at' | 'updated_at'>) => {
      if (!coupleId) throw new Error('No couple');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('date_plans')
        .insert({ ...input, couple_id: coupleId, author_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as DatePlan;
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: datesKeys.all });
    },
  });
}

export function useUpdateDatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<DatePlan> & { id: string }) => {
      const { data, error } = await supabase
        .from('date_plans')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as DatePlan;
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: datesKeys.all });
    },
  });
}

export function useDeleteDatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('date_plans').delete().eq('id', id);
      if (error) throw error;
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: datesKeys.all });
    },
  });
}
