import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Code2, Sparkles, ArrowLeft } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LandingFooter } from '@/pages/landing/LandingFooter';
import { LandingNav } from '@/pages/landing/LandingNav';

export function AboutPage() {
  const t = useT();
  const year = new Date().getFullYear();

  return (
    <div className="relative min-h-screen bg-background">
      <Helmet>
        <title>{t('about.title')} — LoveHub</title>
        <meta name="description" content={t('about.subtitle')} />
        <meta name="author" content="RawonzEXE" />
      </Helmet>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px]"
        style={{ background: 'var(--gradient-hero)' }}
      />
      <LandingNav />

      <main className="mx-auto max-w-4xl px-6 pt-16 pb-24">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('notFound.home')}
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg text-white shadow-md">
            <Heart className="h-7 w-7 fill-white" />
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            {t('about.title')}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">{t('about.subtitle')}</p>
        </motion.div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {t('about.missionTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{t('about.mission')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-primary" />
                {t('about.techTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{t('about.techDesc')}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-sm uppercase tracking-wider text-muted-foreground">
              {t('about.authorTitle')}
            </p>
            <p className="text-2xl font-semibold gradient-text">{t('about.author')}</p>
            <p className="text-sm text-muted-foreground">{t('about.copyright', { year })}</p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t('about.license')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">{t('about.licenseText')}</p>
          </CardContent>
        </Card>

        <div className="mt-12 text-center">
          <Button asChild size="lg">
            <Link to="/register">{t('landing.heroCtaPrimary')}</Link>
          </Button>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
