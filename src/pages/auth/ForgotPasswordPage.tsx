import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Heart, Mail, ArrowRight, ArrowLeft, MailCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useT, type TranslationKey } from '@/lib/i18n';
import { forgotPasswordSchema, type ForgotPasswordValues } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ButtonLoader } from '@/components/ui/loader';
import { AuthShell } from './AuthShell';

export function ForgotPasswordPage() {
  const t = useT();
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    // Always show the "check your email" state, even on error — this avoids
    // leaking whether an email address exists in the system.
    if (error) {
      // Non-existent-account errors from Supabase are the only realistic case
      // here since the request itself is nearly impossible to malform once
      // validated by the schema above.
      console.error(error);
    }
    setSent(true);
    toast.success(t('auth.forgotPassword.sentToast'));
  };

  return (
    <AuthShell>
      <Helmet>
        <title>{t('auth.forgotPassword.title')} — LoveHub</title>
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
              {t('auth.forgotPassword.title')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('auth.forgotPassword.subtitle')}
            </p>
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/40 p-6 text-center">
              <MailCheck className="h-8 w-8 text-primary" />
              <p className="text-sm text-foreground">{t('auth.forgotPassword.sentBody')}</p>
            </div>
          ) : (
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

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <ButtonLoader />
                ) : (
                  <>
                    {t('auth.forgotPassword.submit')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/login" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('auth.backToSignIn')}
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthShell>
  );
}
