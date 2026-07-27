import type { Locale } from '@/types/database';

export const LOCALES: Locale[] = ['en', 'tr', 'az'];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  tr: 'Türkçe',
  az: 'Azərbaycan',
};

export const DEFAULT_LOCALE: Locale = 'en';
