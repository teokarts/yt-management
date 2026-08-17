import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireSuperAdmin, loadAdminStats } from "@/lib/admin";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

export const metadata: Metadata = { title: "Admin · Platform overview" };

export default async function AdminPage() {
  const user = await requireSuperAdmin();

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const stats = await loadAdminStats();

  return (
    <AdminDashboard
      stats={stats}
      admin={{ displayName: data?.display_name ?? null, email: user.email ?? "" }}
    />
  );
}