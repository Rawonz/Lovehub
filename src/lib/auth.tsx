import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Couple, Profile } from '@/types/database';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  couple: Couple | null;
  partner: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshCouple: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return data as Profile | null;
}

async function fetchCoupleAndPartner(
  userId: string
): Promise<{ couple: Couple | null; partner: Profile | null }> {
  const { data } = await supabase
    .from('couples')
    .select('*')
    .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const couple = data as Couple | null;
  if (!couple) return { couple: null, partner: null };

  const partnerId =
    couple.user_id_1 === userId ? couple.user_id_2 : couple.user_id_1;
  const partner = await fetchProfile(partnerId);
  return { couple, partner };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initial session load + auth state listener
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (!data.session) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!mounted) return;
      setSession(next);
      if (!next) {
        setProfile(null);
        setCouple(null);
        setPartner(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Load profile + couple when session changes
  useEffect(() => {
    if (!session?.user) return;
    let mounted = true;
    setLoading(true);

    (async () => {
      const [p, { couple: c, partner: pt }] = await Promise.all([
        fetchProfile(session.user.id),
        fetchCoupleAndPartner(session.user.id),
      ]);
      if (!mounted) return;
      setProfile(p);
      setCouple(c);
      setPartner(pt);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [session]);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return;
    const p = await fetchProfile(session.user.id);
    setProfile(p);
  }, [session]);

  const refreshCouple = useCallback(async () => {
    if (!session?.user) return;
    const { couple: c, partner: pt } = await fetchCoupleAndPartner(
      session.user.id
    );
    setCouple(c);
    setPartner(pt);
  }, [session]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setCouple(null);
    setPartner(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, profile, couple, partner, loading, signOut, refreshProfile, refreshCouple }),
    [session, profile, couple, partner, loading, signOut, refreshProfile, refreshCouple]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
