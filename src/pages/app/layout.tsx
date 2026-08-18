import { Navigate, Outlet } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { useAppData } from "@/context/app-data-context";

export function AppLayout() {
  const {
    loading,
    isSuperAdmin,
    categories,
    categoryCounts,
    tags,
    pinnedTags,
    totalVideos,
    favoriteCount,
    watchLaterCount,
    profile,
    email,
  } = useAppData();

  if (loading) return null;

  if (isSuperAdmin) return <Navigate to="/admin" replace />;

  return (
    <AppShell
      data={{
        categories,
        categoryCounts,
        tags,
        pinnedTags,
        totalVideos,
        favoriteCount,
        watchLaterCount,
        profile,
        email,
      }}
    >
      <Outlet />
    </AppShell>
  );
}