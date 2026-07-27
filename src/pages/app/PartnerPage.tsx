import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  Users,
  Heart,
  Copy,
  Check,
  Link as LinkIcon,
  UserMinus,
  Mail,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useT, type TranslationKey } from '@/lib/i18n';
import { invitationCodeSchema } from '@/lib/schemas';
import { z } from 'zod';

const joinFormSchema = z.object({ code: invitationCodeSchema });
import { pushNotification } from '@/lib/notify';
import type { CoupleInvitation, Profile } from '@/types/database';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ButtonLoader } from '@/components/ui/loader';
import { usePartnerInvitation } from '@/features/partner/usePartnerInvitation';

export function PartnerPage() {
  const t = useT();
  const { profile, couple, partner, refreshCouple } = useAuth();
  const { invitation, loading, generate, cancel } = usePartnerInvitation();
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const [unlinking, setUnlinking] = useState(false);

  return (
    <div className="space-y-8">
      <Helmet>
        <title>{t('partner.title')} — LoveHub</title>
      </Helmet>

      <PageHeader
        title={t('partner.title')}
        subtitle={
          couple && partner
            ? t('partner.status.linked', { name: partner.display_name ?? partner.email })
            : t('partner.status.notLinked')
        }
        icon={Users}
      />

      {couple && partner ? (
        <LinkedView partner={partner} onUnlink={() => setConfirmUnlink(true)} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <InviteCard
            invitation={invitation}
            loading={loading}
            onGenerate={generate}
            onCancel={cancel}
          />
          <JoinCard onJoined={refreshCouple} />
        </div>
      )}

      <ConfirmDialog
        open={confirmUnlink}
        onOpenChange={setConfirmUnlink}
        title={t('partner.unlink.title')}
        description={t('partner.unlink.description')}
        confirmLabel={t('partner.unlink.confirm')}
        onConfirm={async () => {
          if (!couple) return;
          setUnlinking(true);
          try {
            const { error } = await supabase
              .from('couples')
              .update({ status: 'ended' })
              .eq('id', couple.id);
            if (error) throw error;
            if (partner) {
              await pushNotification({
                userId: partner.id,
                type: 'couple_unlinked',
                title: t('partner.unlink.success'),
                body: profile?.display_name ?? undefined,
              });
            }
            await refreshCouple();
            toast.success(t('partner.unlink.success'));
            setConfirmUnlink(false);
          } catch (err) {
            toast.error(t('errors.generic'));
            console.error(err);
          } finally {
            setUnlinking(false);
          }
        }}
      />
      {unlinking && <div className="sr-only">{t('common.loading')}</div>}
    </div>
  );
}

function LinkedView({
  partner,
  onUnlink,
}: {
  partner: Profile;
  onUnlink: () => void;
}) {
  const t = useT();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card>
        <CardContent className="flex flex-col items-center gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <ProfileAvatar path={partner.avatar_url} name={partner.display_name ?? partner.email} className="h-20 w-20 text-lg" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {partner.display_name ?? partner.email}
              </h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {partner.email}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('partner.info.memberSince')}: {new Date(partner.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Button variant="outline" className="text-destructive hover:bg-destructive/10" onClick={onUnlink}>
            <UserMinus className="mr-2 h-4 w-4" />
            {t('partner.unlink.title')}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function InviteCard({
  invitation,
  loading,
  onGenerate,
  onCancel,
}: {
  invitation: CoupleInvitation | null;
  loading: boolean;
  onGenerate: () => Promise<void>;
  onCancel: () => Promise<void>;
}) {
  const t = useT();
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const inviteUrl = invitation
    ? `${window.location.origin}/register?invite=${invitation.code}`
    : '';

  const copy = async (which: 'code' | 'link', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      toast.success(t('common.copied'));
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error(t('errors.generic'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-primary" />
          {t('partner.invite.title')}
        </CardTitle>
        <CardDescription>{t('partner.invite.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading ? (
          <div className="flex justify-center py-8">
            <ButtonLoader className="h-6 w-6" />
          </div>
        ) : invitation ? (
          <>
            <div>
              <Label className="mb-1.5 block">{t('partner.invite.codeLabel')}</Label>
              <div className="flex gap-2">
                <Input readOnly value={invitation.code} className="font-mono text-lg tracking-widest" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copy('code', invitation.code)}
                  aria-label={t('partner.invite.copyCode')}
                >
                  {copied === 'code' ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label className="mb-1.5 block">{t('partner.invite.linkLabel')}</Label>
              <div className="flex gap-2">
                <Input readOnly value={inviteUrl} />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copy('link', inviteUrl)}
                  aria-label={t('partner.invite.copyLink')}
                >
                  {copied === 'link' ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {t('partner.invite.expires', {
                  time: new Date(invitation.expires_at).toLocaleDateString(),
                })}
              </p>
              <Button variant="ghost" size="sm" onClick={onCancel}>
                {t('partner.invite.cancel')}
              </Button>
            </div>
            <Button variant="outline" className="w-full" onClick={onGenerate}>
              {t('partner.invite.regenerate')}
            </Button>
          </>
        ) : (
          <Button className="w-full" onClick={onGenerate}>
            <Heart className="mr-2 h-4 w-4" />
            {t('partner.invite.generate')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function JoinCard({ onJoined }: { onJoined: () => Promise<void> }) {
  const t = useT();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<{ code: string }>({
    resolver: zodResolver(joinFormSchema),
    defaultValues: { code: '' },
  });

  const joinCode = searchParams.get('join');
  useEffect(() => {
    if (joinCode) {
      setValue('code', joinCode.toUpperCase());
    }
  }, [joinCode, setValue]);

  const onSubmit = async (values: { code: string }) => {
    setSubmitting(true);
    try {
      const code = values.code.trim().toUpperCase();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No session');

      // Look up the invitation by code.
      const { data: invitation, error: lookupError } = await supabase
        .from('couple_invitations')
        .select('*')
        .eq('code', code)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      if (lookupError) throw lookupError;
      if (!invitation) {
        toast.error(t('partner.join.invalid'));
        return;
      }
      if (invitation.inviter_id === user.id) {
        toast.error(t('partner.join.invalid'));
        return;
      }

      // Create the couple.
      const { data: couple, error: coupleError } = await supabase
        .from('couples')
        .insert({
          user_id_1: invitation.inviter_id,
          user_id_2: user.id,
        })
        .select()
        .single();
      if (coupleError) throw coupleError;

      // Mark invitation accepted and link couple.
      const { error: updateError } = await supabase
        .from('couple_invitations')
        .update({ status: 'accepted', invitee_id: user.id, couple_id: couple.id })
        .eq('id', invitation.id);
      if (updateError) throw updateError;

      // Notify inviter.
      await pushNotification({
        userId: invitation.inviter_id,
        type: 'partner_joined',
        title: t('partner.join.success'),
      });

      await onJoined();
      toast.success(t('partner.join.success'));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : JSON.stringify(err);

      toast.error(message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-primary" />
          {t('partner.join.title')}
        </CardTitle>
        <CardDescription>{t('partner.join.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="code">{t('partner.join.codeLabel')}</Label>
            <Input
              id="code"
              placeholder={t('partner.join.codePlaceholder')}
              className="font-mono text-lg tracking-widest uppercase"
              {...register('code')}
            />
            {errors.code && (
              <p className="text-xs text-destructive">{t(errors.code.message as TranslationKey)}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <ButtonLoader className="mr-2" /> : <LinkIcon className="mr-2 h-4 w-4" />}
            {submitting ? t('partner.join.joining') : t('partner.join.join')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
