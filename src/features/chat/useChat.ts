import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useCoupleId } from '@/features/couple/useCouple';
import type { ChatMessage } from '@/types/database';

export const chatKeys = {
  all: ['chat'] as const,
  list: (coupleId: string | null) => [...chatKeys.all, 'list', coupleId] as const,
};

export function useChatMessages() {
  const coupleId = useCoupleId();
  const qc = useQueryClient();
  const seenCouple = useRef<string | null>(null);

  useEffect(() => {
    if (!coupleId || seenCouple.current === coupleId) return;
    seenCouple.current = coupleId;

    const channel = supabase
      .channel(`chat:${coupleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: chatKeys.list(coupleId) });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `couple_id=eq.${coupleId}`,
        },
        () => {
          void qc.invalidateQueries({ queryKey: chatKeys.list(coupleId) });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [coupleId, qc]);

  return useQuery<ChatMessage[]>({
    queryKey: chatKeys.list(coupleId),
    enabled: !!coupleId,
    staleTime: 15_000,
    queryFn: async () => {
      if (!coupleId) return [];
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) throw error;
      return data as ChatMessage[];
    },
  });
}

export interface SendMessageInput {
  content: string;
  attachmentUrl?: string | null;
}

export function useSendMessage() {
  const qc = useQueryClient();
  const coupleId = useCoupleId();
  return useMutation({
    mutationFn: async ({ content, attachmentUrl }: SendMessageInput) => {
      if (!coupleId) throw new Error('No couple');
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          couple_id: coupleId,
          sender_id: user!.id,
          content,
          attachment_url: attachmentUrl ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as ChatMessage;
    },
    onMutate: async ({ content, attachmentUrl }: SendMessageInput) => {
      await qc.cancelQueries({ queryKey: chatKeys.list(coupleId) });
      const prev = qc.getQueryData<ChatMessage[]>(chatKeys.list(coupleId));
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const optimistic: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        couple_id: coupleId ?? '',
        sender_id: user?.id ?? '',
        content,
        attachment_url: attachmentUrl ?? null,
        read_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      qc.setQueryData<ChatMessage[]>(chatKeys.list(coupleId), (old) => [...(old ?? []), optimistic]);
      return { prev };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prev) qc.setQueryData(chatKeys.list(coupleId), ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.all });
    },
  });
}

export async function uploadChatAttachment(file: File, userId: string): Promise<string> {
  const { compressImage } = await import('@/lib/storage');
  const compressed = await compressImage(file);
  const ext = compressed.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('chat-attachments').upload(path, compressed);
  if (error) throw error;
  return path;
}

export function useMarkChatRead() {
  const qc = useQueryClient();
  const coupleId = useCoupleId();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) return;
      const { error } = await supabase
        .from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', ids)
        .is('read_at', null);
      if (error) throw error;
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.list(coupleId) });
    },
  });
}
