import toast, { Toaster } from 'react-hot-toast';
import { useT } from './i18n';
import type { TranslationKey } from './i18n';

export function ToastRoot() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: '12px',
          background: 'hsl(var(--popover))',
          color: 'hsl(var(--popover-foreground))',
          border: '1px solid hsl(var(--border))',
          fontSize: '14px',
          fontWeight: 500,
          padding: '12px 16px',
          boxShadow:
            '0 10px 30px -10px rgba(0,0,0,0.25), 0 4px 12px -4px rgba(0,0,0,0.15)',
        },
        success: {
          iconTheme: {
            primary: 'hsl(142 71% 45%)',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: 'hsl(0 84% 60%)',
            secondary: '#fff',
          },
        },
      }}
    />
  );
}

export function useToastHelper() {
  const t = useT();
  return {
    success: (key: TranslationKey) => toast.success(t(key)),
    error: (key: TranslationKey) => toast.error(t(key)),
  };
}

export { toast };
