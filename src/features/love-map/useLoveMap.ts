import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCoupleId } from '@/features/couple/useCouple';
import type { LoveMapLocation, LocationCategory } from '@/types/database';

export const loveMapKeys = {
  all: ['love-map'] as const,
  list: (coupleId: string | null) => [...loveMapKeys.all, 'list', coupleId] as const,
};

export function useLoveMapLocations() {
  const coupleId = useCoupleId();
  return useQuery<LoveMapLocation[]>({
    queryKey: loveMapKeys.list(coupleId),
    enabled: !!coupleId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('love_map_locations')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as LoveMapLocation[];
    },
  });
}

export function useCreateLocation() {
  const qc = useQueryClient();
  const coupleId = useCoupleId();
  return useMutation({
    mutationFn: async (
      input: Omit<LoveMapLocation, 'id' | 'couple_id' | 'author_id' | 'created_at' | 'updated_at'>
    ) => {
      if (!coupleId) throw new Error('No couple');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('love_map_locations')
        .insert({ ...input, couple_id: coupleId, author_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data as LoveMapLocation;
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: loveMapKeys.all }),
  });
}

export function useUpdateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<LoveMapLocation> & { id: string }) => {
      const { data, error } = await supabase
        .from('love_map_locations')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as LoveMapLocation;
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: loveMapKeys.all }),
  });
}

export function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('love_map_locations').delete().eq('id', id);
      if (error) throw error;
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: loveMapKeys.all }),
  });
}

export const LOCATION_CATEGORIES: LocationCategory[] = [
  'special',
  'first_date',
  'trip',
  'restaurant',
  'home',
  'other',
];
