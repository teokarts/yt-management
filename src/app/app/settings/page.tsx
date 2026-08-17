import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { fetchAllTags } from "@/lib/library";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await requireUser();
  const supabase = await createServerSupabase();

  const [tags, profileRes] = await Promise.all([
    fetchAllTags(supabase, user.id),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
  ]);

  return (
    <SettingsView profile={profileRes.data} email={user.email ?? ""} tags={tags} />
  );
}