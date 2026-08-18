import { useCallback, useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { loadAdminStats, type AdminStats } from "@/lib/admin";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [admin, setAdmin] = useState<{ displayName: string | null; email: string }>({
    displayName: null,
    email: "",
  });
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setFailed(false);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    setAdmin({ displayName: data?.display_name ?? null, email: user.email ?? "" });
    try {
      const stats = await loadAdminStats();
      setStats(stats);
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (failed)
    return (
      <div className="px-6 py-6 md:px-8">
        <EmptyState
          icon={<Shield className="h-6 w-6" />}
          title="Could not load platform stats"
          description="The admin edge function may not be deployed, or you don't have permission."
        />
      </div>
    );

  if (!stats)
    return (
      <div className="px-6 py-6 md:px-8">
        <Skeleton className="h-7 w-56 rounded-md" />
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-64 rounded-xl" />
      </div>
    );

  return <AdminDashboard stats={stats} admin={admin} onRefresh={load} />;
}