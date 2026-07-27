import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Couple } from '@/types/database';

/**
 * Returns the active couple id for the signed-in user, or null when not linked.
 * Most feature queries depend on this.
 */
export function useCoupleId(): string | null {
  const { couple } = useAuth();
  return couple?.id ?? null;
}

export function useCouple(): Couple | null {
  const { couple } = useAuth();
  return couple;
}

export function usePartnerId(): string | null {
  const { session, couple } = useAuth();
  if (!session?.user || !couple) return null;
  return couple.user_id_1 === session.user.id ? couple.user_id_2 : couple.user_id_1;
}

interface CoupleStats {
  daysTogether: number;
  memoriesCount: number;
  upcomingDatesCount: number;
  timelineEventsCount: number;
}

export function useCoupleStats() {
  const coupleId = useCoupleId();
  return useQuery<CoupleStats>({
    queryKey: ['couple-stats', coupleId],
    enabled: !!coupleId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!coupleId) throw new Error('No couple');
      const [memories, dates, timeline, couple] = await Promise.all([
        supabase.from('memories').select('id', { count: 'exact', head: true }).eq('couple_id', coupleId),
        supabase
          .from('date_plans')
          .select('id', { count: 'exact', head: true })
          .eq('couple_id', coupleId)
          .gte('scheduled_at', new Date().toISOString())
          .in('status', ['idea', 'planned']),
        supabase.from('timeline_events').select('id', { count: 'exact', head: true }).eq('couple_id', coupleId),
        supabase.from('couples').select('anniversary_date, created_at').eq('id', coupleId).maybeSingle(),
      ]);

      for (const r of [memories, dates, timeline]) {
        if (r.error) throw r.error;
      }
      if (couple.error) throw couple.error;

      const start = couple.data?.anniversary_date ?? couple.data?.created_at;
      const daysTogether = start
        ? Math.max(0, Math.floor((Date.now() - new Date(start).getTime()) / 86_400_000))
        : 0;

      return {
        daysTogether,
        memoriesCount: memories.count ?? 0,
        upcomingDatesCount: dates.count ?? 0,
        timelineEventsCount: timeline.count ?? 0,
      };
    },
  });
}
