import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FullPageLoader({ label }: { label?: string }) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background"
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Loading LoveHub'}
    >
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" aria-hidden="true" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg text-white shadow-lg" aria-hidden="true">
          <Heart className="h-7 w-7 fill-white" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground" aria-hidden="true">
        {label ?? 'LoveHub'}
      </p>
    </div>
  );
}

export function InlineLoader({ className, label }: { className?: string; label?: string }) {
  return (
    <div
      className={cn('flex items-center justify-center gap-3 py-10', className)}
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Loading'}
    >
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
        aria-hidden="true"
      />
      {label && <span className="text-sm text-muted-foreground" aria-hidden="true">{label}</span>}
    </div>
  );
}

export function ButtonLoader({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'h-4 w-4 animate-spin rounded-full border-2 border-current/40 border-t-current',
        className
      )}
      aria-hidden="true"
    />
  );
}
