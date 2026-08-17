import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { loadSidebarData } from "@/lib/sidebar";
import { fetchAllCategories, fetchAllTags } from "@/lib/library";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [sidebarData, categories, tags, profileRes] = await Promise.all([
    loadSidebarData(supabase, user.id),
    fetchAllCategories(supabase, user.id),
    fetchAllTags(supabase, user.id),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
  ]);

  if (profileRes.data?.is_super_admin) {
    redirect("/admin");
  }

  return (
    <AppShell
      data={{
        categories,
        categoryCounts: sidebarData.categories,
        tags,
        pinnedTags: sidebarData.pinnedTags,
        totalVideos: sidebarData.totalVideos,
        favoriteCount: sidebarData.favoriteCount,
        watchLaterCount: sidebarData.watchLaterCount,
        profile: profileRes.data ?? null,
        email: user.email ?? "",
      }}
    >
      {children}
    </AppShell>
  );
}