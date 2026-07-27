import { Helmet } from 'react-helmet-async';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useT } from '@/lib/i18n';
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useDeleteNotification,
} from '@/features/notifications/useNotifications';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { InlineLoader } from '@/components/ui/loader';
import { useDateLocale } from '@/lib/use-date-locale';
import { formatRelative } from '@/lib/dates';

export function NotificationsPage() {
  const t = useT();
  const dateLocale = useDateLocale();
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const remove = useDeleteNotification();

  const unread = (notifications ?? []).filter((n) => !n.read_at).length;

  return (
    <div className="space-y-6">
      <Helmet>
        <title>{t('notifications.title')} — LoveHub</title>
      </Helmet>

      <PageHeader
        title={t('notifications.title')}
        subtitle={t('notifications.subtitle')}
        icon={Bell}
        action={
          unread > 0 && (
            <Button variant="outline" onClick={() => markAllRead.mutate()}>
              <CheckCheck className="mr-2 h-4 w-4" />
              {t('notifications.markAllRead')}
            </Button>
          )
        }
      />

      {isLoading ? (
        <InlineLoader label={t('common.loading')} />
      ) : !notifications || notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={t('notifications.empty')}
          description={t('notifications.subtitle')}
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n, idx) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.3) }}
            >
              <Card className={n.read_at ? 'opacity-70' : ''}>
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{n.title}</p>
                    {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatRelative(n.created_at, dateLocale)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {!n.read_at && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => markRead.mutate(n.id)}
                        aria-label={t('notifications.markRead')}
                      >
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => remove.mutate(n.id)}
                      aria-label={t('notifications.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
