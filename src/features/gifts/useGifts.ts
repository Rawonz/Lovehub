import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCoupleId } from '@/features/couple/useCouple';
import type { GiftSuggestion, GiftRecipient, GiftStatus } from '@/types/database';

export const giftsKeys = {
  all: ['gifts'] as const,
  list: (coupleId: string | null) => [...giftsKeys.all, 'list', coupleId] as const,
};

export function useGifts() {
  const coupleId = useCoupleId();
  return useQuery<GiftSuggestion[]>({
    queryKey: giftsKeys.list(coupleId),
    enabled: !!coupleId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('gift_suggestions')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as GiftSuggestion[];
    },
  });
}

export function useCreateGift() {
  const qc = useQueryClient();
  const coupleId = useCoupleId();
  return useMutation({
    mutationFn: async (
      input: Omit<GiftSuggestion, 'id' | 'couple_id' | 'author_id' | 'created_at' | 'updated_at'>
    ) => {
      if (!coupleId) throw new Error('No couple');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('gift_suggestions')
        .insert({ ...input, couple_id: coupleId, author_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as GiftSuggestion;
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: giftsKeys.all }),
  });
}

export function useUpdateGift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<GiftSuggestion> & { id: string }) => {
      const { data, error } = await supabase
        .from('gift_suggestions')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as GiftSuggestion;
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: giftsKeys.all }),
  });
}

export function useDeleteGift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gift_suggestions').delete().eq('id', id);
      if (error) throw error;
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: giftsKeys.all }),
  });
}

export const GIFT_RECIPIENTS: GiftRecipient[] = ['partner', 'me'];
export const GIFT_STATUSES: GiftStatus[] = ['idea', 'purchased', 'given', 'archived'];
