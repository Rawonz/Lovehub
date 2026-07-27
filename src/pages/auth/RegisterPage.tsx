import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Heart, Mail, Lock, User, ArrowRight, MailCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useT, type TranslationKey } from '@/lib/i18n';
import { signUpSchema, type SignUpValues } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ButtonLoader } from '@/components/ui/loader';
import { AuthShell } from './AuthShell';

const INVITE_STORAGE_KEY = 'lovehub.pendingInvite';

function mapAuthError(message: string): TranslationKey {
  if (message.includes('already registered') || message.includes('already been registered')) {
    return 'auth.emailInUse';
  }
  if (message.includes('password') && message.includes('6')) {
    return 'auth.weakPassword';
  }
  return 'errors.generic';
}

export function RegisterPage() {
  const t = useT();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [searchParams] = useSearchParams();

  const inviteCode = searchParams.get('invite');
  if (inviteCode) {
    sessionStorage.setItem(INVITE_STORAGE_KEY, inviteCode);
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { display_name: '', email: '', password: '' },
  });

  if (session) {
    navigate('/app', { replace: true });
  }

  const onSubmit = async (values: SignUpValues) => {
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { display_name: values.display_name },
      },
    });
    if (error) {
      toast.error(t(mapAuthError(error.message)));
      return;
    }

    // If Supabase requires email confirmation, `session` comes back null even
    // though the account was created — send the person to /login with a clear
    // "check your inbox" alert instead of trying (and failing) to enter /app.
    if (!data.session) {
      toast.custom(
        (toastInstance) => (
          <div
            className={`flex max-w-md items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 shadow-lg ${
              toastInstance.visible ? 'animate-enter' : 'animate-leave'
            }`}
          >
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="text-sm">
              <p className="font-semibold text-foreground">{t('auth.verifyEmailTitle')}</p>
              <p className="mt-1 text-muted-foreground">{t('auth.verifyEmailBody')}</p>
            </div>
          </div>
        ),
        { duration: 8000 }
      );
      const pendingInvite = sessionStorage.getItem(INVITE_STORAGE_KEY);
      navigate(pendingInvite ? `/login?invite=${pendingInvite}` : '/login', { replace: true });
      return;
    }

    toast.success(t('auth.signedUp'));
    const pendingInvite = sessionStorage.getItem(INVITE_STORAGE_KEY);
    if (pendingInvite) {
      navigate(`/app/partner?join=${pendingInvite}`, { replace: true });
    } else {
      navigate('/app', { replace: true });
    }
  };

  return (
    <AuthShell>
      <Helmet>
        <title>{t('auth.signUpTitle')} — LoveHub</title>
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
              {t('auth.signUpTitle')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('auth.signUpSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="display_name">{t('auth.displayName')}</Label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="display_name"
                  autoComplete="name"
                  placeholder={t('auth.displayNamePlaceholder')}
                  className="pl-9"
                  {...register('display_name')}
                />
              </div>
              {errors.display_name && (
                <p className="text-xs text-destructive">{t(errors.display_name.message as TranslationKey)}</p>
              )}
            </div>

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
              <Label htmlFor="password">{t('auth.password')}</Label>
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

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <ButtonLoader />
              ) : (
                <>
                  {t('auth.signUpButton')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              {t('auth.signInButton')}
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthShell>
  );
}
