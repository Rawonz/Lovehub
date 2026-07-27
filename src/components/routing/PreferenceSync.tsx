import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import type { Locale, Theme } from '@/types/database';

const VALID_LOCALES: Locale[] = ['en', 'tr', 'az'];
const VALID_THEMES: Theme[] = ['light', 'dark', 'system'];

/**
 * Applies the signed-in user's saved locale and theme to the providers.
 * Runs once per profile load so local overrides during a session aren't
 * overwritten on refetch, but a fresh login respects server-stored prefs.
 */
export function PreferenceSync() {
  const { profile, session } = useAuth();
  const { setLocale } = useI18n();
  const { setTheme } = useTheme();
  const appliedSession = useRef<string | null>(null);

  useEffect(() => {
    if (!session?.user || !profile) return;
    // Only apply on a session change (login), not every profile refetch.
    if (appliedSession.current === session.user.id) return;
    appliedSession.current = session.user.id;

    if (profile.locale && VALID_LOCALES.includes(profile.locale)) {
      setLocale(profile.locale);
    }
    if (profile.theme && VALID_THEMES.includes(profile.theme)) {
      setTheme(profile.theme);
    }
  }, [session?.user, profile, setLocale, setTheme]);

  // Reset when the user signs out so the next login re-applies.
  useEffect(() => {
    if (!session) appliedSession.current = null;
  }, [session]);

  return null;
}
