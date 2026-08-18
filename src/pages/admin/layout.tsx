import { Navigate, Outlet } from "react-router-dom";
import { FullScreenLoader } from "@/pages/app/full-screen-loader";
import { useAppData } from "@/context/app-data-context";

export function AdminLayout() {
  const { isSuperAdmin, loading } = useAppData();

  if (loading) return <FullScreenLoader />;
  if (!isSuperAdmin) return <Navigate to="/app" replace />;

  return <Outlet />;
}