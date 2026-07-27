import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import type { ReactNode } from 'react';

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: 'var(--gradient-hero)' }}
      />
      <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

      <Link
        to="/"
        className="absolute left-6 top-6 flex items-center gap-2 text-sm font-semibold text-foreground/80 transition-colors hover:text-foreground"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-xl gradient-bg text-white">
          <Heart className="h-4 w-4 fill-white" />
        </span>
        LoveHub
      </Link>

      {children}

      <p className="absolute bottom-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} RawonzEXE
      </p>
    </div>
  );
}
