import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Locale } from '@/types/database';
import { DEFAULT_LOCALE, LOCALES } from './config';
import { en, type TranslationDict } from './locales/en';
import { tr } from './locales/tr';
import { az } from './locales/az';

const dictionaries: Record<Locale, TranslationDict> = { en, tr, az };

type FlattenKeys<T, Prefix extends string = ''> = T extends string
  ? Prefix
  : {
      [K in keyof T & string]: FlattenKeys<
        T[K],
        Prefix extends '' ? K : `${Prefix}.${K}`
      >;
    }[keyof T & string];

export type TranslationKey = FlattenKeys<TranslationDict>;

type ReplaceVars = Record<string, string | number>;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, vars?: ReplaceVars) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'lovehub.locale';

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && LOCALES.includes(stored as Locale)) return stored as Locale;
  const browser = (navigator.language || 'en').slice(0, 2).toLowerCase();
  if (LOCALES.includes(browser as Locale)) return browser as Locale;
  return DEFAULT_LOCALE;
}

function resolve(dict: TranslationDict, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = dict;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, vars?: ReplaceVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);

  const value = useMemo<I18nContextValue>(() => {
    const dict = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
    const t = (key: TranslationKey, vars?: ReplaceVars) => {
      const template =
        resolve(dict, key) ??
        resolve(dictionaries[DEFAULT_LOCALE], key) ??
        key;
      return interpolate(template, vars);
    };
    return {
      locale,
      setLocale: (next: Locale) => {
        setLocale(next);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(STORAGE_KEY, next);
          document.documentElement.lang = next;
        }
      },
      t,
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export function useT(): (key: TranslationKey, vars?: ReplaceVars) => string {
  return useI18n().t;
}

export type { FlattenKeys };
