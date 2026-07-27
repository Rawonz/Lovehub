import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { CoupleInvitation } from '@/types/database';
import { generateInvitationCode } from '@/lib/dates';

export function usePartnerInvitation() {
  const { session, couple, refreshCouple } = useAuth();
  const [invitation, setInvitation] = useState<CoupleInvitation | null>(null);
  const [loading, setLoading] = useState(true);

  const loadInvitation = useCallback(async () => {
    if (!session?.user || couple) {
      setInvitation(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('couple_invitations')
      .select('*')
      .eq('inviter_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      setInvitation(null);
    } else {
      setInvitation(data as CoupleInvitation | null);
    }
    setLoading(false);
  }, [session?.user, couple]);

  useEffect(() => {
    void loadInvitation();
  }, [loadInvitation]);

  const generate = useCallback(async () => {
    if (!session?.user) return;
    const code = generateInvitationCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('couple_invitations')
      .insert({
        code,
        inviter_id: session.user.id,
        expires_at: expiresAt,
      })
      .select()
      .single();
    if (error) return;
    setInvitation(data as CoupleInvitation);
  }, [session?.user]);

  const cancel = useCallback(async () => {
    if (!invitation) return;
    await supabase.from('couple_invitations').delete().eq('id', invitation.id);
    setInvitation(null);
  }, [invitation]);

  return {
    invitation,
    loading,
    generate,
    cancel,
    refresh: () => void loadInvitation().then(() => void refreshCouple()),
  };
}
