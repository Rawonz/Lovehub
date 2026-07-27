import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import { I18nProvider } from '@/lib/i18n';
import { ThemeProvider } from '@/lib/theme';
import { ToastRoot } from '@/lib/toast';
import { PreferenceSync } from '@/components/routing/PreferenceSync';
import type { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <I18nProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <AuthProvider>
                <PreferenceSync />
                {children}
                <ToastRoot />
              </AuthProvider>
            </BrowserRouter>
          </QueryClientProvider>
        </I18nProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
