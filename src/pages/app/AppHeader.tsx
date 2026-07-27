import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, Sun, Moon, Monitor, LogOut, Globe } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useI18n, useT } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { LOCALES, LOCALE_LABELS } from '@/lib/i18n/config';
import { Button } from '@/components/ui/button';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUnreadNotifications } from '@/features/notifications/useNotifications';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import type { Locale } from '@/types/database';

export function AppHeader({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const t = useT();
  const { profile, session, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useI18n();
  const navigate = useNavigate();
  const { unread } = useUnreadNotifications();

  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  const themeLabel = theme === 'light' ? t('theme.light') : theme === 'dark' ? t('theme.dark') : t('theme.system');

  const persistLocale = async (next: Locale) => {
    setLocale(next);
    if (session?.user) {
      await supabase.from('profiles').update({ locale: next }).eq('id', session.user.id);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-lg sm:px-6">
      {/* Skip to content link for keyboard users */}
      <a
        href="#main-content"
        className="absolute left-4 top-4 -translate-y-20 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>

      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="lg:hidden"
          onClick={onOpenMobileNav}
          aria-label={t('common.search') /* reuse or add 'Open navigation menu' key */}
          aria-expanded={false}
          aria-controls="mobile-nav"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>

      <div className="flex items-center gap-1.5" role="toolbar" aria-label="App controls">
        {/* Language */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" aria-label={t('language.select')}>
              <Globe className="h-[18px] w-[18px]" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('language.label')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {LOCALES.map((l) => (
              <DropdownMenuItem
                key={l}
                onClick={() => persistLocale(l)}
                className={cn(l === locale && 'font-semibold')}
                aria-current={l === locale ? 'true' : undefined}
              >
                {LOCALE_LABELS[l]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" aria-label={`${t('theme.toggle')}: ${themeLabel}`}>
              <ThemeIcon className="h-[18px] w-[18px]" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('theme.toggle')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme('light')} aria-current={theme === 'light' ? 'true' : undefined}>
              <Sun className="mr-2 h-4 w-4" aria-hidden="true" /> {t('theme.light')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')} aria-current={theme === 'dark' ? 'true' : undefined}>
              <Moon className="mr-2 h-4 w-4" aria-hidden="true" /> {t('theme.dark')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')} aria-current={theme === 'system' ? 'true' : undefined}>
              <Monitor className="mr-2 h-4 w-4" aria-hidden="true" /> {t('theme.system')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <Button
          asChild
          size="icon"
          variant="ghost"
          aria-label={unread > 0 ? `${t('nav.notifications')} (${unread} unread)` : t('nav.notifications')}
          className="relative"
        >
          <Link to="/app/notifications">
            <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
            {unread > 0 && (
              <span
                className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground"
                aria-hidden="true"
              >
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>
        </Button>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="ml-1 rounded-full focus-ring"
              aria-label={`${t('nav.profile')}: ${profile?.display_name ?? profile?.email ?? 'Account'}`}
            >
              <ProfileAvatar path={profile?.avatar_url} name={profile?.display_name} className="h-8 w-8" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate">{profile?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/app/profile')}>
              {t('nav.profile')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/app/settings')}>
              {t('nav.settings')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/about')}>
              {t('nav.about')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => void signOut().then(() => navigate('/'))}
            >
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              {t('nav.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
