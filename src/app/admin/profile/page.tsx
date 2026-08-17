import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/admin";
import { AdminProfile } from "@/components/admin/admin-profile";

export const metadata: Metadata = { title: "Admin · Profile" };

export default async function AdminProfilePage() {
  const user = await requireSuperAdmin();
  const supabase = await createServerSupabase();

  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  return <AdminProfile displayName={data?.display_name ?? null} email={user.email ?? ""} />;
}