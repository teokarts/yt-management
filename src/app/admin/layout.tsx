import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!data?.is_super_admin) redirect("/app");

  return <>{children}</>;
}