import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useCoupleId } from '@/features/couple/useCouple';
import { useAuth } from '@/lib/auth';
import type { LoveQuiz, QuizResult } from '@/types/database';

export const quizKeys = {
  all: ['quizzes'] as const,
  list: () => [...quizKeys.all, 'list'] as const,
  results: (coupleId: string | null) => [...quizKeys.all, 'results', coupleId] as const,
};

export function useQuizzes() {
  return useQuery<LoveQuiz[]>({
    queryKey: quizKeys.list(),
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('love_quizzes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as LoveQuiz[];
    },
  });
}

export function useQuizResults() {
  const coupleId = useCoupleId();
  return useQuery<QuizResult[]>({
    queryKey: quizKeys.results(coupleId),
    enabled: !!coupleId,
    staleTime: 30_000,
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as QuizResult[];
    },
  });
}

export function useSaveQuizResult() {
  const qc = useQueryClient();
  const coupleId = useCoupleId();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (input: { quizId: string; answers: Record<string, unknown>; score: number | null }) => {
      if (!coupleId || !session?.user) throw new Error('No couple');
      // Upsert: one result per (couple, quiz, user).
      const existing = await supabase
        .from('quiz_results')
        .select('id')
        .eq('couple_id', coupleId)
        .eq('quiz_id', input.quizId)
        .eq('user_id', session.user.id)
        .maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data) {
        const { data, error } = await supabase
          .from('quiz_results')
          .update({ answers: input.answers, score: input.score })
          .eq('id', existing.data.id)
          .select()
          .single();
        if (error) throw error;
        return data as QuizResult;
      }
      const { data, error } = await supabase
        .from('quiz_results')
        .insert({
          couple_id: coupleId,
          quiz_id: input.quizId,
          user_id: session.user.id,
          answers: input.answers,
          score: input.score,
        })
        .select()
        .single();
      if (error) throw error;
      return data as QuizResult;
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: quizKeys.all }),
  });
}
