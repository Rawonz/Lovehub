import { Analytics } from '@vercel/analytics/react';
import { AppProviders } from '@/providers';
import { AppRoutes } from '@/routes';
import './index.css';

export default function App() {
  return (
    <AppProviders>
      <AppRoutes />
      <Analytics />
    </AppProviders>
  );
}
