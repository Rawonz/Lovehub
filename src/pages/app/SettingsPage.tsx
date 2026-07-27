import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, LogOut, Trash2, Globe, Palette, Image as ImageIcon, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { useI18n, useT, type TranslationKey } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { LOCALES, LOCALE_LABELS } from '@/lib/i18n/config';
import { WALLPAPER_BACKGROUNDS, WALLPAPER_OPTIONS } from '@/lib/wallpapers';
import { supabase } from '@/lib/supabase';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useState } from 'react';
import type { Locale, Theme, Wallpaper } from '@/types/database';

export function SettingsPage() {
  const t = useT();
  const navigate = useNavigate();
  const { session, couple, signOut, refreshCouple } = useAuth();
  const { locale, setLocale } = useI18n();
  const { theme, setTheme } = useTheme();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const persistLocale = async (next: Locale) => {
    setLocale(next);
    if (session?.user) {
      await supabase.from('profiles').update({ locale: next }).eq('id', session.user.id);
    }
  };

  const persistTheme = async (next: Theme) => {
    setTheme(next);
    if (session?.user) {
      await supabase.from('profiles').update({ theme: next }).eq('id', session.user.id);
    }
  };

  const persistWallpaper = async (next: Wallpaper) => {
    if (!couple) return;
    const { error } = await supabase.from('couples').update({ wallpaper: next }).eq('id', couple.id);
    if (error) {
      toast.error(t('errors.generic'));
      return;
    }
    await refreshCouple();
  };

  const handleDeleteAccount = async () => {
    if (!session?.user) return;
    try {
      // Profile + couple rows cascade-delete via FK. The auth user record itself
      // is managed by Supabase Auth and cannot be removed from the anon client,
      // so we remove the profile, sign out, and redirect.
      await supabase.from('profiles').delete().eq('id', session.user.id);
      await signOut();
      toast.success(t('settings.account.deleteAccount'));
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(t('errors.generic'));
      console.error(err);
    } finally {
      setConfirmDelete(false);
    }
  };

  return (
    <div className="space-y-8">
      <Helmet>
        <title>{t('settings.title')} — LoveHub</title>
      </Helmet>

      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} icon={SettingsIcon} />

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            {t('settings.preferences.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label icon={Globe}>{t('settings.preferences.language')}</Label>
            <Select value={locale} onValueChange={(v) => void persistLocale(v as Locale)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCALES.map((l) => (
                  <SelectItem key={l} value={l}>
                    {LOCALE_LABELS[l]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label icon={Palette}>{t('settings.preferences.theme')}</Label>
            <Select value={theme} onValueChange={(v) => void persistTheme(v as Theme)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t('theme.light')}</SelectItem>
                <SelectItem value="dark">{t('theme.dark')}</SelectItem>
                <SelectItem value="system">{t('theme.system')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Wallpaper (shared with partner) */}
      {couple && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              {t('settings.wallpaper.title')}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{t('settings.wallpaper.subtitle')}</p>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {WALLPAPER_OPTIONS.map((w) => {
              const active = (couple.wallpaper ?? 'default') === w;
              return (
                <button
                  key={w}
                  type="button"
                  onClick={() => void persistWallpaper(w)}
                  className={`relative flex h-20 flex-col items-center justify-end overflow-hidden rounded-xl border p-2 text-xs font-medium transition-colors ${
                    active ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/40'
                  }`}
                  style={{ background: WALLPAPER_BACKGROUNDS[w], backgroundColor: 'hsl(var(--card))' }}
                >
                  {active && (
                    <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <span className="rounded-full bg-background/80 px-2 py-0.5 text-foreground backdrop-blur">
                    {t(`settings.wallpaper.options.${w}` as TranslationKey)}
                  </span>
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.account.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            onClick={async () => {
              await signOut();
              navigate('/');
              toast.success(t('auth.signedOut'));
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {t('settings.account.signOut')}
          </Button>

          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
            <h3 className="text-sm font-semibold text-destructive">
              {t('settings.account.deleteAccount')}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('settings.account.deleteWarning')}
            </p>
            <Button
              variant="destructive"
              className="mt-3"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('settings.account.deleteAccount')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('settings.account.deleteAccount')}
        description={t('settings.account.deleteWarning')}
        confirmLabel={t('settings.account.deleteAccount')}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}

function Label({ icon: Icon, children }: { icon: typeof Globe; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-foreground">
      <Icon className="h-4 w-4 text-muted-foreground" />
      {children}
    </label>
  );
}
