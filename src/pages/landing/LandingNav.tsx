import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n';
import { LOCALES, LOCALE_LABELS } from '@/lib/i18n/config';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

export function LandingNav() {
  const t = useT();
  const { session } = useAuth();
  const { locale, setLocale } = useI18n();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl gradient-bg text-white">
            <Heart className="h-4 w-4 fill-white" />
          </span>
          LoveHub
        </Link>

        <nav className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{LOCALE_LABELS[locale]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {LOCALES.map((l) => (
                <DropdownMenuItem
                  key={l}
                  onClick={() => setLocale(l)}
                  className={l === locale ? 'font-semibold' : ''}
                >
                  {LOCALE_LABELS[l]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button asChild variant="ghost" size="sm">
            <Link to="/about">{t('nav.about')}</Link>
          </Button>

          {session ? (
            <Button asChild size="sm">
              <Link to="/app">{t('nav.dashboard')}</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">{t('nav.login')}</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register">{t('nav.register')}</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
