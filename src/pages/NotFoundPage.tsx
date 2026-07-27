import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, ArrowLeft } from 'lucide-react';
import { useT } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  const t = useT();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
      <Helmet>
        <title>404 — LoveHub</title>
      </Helmet>
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: 'var(--gradient-hero)' }}
      />
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-bg text-white shadow-md">
          <Compass className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-6xl font-semibold tracking-tight text-foreground">404</h1>
        <p className="mt-3 max-w-md text-lg text-muted-foreground">{t('notFound.subtitle')}</p>
        <Button asChild className="mt-8">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('notFound.home')}
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
