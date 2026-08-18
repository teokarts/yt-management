import { lazy, Suspense, useEffect, type ReactNode } from "react";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { AppDataProvider } from "@/context/app-data-context";
import { ToastProvider } from "@/components/ui/toast";
import { FullScreenLoader } from "@/pages/app/full-screen-loader";

const LandingPage = lazy(() => import("@/pages/landing").then((m) => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import("@/pages/auth/login").then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import("@/pages/auth/signup").then((m) => ({ default: m.SignupPage })));
const ForgotPasswordPage = lazy(() =>
  import("@/pages/auth/forgot-password").then((m) => ({ default: m.ForgotPasswordPage })),
);
const ResetPasswordPage = lazy(() =>
  import("@/pages/auth/reset-password").then((m) => ({ default: m.ResetPasswordPage })),
);
const AuthLayout = lazy(() => import("@/pages/auth/layout").then((m) => ({ default: m.AuthLayout })));
const AppLayout = lazy(() => import("@/pages/app/layout").then((m) => ({ default: m.AppLayout })));
const LibraryPage = lazy(() => import("@/pages/app/library").then((m) => ({ default: m.LibraryPage })));
const SettingsPage = lazy(() =>
  import("@/pages/app/settings").then((m) => ({ default: m.SettingsPage })),
);
const VideoPage = lazy(() => import("@/pages/app/video").then((m) => ({ default: m.VideoPage })));
const CategoryPage = lazy(() =>
  import("@/pages/app/category").then((m) => ({ default: m.CategoryPage })),
);
const TagPage = lazy(() => import("@/pages/app/tag").then((m) => ({ default: m.TagPage })));
const AdminLayout = lazy(() =>
  import("@/pages/admin/layout").then((m) => ({ default: m.AdminLayout })),
);
const AdminDashboardPage = lazy(() =>
  import("@/pages/admin/dashboard").then((m) => ({ default: m.AdminDashboardPage })),
);
const AdminProfilePage = lazy(() =>
  import("@/pages/admin/profile").then((m) => ({ default: m.AdminProfilePage })),
);
const HelpPage = lazy(() => import("@/pages/help").then((m) => ({ default: m.HelpPage })));
const DeployPage = lazy(() => import("@/pages/deploy").then((m) => ({ default: m.DeployPage })));
const NotFoundPage = lazy(() =>
  import("@/pages/not-found").then((m) => ({ default: m.NotFoundPage })),
);

function RouteLoader({ children }: { children: ReactNode }) {
  return <Suspense fallback={<FullScreenLoader />}>{children}</Suspense>;
}

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (user) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <AuthProvider>
        <ToastProvider>
          <RouteLoader>
            <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              element={
                <RedirectIfAuthed>
                  <AuthLayout />
                </RedirectIfAuthed>
              }
            >
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>
            <Route
              element={
                <RequireAuth>
                  <AppDataProvider>
                    <AppLayout />
                  </AppDataProvider>
                </RequireAuth>
              }
            >
              <Route path="/app" element={<LibraryPage />} />
              <Route path="/app/library" element={<Navigate to="/app" replace />} />
              <Route path="/app/settings" element={<SettingsPage />} />
              <Route path="/app/video/:id" element={<VideoPage />} />
              <Route path="/app/category/:slug" element={<CategoryPage />} />
              <Route path="/app/tag/:slug" element={<TagPage />} />
            </Route>
            <Route
              element={
                <RequireAuth>
                  <AppDataProvider>
                    <AdminLayout />
                  </AppDataProvider>
                </RequireAuth>
              }
            >
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/profile" element={<AdminProfilePage />} />
            </Route>
            <Route path="/help" element={<HelpPage />} />
            <Route path="/deploy" element={<DeployPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </RouteLoader>
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  );
}