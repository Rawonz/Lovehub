import {
  differenceInCalendarDays,
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
} from 'date-fns';
import type { Locale } from 'date-fns/locale';
import type { Locale as AppLocale } from '@/types/database';

const dateFnsLocaleLoaders: Record<AppLocale, () => Promise<Locale>> = {
  en: () => import('date-fns/locale/en-US').then((m) => m.enUS),
  tr: () => import('date-fns/locale/tr').then((m) => m.tr),
  az: () => import('date-fns/locale/az').then((m) => m.az),
};


const loadedLocales = new Map<AppLocale, Locale>();

export async function loadDateLocale(locale: AppLocale): Promise<Locale | undefined> {
  if (loadedLocales.has(locale)) return loadedLocales.get(locale);
  try {
    const loc = await dateFnsLocaleLoaders[locale]();
    loadedLocales.set(locale, loc);
    return loc;
  } catch {
    return undefined;
  }
}

export function formatDate(
  date: string | Date,
  pattern = 'MMM d, yyyy',
  locale?: Locale
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  try {
    return format(d, pattern, { locale });
  } catch {
    return format(d, pattern);
  }
}

export function formatRelative(date: string | Date, locale?: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  try {
    return formatDistanceToNow(d, { addSuffix: true, locale });
  } catch {
    return formatDistanceToNow(d, { addSuffix: true });
  }
}

export function friendlyDay(
  date: string | Date,
  todayLabel: string,
  tomorrowLabel: string,
  yesterdayLabel: string,
  fallback: string
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isToday(d)) return todayLabel;
  if (isTomorrow(d)) return tomorrowLabel;
  if (isYesterday(d)) return yesterdayLabel;
  return fallback;
}

export function daysBetween(start: string | Date, end: string | Date): number {
  const a = typeof start === 'string' ? new Date(start) : start;
  const b = typeof end === 'string' ? new Date(end) : end;
  return differenceInCalendarDays(b, a);
}

export function daysUntil(target: string | Date): number {
  const d = typeof target === 'string' ? new Date(target) : target;
  return differenceInCalendarDays(d, new Date());
}

export function nextRecurrence(
  base: string | Date,
  recurrence: 'once' | 'yearly' | 'monthly'
): Date | null {
  const d = typeof base === 'string' ? new Date(base) : base;
  if (recurrence === 'once') return d;
  const now = new Date();
  const next = new Date(d);
  if (recurrence === 'yearly') {
    next.setFullYear(now.getFullYear());
    if (next < now) next.setFullYear(now.getFullYear() + 1);
  } else if (recurrence === 'monthly') {
    next.setMonth(now.getMonth());
    next.setFullYear(now.getFullYear());
    if (next < now) next.setMonth(now.getMonth() + 1);
  }
  return next;
}

export function generateInvitationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
