import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Heart, Mail, Lock, ArrowRight, MailWarning } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useT, type TranslationKey } from '@/lib/i18n';
import { signInSchema, type SignInValues } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ButtonLoader } from '@/components/ui/loader';
import { AuthShell } from './AuthShell';

type AuthErrorKind = 'invalidCredentials' | 'emailNotConfirmed' | 'generic';

function classifyAuthError(message: string): AuthErrorKind {
  if (message.includes('Email not confirmed')) return 'emailNotConfirmed';
  if (message.includes('Invalid login credentials')) return 'invalidCredentials';
  return 'generic';
}

export function LoginPage() {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const from = (location.state as { from?: string } | null)?.from ?? '/app';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  if (session) {
    navigate('/app', { replace: true });
  }

  const onSubmit = async (values: SignInValues) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    if (error) {
      const kind = classifyAuthError(error.message);
      if (kind === 'emailNotConfirmed') {
        // Persistent, icon-led alert: this is not a plain "wrong password" error,
        // so it needs to stand out and explain exactly what to do next.
        toast.custom(
          (toastInstance) => (
            <div
              className={`flex max-w-md items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-4 shadow-lg dark:border-amber-500/30 dark:bg-amber-950/60 ${
                toastInstance.visible ? 'animate-enter' : 'animate-leave'
              }`}
            >
              <MailWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="text-sm">
                <p className="font-semibold text-amber-800 dark:text-amber-300">
                  {t('auth.emailNotConfirmedTitle')}
                </p>
                <p className="mt-1 text-amber-700 dark:text-amber-400">
                  {t('auth.emailNotConfirmedBody')}
                </p>
              </div>
            </div>
          ),
          { duration: 8000 }
        );
        return;
      }
      const key: TranslationKey =
        kind === 'invalidCredentials' ? 'auth.invalidCredentials' : 'errors.generic';
      toast.error(t(key));
      return;
    }
    toast.success(t('auth.signedIn'));
    navigate(from, { replace: true });
  };

  return (
    <AuthShell>
      <Helmet>
        <title>{t('auth.signInTitle')} — LoveHub</title>
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="card-premium p-8">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-bg text-white shadow-md">
              <Heart className="h-6 w-6 fill-white" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">
              {t('auth.signInTitle')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('auth.signInSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('auth.emailPlaceholder')}
                  className="pl-9"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{t(errors.email.message as TranslationKey)}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {t('auth.forgotPassword.link')}
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder={t('auth.passwordPlaceholder')}
                  className="pl-9"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{t(errors.password.message as TranslationKey)}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <ButtonLoader />
              ) : (
                <>
                  {t('auth.signInButton')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.noAccount')}{' '}
            <Link
              to="/register"
              className="font-medium text-primary hover:underline"
            >
              {t('auth.signUpButton')}
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthShell>
  );
}
