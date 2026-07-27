import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Heart, Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useT, type TranslationKey } from '@/lib/i18n';
import { resetPasswordSchema, type ResetPasswordValues } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ButtonLoader } from '@/components/ui/loader';
import { AuthShell } from './AuthShell';

/**
 * Reached via the link in the "reset your password" email. Supabase puts the
 * app into a temporary recovery session automatically (via the URL hash), so
 * this page just needs to call `updateUser` with the new password.
 */
export function ResetPasswordPage() {
  const t = useT();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    // If a recovery session is already present by the time this mounts.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (values: ResetPasswordValues) => {
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      toast.error(t('errors.generic'));
      return;
    }
    toast.success(t('auth.resetPassword.success'));
    navigate('/login', { replace: true });
  };

  return (
    <AuthShell>
      <Helmet>
        <title>{t('auth.resetPassword.title')} — LoveHub</title>
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
              {t('auth.resetPassword.title')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('auth.resetPassword.subtitle')}
            </p>
          </div>

          {!ready ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/40 p-6 text-center">
              <ShieldAlert className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('auth.resetPassword.invalidLink')}</p>
              <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                {t('auth.forgotPassword.title')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">{t('auth.resetPassword.newPassword')}</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder={t('auth.passwordPlaceholder')}
                    className="pl-9"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{t(errors.password.message as TranslationKey)}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">{t('auth.resetPassword.confirmPassword')}</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder={t('auth.passwordPlaceholder')}
                    className="pl-9"
                    {...register('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {t(errors.confirmPassword.message as TranslationKey)}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <ButtonLoader />
                ) : (
                  <>
                    {t('auth.resetPassword.submit')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </motion.div>
    </AuthShell>
  );
}
