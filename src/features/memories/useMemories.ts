import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCoupleId } from '@/features/couple/useCouple';
import type { Memory } from '@/types/database';

export const memoriesKeys = {
  all: ['memories'] as const,
  list: (coupleId: string | null) => [...memoriesKeys.all, 'list', coupleId] as const,
  recent: (coupleId: string | null) => [...memoriesKeys.all, 'recent', coupleId] as const,
};

export function useMemories() {
  const coupleId = useCoupleId();
  return useQuery<Memory[]>({
    queryKey: memoriesKeys.list(coupleId),
    enabled: !!coupleId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Memory[];
    },
  });
}

export function useRecentMemories() {
  const coupleId = useCoupleId();
  return useQuery<Memory[]>({
    queryKey: memoriesKeys.recent(coupleId),
    enabled: !!coupleId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data as Memory[];
    },
  });
}

export function useCreateMemory() {
  const qc = useQueryClient();
  const coupleId = useCoupleId();
  return useMutation({
    mutationFn: async (input: Omit<Memory, 'id' | 'couple_id' | 'author_id' | 'created_at' | 'updated_at'>) => {
      if (!coupleId) throw new Error('No couple');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('memories')
        .insert({ ...input, couple_id: coupleId, author_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as Memory;
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: memoriesKeys.all });
    },
  });
}

export function useUpdateMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Memory> & { id: string }) => {
      const { data, error } = await supabase
        .from('memories')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Memory;
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: memoriesKeys.all });
    },
  });
}

export function useDeleteMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (memory: Memory) => {
      const { error } = await supabase.from('memories').delete().eq('id', memory.id);
      if (error) throw error;
      // Best-effort: delete the storage object too.
      if (memory.media_url && !memory.media_url.startsWith('http')) {
        await supabase.storage.from('memories').remove([memory.media_url]);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: memoriesKeys.all });
    },
  });
}
