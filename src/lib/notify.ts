import { supabase } from './supabase';

export async function pushNotification(params: {
  userId: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}) {
  const { error } = await supabase.from('notifications').insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    data: params.data ?? {},
  });
  if (error) {
    // Notifications are best-effort; don't throw to block the user flow.
    console.warn('Failed to insert notification:', error.message);
  }
}
