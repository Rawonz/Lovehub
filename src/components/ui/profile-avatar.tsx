import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSignedUrl } from '@/lib/use-signed-url';
import { cn } from '@/lib/utils';

interface ProfileAvatarProps {
  path: string | null | undefined;
  name: string | null | undefined;
  className?: string;
}

export function ProfileAvatar({ path, name, className }: ProfileAvatarProps) {
  const url = useSignedUrl(path, 'avatars');
  const fallback = (name ?? 'LH').slice(0, 2).toUpperCase();

  return (
    <Avatar className={cn('h-9 w-9', className)}>
      {url && <AvatarImage src={url} alt={name ?? ''} />}
      <AvatarFallback className="gradient-bg text-xs font-semibold text-white">
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
}
