import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Notification } from '@/types/database';
import { minutesToMillis } from '@/lib/query-keys';

export const notificationsKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationsKeys.all, 'list'] as const,
  unread: () => [...notificationsKeys.all, 'unread'] as const,
};

const STALE = minutesToMillis(2);

export function useNotifications() {
  const { session } = useAuth();
  return useQuery<Notification[]>({
    queryKey: notificationsKeys.list(),
    enabled: !!session,
    staleTime: STALE,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Notification[];
    },
  });
}

export function useUnreadNotifications() {
  const { data } = useNotifications();
  const unread = (data ?? []).filter((n) => !n.read_at).length;
  return { unread, total: data?.length ?? 0 };
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: notificationsKeys.list() });
      const prev = qc.getQueryData<Notification[]>(notificationsKeys.list());
      qc.setQueryData<Notification[]>(notificationsKeys.list(), (old) =>
        (old ?? []).map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(notificationsKeys.list(), ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: notificationsKeys.list() });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .is('read_at', null);
      if (error) throw error;
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: notificationsKeys.list() });
      const prev = qc.getQueryData<Notification[]>(notificationsKeys.list());
      qc.setQueryData<Notification[]>(notificationsKeys.list(), (old) =>
        (old ?? []).map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(notificationsKeys.list(), ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: notificationsKeys.list() });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
    },
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: notificationsKeys.list() });
      const prev = qc.getQueryData<Notification[]>(notificationsKeys.list());
      qc.setQueryData<Notification[]>(notificationsKeys.list(), (old) =>
        (old ?? []).filter((n) => n.id !== id)
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(notificationsKeys.list(), ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: notificationsKeys.list() });
    },
  });
}
