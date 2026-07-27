import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  Image as ImageIcon,
  CalendarClock,
  CalendarHeart,
  Clock,
  Gift,
  Users,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import { useCoupleStats } from '@/features/couple/useCouple';
import { useUpcomingAnniversaries } from '@/features/anniversary/useAnniversaries';
import { useRecentMemories } from '@/features/memories/useMemories';
import { useUpcomingDates } from '@/features/dates/useDates';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InlineLoader } from '@/components/ui/loader';
import { formatDate } from '@/lib/dates';
import { useSignedUrls } from '@/lib/use-signed-urls';
import type { Memory } from '@/types/database';
import { useDateLocale } from '@/lib/use-date-locale';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

export function DashboardPage() {
  const t = useT();
  const { profile, couple, partner } = useAuth();
  const { data: stats, isLoading: statsLoading } = useCoupleStats();
  const { data: anniversaries } = useUpcomingAnniversaries();
  const { data: memories } = useRecentMemories();
  const { resolved: resolvedMemories } = useSignedUrls<Memory>(memories, 'media_url', 'memories');
  const { data: dates } = useUpcomingDates();
  const dateLocale = useDateLocale();

  const displayName = profile?.display_name ?? '';
  const nextAnniversary = anniversaries?.[0];

  const statCards = [
    { icon: Heart, label: t('dashboard.stats.daysTogether'), value: stats?.daysTogether ?? 0, tint: 'bg-primary/10 text-primary' },
    { icon: ImageIcon, label: t('dashboard.stats.memories'), value: stats?.memoriesCount ?? 0, tint: 'bg-info/10 text-info' },
    { icon: CalendarClock, label: t('dashboard.stats.upcomingDates'), value: stats?.upcomingDatesCount ?? 0, tint: 'bg-success/10 text-success' },
    { icon: CalendarHeart, label: t('dashboard.stats.timelineEvents'), value: stats?.timelineEventsCount ?? 0, tint: 'bg-warning/10 text-warning' },
  ];

  const quickActions = [
    { to: '/app/timeline', icon: CalendarHeart, label: t('nav.timeline') },
    { to: '/app/memories', icon: ImageIcon, label: t('nav.memories') },
    { to: '/app/dates', icon: CalendarClock, label: t('nav.datePlanner') },
    { to: '/app/gifts', icon: Gift, label: t('nav.giftRecommender') },
    { to: '/app/chat', icon: Heart, label: t('nav.chat') },
    { to: '/app/assistant', icon: Sparkles, label: t('nav.assistant') },
  ];

  return (
    <div className="space-y-8">
      <Helmet>
        <title>{t('nav.dashboard')} — LoveHub</title>
      </Helmet>

      <PageHeader
        title={displayName ? t('dashboard.welcome', { name: displayName }) : t('dashboard.welcomeUnknown')}
        subtitle={t('dashboard.subtitle')}
        icon={Heart}
      />

      {!couple && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="card-premium flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {t('dashboard.noPartner.title')}
              </h2>
              <p className="mt-1 max-w-lg text-sm text-muted-foreground">
                {t('dashboard.noPartner.description')}
              </p>
            </div>
          </div>
          <Button asChild className="shrink-0">
            <Link to="/app/partner">
              {t('dashboard.noPartner.cta')}
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </motion.div>
      )}

      {/* Stats */}
      {statsLoading ? (
        <InlineLoader label={t('common.loading')} />
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
          aria-label={t('dashboard.stats.daysTogether')}
        >
          {statCards.map((stat) => (
            <motion.div key={stat.label} variants={item}>
              <Card className="overflow-hidden">
                <CardContent className="p-5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.tint}`} aria-hidden="true">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground" aria-label={`${stat.value} ${stat.label}`}>
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Next anniversary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
              {t('dashboard.nextAnniversary')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextAnniversary ? (
              <div>
                <p className="text-lg font-semibold text-foreground">{nextAnniversary.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatDate(nextAnniversary.anniversary_date, 'PPP', dateLocale)}
                </p>
                <CountdownPill target={nextAnniversary.anniversary_date} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('anniversary.empty')}</p>
            )}
          </CardContent>
        </Card>

        {/* Recent memories */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ImageIcon className="h-4 w-4 text-primary" aria-hidden="true" />
              {t('dashboard.recentMemories')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {resolvedMemories && resolvedMemories.length > 0 ? (
              <div className="grid grid-cols-3 gap-2" role="list" aria-label={t('dashboard.recentMemories')}>
                {resolvedMemories.slice(0, 6).map((m) => (
                  <Link
                    key={m.id}
                    to="/app/memories"
                    role="listitem"
                    className="aspect-square overflow-hidden rounded-lg bg-muted focus-ring"
                    aria-label={m.title}
                  >
                    <img
                      src={m.__signedUrl ?? ''}
                      alt={m.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('memories.empty')}</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming dates */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4 text-primary" aria-hidden="true" />
              {t('dashboard.upcomingDates')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dates && dates.length > 0 ? (
              <ul className="space-y-2">
                {dates.slice(0, 3).map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium text-foreground">{d.title}</span>
                    {d.scheduled_at && (
                      <time
                        dateTime={d.scheduled_at}
                        className="shrink-0 text-xs text-muted-foreground"
                      >
                        {formatDate(d.scheduled_at, 'MMM d', dateLocale)}
                      </time>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t('datePlanner.empty')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <section aria-labelledby="quick-actions-heading">
        <h2
          id="quick-actions-heading"
          className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {t('dashboard.quickActions')}
        </h2>
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
        >
          {quickActions.map((action) => (
            <motion.div key={action.to} variants={item}>
              <Link
                to={action.to}
                className="card-premium group flex flex-col items-center gap-2 p-4 text-center transition-all hover:-translate-y-0.5 focus-ring"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-110" aria-hidden="true">
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-foreground">{action.label}</span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {partner && (
        <p className="text-center text-xs text-muted-foreground">
          {t('partner.status.linked', { name: partner.display_name ?? partner.email })}
        </p>
      )}
    </div>
  );
}

function CountdownPill({ target }: { target: string }) {
  const t = useT();
  const targetDate = new Date(target);
  const now = new Date();

  // Find next occurrence (this year or next year)
  let nextDate = new Date(targetDate);
  nextDate.setFullYear(now.getFullYear());
  if (nextDate < now) {
    nextDate.setFullYear(now.getFullYear() + 1);
  }

  const days = Math.ceil((nextDate.getTime() - now.getTime()) / 86_400_000);

  return (
    <div
      className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary"
      aria-label={`${days} ${t('anniversary.daysLeft')}`}
    >
      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
      {days} {t('anniversary.daysLeft')}
    </div>
  );
}
