import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { FullPageLoader } from '@/components/ui/loader';

export function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;
  if (!session) {
    // Preserve intended destination for post-login redirect
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;
  if (session) {
    // Redirect back to where they were trying to go, or app home
    const from = (location.state as { from?: string } | null)?.from ?? '/app';
    return <Navigate to={from} replace />;
  }
  return <Outlet />;
}

export function CoupleRequiredRoute() {
  const { couple, loading } = useAuth();

  if (loading) return <FullPageLoader />;
  if (!couple) return <Navigate to="/app/partner" replace />;
  return <Outlet />;
}
