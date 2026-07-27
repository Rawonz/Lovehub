import { useEffect, useState } from 'react';
import { loadDateLocale } from '@/lib/dates';
import { useI18n } from '@/lib/i18n';
import type { Locale } from 'date-fns/locale';

export function useDateLocale(): Locale | undefined {
  const { locale } = useI18n();
  const [loaded, setLoaded] = useState<Locale | undefined>(undefined);

  useEffect(() => {
    let active = true;
    loadDateLocale(locale).then((mod) => {
      if (active) setLoaded(mod);
    });
    return () => {
      active = false;
    };
  }, [locale]);

  return loaded;
}
