import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCoupleId } from '@/features/couple/useCouple';
import type { TimelineEvent, TimelineCategory } from '@/types/database';

export const timelineKeys = {
  all: ['timeline'] as const,
  list: (coupleId: string | null) => [...timelineKeys.all, 'list', coupleId] as const,
};

export function useTimelineEvents() {
  const coupleId = useCoupleId();
  return useQuery<TimelineEvent[]>({
    queryKey: timelineKeys.list(coupleId),
    enabled: !!coupleId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('couple_id', coupleId)
        .order('event_date', { ascending: false });
      if (error) throw error;
      return data as TimelineEvent[];
    },
  });
}

export function useCreateTimelineEvent() {
  const qc = useQueryClient();
  const coupleId = useCoupleId();
  return useMutation({
    mutationFn: async (
      input: Omit<TimelineEvent, 'id' | 'couple_id' | 'author_id' | 'created_at' | 'updated_at'>
    ) => {
      if (!coupleId) throw new Error('No couple');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('timeline_events')
        .insert({ ...input, couple_id: coupleId, author_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as TimelineEvent;
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: timelineKeys.all }),
  });
}

export function useUpdateTimelineEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<TimelineEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from('timeline_events')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as TimelineEvent;
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: timelineKeys.all }),
  });
}

export function useDeleteTimelineEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (event: TimelineEvent) => {
      const { error } = await supabase.from('timeline_events').delete().eq('id', event.id);
      if (error) throw error;
      if (event.cover_url && !event.cover_url.startsWith('http')) {
        await supabase.storage.from('memories').remove([event.cover_url]);
      }
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: timelineKeys.all }),
  });
}

export const TIMELINE_CATEGORIES: TimelineCategory[] = [
  'milestone',
  'trip',
  'date',
  'photo',
  'note',
  'other',
];
