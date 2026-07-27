import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { FullPageLoader } from '@/components/ui/loader';
import { ProtectedRoute, PublicOnlyRoute, CoupleRequiredRoute } from '@/components/routing/RouteGuards';

const LandingPage = lazy(() => import('@/pages/landing/LandingPage').then((m) => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const AboutPage = lazy(() => import('@/pages/about/AboutPage').then((m) => ({ default: m.AboutPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

const DashboardPage = lazy(() => import('@/pages/app/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const PartnerPage = lazy(() => import('@/pages/app/PartnerPage').then((m) => ({ default: m.PartnerPage })));
const ProfilePage = lazy(() => import('@/pages/app/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('@/pages/app/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const NotificationsPage = lazy(() => import('@/pages/app/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));

const TimelinePage = lazy(() => import('@/pages/app/features/TimelinePage').then((m) => ({ default: m.TimelinePage })));
const MemoriesPage = lazy(() => import('@/pages/app/features/MemoriesPage').then((m) => ({ default: m.MemoriesPage })));
const LoveMapPage = lazy(() => import('@/pages/app/features/LoveMapPage').then((m) => ({ default: m.LoveMapPage })));
const DatePlannerPage = lazy(() => import('@/pages/app/features/DatePlannerPage').then((m) => ({ default: m.DatePlannerPage })));
const GiftsPage = lazy(() => import('@/pages/app/features/GiftsPage').then((m) => ({ default: m.GiftsPage })));
const LoveQuizPage = lazy(() => import('@/pages/app/features/LoveQuizPage').then((m) => ({ default: m.LoveQuizPage })));
const AnniversaryPage = lazy(() => import('@/pages/app/features/AnniversaryPage').then((m) => ({ default: m.AnniversaryPage })));
const ChatPage = lazy(() => import('@/pages/app/features/ChatPage').then((m) => ({ default: m.ChatPage })));
const AssistantPage = lazy(() => import('@/pages/app/features/AssistantPage').then((m) => ({ default: m.AssistantPage })));
const DailyTasksPage = lazy(() => import('@/pages/app/features/DailyTasksPage').then((m) => ({ default: m.DailyTasksPage })));

const AppLayout = lazy(() => import('@/pages/app/AppLayout').then((m) => ({ default: m.AppLayout })));

export function AppRoutes() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* Public-only (auth) */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Reachable whether signed in or not: recovery links land here */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected app */}
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="partner" element={<PartnerPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />

            {/* Couple-required features */}
            <Route element={<CoupleRequiredRoute />}>
              <Route path="timeline" element={<TimelinePage />} />
              <Route path="memories" element={<MemoriesPage />} />
              <Route path="love-map" element={<LoveMapPage />} />
              <Route path="dates" element={<DatePlannerPage />} />
              <Route path="gifts" element={<GiftsPage />} />
              <Route path="quiz" element={<LoveQuizPage />} />
              <Route path="anniversary" element={<AnniversaryPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="daily-tasks" element={<DailyTasksPage />} />
            </Route>

            {/* AI assistant is personal, not couple-required */}
            <Route path="assistant" element={<AssistantPage />} />
          </Route>
        </Route>

        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  );
}
