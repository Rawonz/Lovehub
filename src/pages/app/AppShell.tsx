import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  CalendarHeart,
  Image as ImageIcon,
  MapPin,
  CalendarClock,
  Gift,
  HelpCircle,
  Clock,
  MessageCircle,
  Bell,
  Settings,
  Sparkles,
  Heart,
  ListChecks,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { useT, type TranslationKey } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { WALLPAPER_BACKGROUNDS } from '@/lib/wallpapers';
import { Button } from '@/components/ui/button';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { AppHeader } from './AppHeader';

interface NavItem {
  to: string;
  labelKey: TranslationKey;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

const navItems: NavItem[] = [
  { to: '/app', labelKey: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/partner', labelKey: 'nav.partner', icon: Users },
  { to: '/app/timeline', labelKey: 'nav.timeline', icon: CalendarHeart },
  { to: '/app/memories', labelKey: 'nav.memories', icon: ImageIcon },
  { to: '/app/love-map', labelKey: 'nav.loveMap', icon: MapPin },
  { to: '/app/dates', labelKey: 'nav.datePlanner', icon: CalendarClock },
  { to: '/app/daily-tasks', labelKey: 'nav.dailyTasks', icon: ListChecks },
  { to: '/app/gifts', labelKey: 'nav.giftRecommender', icon: Gift },
  { to: '/app/quiz', labelKey: 'nav.loveQuiz', icon: HelpCircle },
  { to: '/app/anniversary', labelKey: 'nav.anniversary', icon: Clock },
  { to: '/app/chat', labelKey: 'nav.chat', icon: MessageCircle },
  { to: '/app/assistant', labelKey: 'nav.assistant', icon: Sparkles },
];

const secondaryNav: NavItem[] = [
  { to: '/app/profile', labelKey: 'nav.profile', icon: Heart },
  { to: '/app/notifications', labelKey: 'nav.notifications', icon: Bell },
  { to: '/app/settings', labelKey: 'nav.settings', icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const t = useT();
  const { profile, couple } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const wallpaperBg = WALLPAPER_BACKGROUNDS[couple?.wallpaper ?? 'default'];

  // Focus close button when mobile nav opens
  useEffect(() => {
    if (mobileOpen) {
      closeButtonRef.current?.focus();
    }
  }, [mobileOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mobileOpen]);

  // Prevent body scroll when mobile nav open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <div className="relative flex min-h-screen bg-background">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{ background: wallpaperBg }}
        aria-hidden="true"
      />
      {/* Desktop sidebar */}
      <aside
        className="hidden w-64 shrink-0 border-r border-border bg-card/40 lg:flex lg:flex-col"
        aria-label={t('nav.dashboard')}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-card lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label={t('nav.dashboard')}
            >
              <div className="flex items-center justify-between p-4">
                <BrandMark />
                <Button
                  ref={closeButtonRef}
                  size="icon"
                  variant="ghost"
                  onClick={() => setMobileOpen(false)}
                  aria-label={t('common.close')}
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>
              <NavList onNavigate={() => setMobileOpen(false)} />
              <SidebarFooter />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onOpenMobileNav={() => setMobileOpen(true)} />
        <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );

  function SidebarContent() {
    return (
      <>
        <div className="flex h-16 items-center px-5">
          <BrandMark />
        </div>
        <NavList />
        <SidebarFooter />
      </>
    );
  }

  function BrandMark() {
    return (
      <NavLink to="/app" className="flex items-center gap-2 font-semibold tracking-tight focus-ring rounded-lg">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl gradient-bg text-white shadow-sm" aria-hidden="true">
          <Heart className="h-4 w-4 fill-white" />
        </span>
        LoveHub
      </NavLink>
    );
  }

  function NavList({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin" aria-label="Main navigation">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground" aria-hidden="true">
          {t('nav.dashboard')}
        </p>
        <ul role="list" className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-ring',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                {t(item.labelKey)}
              </NavLink>
            </li>
          ))}
        </ul>

        <p className="px-3 pb-2 pt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground" aria-hidden="true">
          {t('nav.profile')}
        </p>
        <ul role="list" className="space-y-0.5">
          {secondaryNav.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-ring',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )
                }
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                {t(item.labelKey)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  function SidebarFooter() {
    const navigate = useNavigate();
    return (
      <div className="border-t border-border p-3">
        <button
          onClick={() => navigate('/app/profile')}
          className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted focus-ring"
          aria-label={`${t('nav.profile')}: ${profile?.display_name ?? 'LoveHub'}`}
        >
          <ProfileAvatar path={profile?.avatar_url} name={profile?.display_name} className="h-9 w-9" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {profile?.display_name ?? 'LoveHub'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {profile?.email}
            </p>
          </div>
        </button>
      </div>
    );
  }
}
