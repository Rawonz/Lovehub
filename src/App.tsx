import { AppProviders } from '@/providers';
import { AppRoutes } from '@/routes';
import './index.css';

export default function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  );
}
