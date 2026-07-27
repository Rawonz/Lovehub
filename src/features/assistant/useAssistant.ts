import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { AIConversation, AIMessage } from '@/types/database';

export const aiKeys = {
  all: ['ai'] as const,
  conversations: () => [...aiKeys.all, 'conversations'] as const,
  messages: (convId: string | null) => [...aiKeys.all, 'messages', convId] as const,
};

export function useConversations() {
  const { session } = useAuth();
  return useQuery<AIConversation[]>({
    queryKey: aiKeys.conversations(),
    enabled: !!session,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as AIConversation[];
    },
  });
}

export function useConversationMessages(conversationId: string | null) {
  return useQuery<AIMessage[]>({
    queryKey: aiKeys.messages(conversationId),
    enabled: !!conversationId,
    staleTime: 15_000,
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as AIMessage[];
    },
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (title: string | undefined = undefined) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('ai_conversations')
        .insert({ user_id: user!.id, title: title ?? 'New conversation' })
        .select()
        .single();
      if (error) throw error;
      return data as AIConversation;
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: aiKeys.conversations() }),
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ai_conversations').delete().eq('id', id);
      if (error) throw error;
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: aiKeys.all });
    },
  });
}

export function useSendMessage(conversationId: string | null) {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async ({ content, history }: { content: string; history: { role: 'user' | 'assistant'; content: string }[] }) => {
      if (!conversationId) throw new Error('No conversation');
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Persist user message.
      const { data: userMsg, error: userErr } = await supabase
        .from('ai_messages')
        .insert({ conversation_id: conversationId, role: 'user', content })
        .select()
        .single();
      if (userErr) throw userErr;

      // Call edge function.
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token ?? ''}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ message: content, history }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { reply?: string; error?: string };
      if (data.error) throw new Error(data.error);
      const reply = data.reply ?? '';

      // Persist assistant message.
      const { data: assistantMsg, error: assistantErr } = await supabase
        .from('ai_messages')
        .insert({ conversation_id: conversationId, role: 'assistant', content: reply })
        .select()
        .single();
      if (assistantErr) throw assistantErr;

      // Update conversation title from first user message.
      void supabase
        .from('ai_conversations')
        .update({ title: content.slice(0, 40) })
        .eq('id', conversationId)
        .then(() => qc.invalidateQueries({ queryKey: aiKeys.conversations() }));

      return { userMsg, assistantMsg };
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: aiKeys.messages(conversationId) });
      void qc.invalidateQueries({ queryKey: aiKeys.conversations() });
    },
  });
}
