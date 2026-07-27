import { Helmet } from 'react-helmet-async';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  CalendarHeart,
  Image as ImageIcon,
  MapPin,
  Gift,
  Clock,
  Sparkles,
  ArrowRight,
  MessageCircleHeart,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { LandingFooter } from './LandingFooter';
import { LandingNav } from './LandingNav';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

export function LandingPage() {
  const t = useT();
  const { session, loading } = useAuth();

  // Logged-in visitors should never see the marketing homepage (or, by
  // extension, the login/register links inside its nav) again — send them
  // straight into the app.
  if (!loading && session) {
    return <Navigate to="/app" replace />;
  }

  const features = [
    { icon: CalendarHeart, title: t('landing.featureTimelineTitle'), desc: t('landing.featureTimelineDesc') },
    { icon: ImageIcon, title: t('landing.featureMemoriesTitle'), desc: t('landing.featureMemoriesDesc') },
    { icon: Heart, title: t('landing.featureDatesTitle'), desc: t('landing.featureDatesDesc') },
    { icon: Clock, title: t('landing.featureAnniversaryTitle'), desc: t('landing.featureAnniversaryDesc') },
    { icon: Sparkles, title: t('landing.featureQuizTitle'), desc: t('landing.featureQuizDesc') },
    { icon: MessageCircleHeart, title: t('landing.featureAiTitle'), desc: t('landing.featureAiDesc') },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <Helmet>
        <title>{t('meta.title')}</title>
        <meta name="description" content={t('meta.description')} />
        <meta name="author" content="RawonzEXE" />
      </Helmet>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px]"
        style={{ background: 'var(--gradient-hero)' }}
      />
      <div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

      <LandingNav />

      <main>
        {/* Hero — asymmetric editorial layout, not centered-SaaS-template */}
        <section className="mx-auto max-w-6xl px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid items-end gap-10 lg:grid-cols-[1.3fr_0.7fr]"
          >
            <div>
              <motion.div variants={item} className="ledger-mark">
                <span className="ledger-eyebrow">{t('brand.tagline')}</span>
                <span className="ledger-rule" />
              </motion.div>

              <motion.h1
                variants={item}
                className="mt-6 max-w-2xl font-serif text-5xl font-normal leading-[1.05] tracking-tight text-foreground sm:text-7xl"
              >
                {t('landing.heroTitle')}
              </motion.h1>

              <motion.p
                variants={item}
                className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg"
              >
                {t('landing.heroSubtitle')}
              </motion.p>

              <motion.div variants={item} className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link to={session ? '/app' : '/register'}>
                    {t('landing.heroCtaPrimary')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link to={session ? '/app' : '/login'}>
                    {t('landing.heroCtaSecondary')}
                  </Link>
                </Button>
              </motion.div>
            </div>

            {/* Quiet supporting mark instead of a second CTA block */}
            <motion.div
              variants={item}
              className="hidden justify-self-end border-l border-brass/40 pl-8 lg:block"
            >
              <Heart className="h-5 w-5 fill-primary text-primary" />
              <p className="mt-4 max-w-[16rem] font-serif text-lg italic leading-snug text-foreground/80">
                {t('brand.description')}
              </p>
            </motion.div>
          </motion.div>

          {/* Floating preview */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-20 max-w-5xl"
          >
            <div className="card-premium overflow-hidden p-2">
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[calc(var(--radius)-2px)] bg-border sm:grid-cols-4">
                {[
                  { icon: CalendarHeart, label: t('nav.timeline') },
                  { icon: ImageIcon, label: t('nav.memories') },
                  { icon: MapPin, label: t('nav.loveMap') },
                  { icon: Gift, label: t('nav.giftRecommender') },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="flex flex-col items-center justify-center gap-3 bg-card p-8 text-center transition-colors hover:bg-accent/40"
                  >
                    <card.icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
                    <span className="text-sm font-medium text-foreground">{card.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-6 py-20" id="features">
          <div className="ledger-mark mb-4">
            <span className="ledger-eyebrow">Inside LoveHub</span>
            <span className="ledger-rule" />
          </div>
          <div className="max-w-2xl">
            <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
              {t('brand.tagline')}
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">{t('brand.description')}</p>
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="mt-14 grid gap-px overflow-hidden rounded-[var(--radius)] border border-border bg-border sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={item}
                className="group bg-card p-8 transition-colors hover:bg-accent/30"
              >
                <feature.icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
                <h3 className="mt-5 font-serif text-lg font-normal text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl gradient-bg px-8 py-16 text-center text-white sm:px-16"
          >
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <h2 className="font-serif text-3xl font-normal tracking-tight sm:text-4xl">
              {t('landing.ctaTitle')}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/90">{t('landing.ctaSubtitle')}</p>
            <div className="mt-8 flex justify-center">
              <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                <Link to={session ? '/app' : '/register'}>
                  {t('landing.heroCtaPrimary')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
