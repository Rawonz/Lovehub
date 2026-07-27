import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useT } from '@/lib/i18n';

export function LandingFooter() {
  const t = useT();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl gradient-bg text-white">
              <Heart className="h-4 w-4 fill-white" />
            </span>
            LoveHub
          </div>

          <nav className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link to="/about" className="transition-colors hover:text-foreground">
              {t('footer.links.about')}
            </Link>
            <Link to="/about" className="transition-colors hover:text-foreground">
              {t('footer.links.privacy')}
            </Link>
            <Link to="/about" className="transition-colors hover:text-foreground">
              {t('footer.links.terms')}
            </Link>
          </nav>
        </div>

        <div className="mt-8 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          <p>
            © {year} RawonzEXE. {t('footer.rights')}
          </p>
          <p className="mt-1">
            {t('footer.madeWith')} {t('footer.by')}{' '}
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              {t('footer.author')}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
