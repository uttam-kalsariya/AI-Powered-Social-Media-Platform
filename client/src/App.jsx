import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import { LoadingScreen } from './components/LoadingScreen';
import { Navbar } from './components/Navbar';

// Public Auth Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';

// Protected Feature Pages
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { ReelsPage } from './pages/ReelsPage';
import { MessagesPage } from './pages/MessagesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminDashboard } from './components/AdminDashboard';
import { AiAssistantView } from './components/AiAssistantView';

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)]">
      <Navbar />
      <div className="md:pl-16 lg:pl-60 transition-all flex flex-col min-h-screen">
        <main className="max-w-[1240px] w-full mx-auto p-4 md:p-6 lg:p-8 flex-1 pb-20 md:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) {
    return <LoadingScreen message="Initializing session..." />;
  }
  return user ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />;
};

const AdminRoute = () => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) {
    return <LoadingScreen message="Checking permissions..." />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }
  return <AdminDashboard />;
};

export function AppRoutes() {
  return (
    <Routes>
      {/* Root Entry: Intelligently routes based on active session */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Authentication Routes (Redirect to /home if already logged in) */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Route>

      {/* Protected Application Routes (Require validated session) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/reels" element={<ReelsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/assistant" element={<AiAssistantView />} />
          <Route path="/admin" element={<AdminRoute />} />
        </Route>
      </Route>

      {/* Fallback Catch-all: Route back to root handler */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
