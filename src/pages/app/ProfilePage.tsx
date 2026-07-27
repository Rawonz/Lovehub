import { Helmet } from 'react-helmet-async';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Heart, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { profileSchema, type ProfileValues } from '@/lib/schemas';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { ButtonLoader } from '@/components/ui/loader';
import { ImageUploader } from '@/components/ui/image-uploader';

export function ProfilePage() {
  const t = useT();
  const { profile, session, refreshProfile } = useAuth();
  const [avatarPath, setAvatarPath] = useState<string | null>(profile?.avatar_url ?? null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: profile?.display_name ?? '',
      bio: profile?.bio ?? '',
    },
  });

  const onSubmit = async (values: ProfileValues) => {
    if (!session?.user) return;
    setSaving(true);
    try {
      const updates: Record<string, string | null> = {
        display_name: values.display_name || null,
        bio: values.bio || null,
        avatar_url: avatarPath,
      };
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success(t('settings.saved'));
    } catch (err) {
      toast.error(t('errors.generic'));
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <Helmet>
        <title>{t('nav.profile')} — LoveHub</title>
      </Helmet>

      <PageHeader title={t('settings.profile.title')} icon={Heart} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>{t('settings.profile.avatar')}</CardTitle>
            <CardDescription>{t('settings.profile.avatarHint')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <ProfileAvatar path={profile?.avatar_url} name={profile?.display_name} className="h-28 w-28 text-2xl" />
            <ImageUploader
              bucket="avatars"
              userId={session?.user.id ?? ''}
              aspect="square"
              label={t('settings.profile.changeAvatar')}
              onUploaded={(path) => setAvatarPath(path)}
              onClear={() => setAvatarPath(null)}
              currentPreview={undefined}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('settings.profile.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="display_name">{t('settings.profile.displayName')}</Label>
                <Input id="display_name" {...register('display_name')} />
                {errors.display_name && (
                  <p className="text-xs text-destructive">{t('auth.nameRequired')}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio">{t('settings.profile.bio')}</Label>
                <Textarea
                  id="bio"
                  rows={4}
                  placeholder={t('settings.profile.bioPlaceholder')}
                  {...register('bio')}
                />
                {errors.bio && (
                  <p className="text-xs text-destructive">{t('errors.generic')}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>{t('settings.account.email')}</Label>
                <Input value={profile?.email ?? ''} readOnly disabled />
              </div>

              <Button type="submit" disabled={saving || !isDirty}>
                {saving ? <ButtonLoader className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                {t('common.saveChanges')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
