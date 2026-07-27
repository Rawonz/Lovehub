import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCoupleId } from '@/features/couple/useCouple';
import type { Anniversary } from '@/types/database';
import { nextRecurrence } from '@/lib/dates';

export const anniversariesKeys = {
  all: ['anniversaries'] as const,
  list: (coupleId: string | null) => [...anniversariesKeys.all, 'list', coupleId] as const,
  upcoming: (coupleId: string | null) => [...anniversariesKeys.all, 'upcoming', coupleId] as const,
};

export function useAnniversaries() {
  const coupleId = useCoupleId();
  return useQuery<Anniversary[]>({
    queryKey: anniversariesKeys.list(coupleId),
    enabled: !!coupleId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('anniversaries')
        .select('*')
        .eq('couple_id', coupleId)
        .order('anniversary_date', { ascending: true });
      if (error) throw error;
      return data as Anniversary[];
    },
  });
}

export function useUpcomingAnniversaries() {
  const { data } = useAnniversaries();
  if (!data) return { data: undefined };
  const upcoming = [...data]
    .map((a) => ({ ...a, next: nextRecurrence(a.anniversary_date, a.recurrence) }))
    .filter((a) => a.next && a.next.getTime() > Date.now())
    .sort((a, b) => (a.next!.getTime() - b.next!.getTime()))
    .slice(0, 5);
  return { data: upcoming as (Anniversary & { next: Date })[] };
}

export function useCreateAnniversary() {
  const qc = useQueryClient();
  const coupleId = useCoupleId();
  return useMutation({
    mutationFn: async (input: Omit<Anniversary, 'id' | 'couple_id' | 'author_id' | 'created_at' | 'updated_at'>) => {
      if (!coupleId) throw new Error('No couple');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('anniversaries')
        .insert({ ...input, couple_id: coupleId, author_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as Anniversary;
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: anniversariesKeys.all });
    },
  });
}

export function useUpdateAnniversary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Anniversary> & { id: string }) => {
      const { data, error } = await supabase
        .from('anniversaries')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Anniversary;
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: anniversariesKeys.all });
    },
  });
}

export function useDeleteAnniversary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('anniversaries').delete().eq('id', id);
      if (error) throw error;
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: anniversariesKeys.all });
    },
  });
}
