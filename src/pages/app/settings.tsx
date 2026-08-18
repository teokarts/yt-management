import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { fetchAllTags } from "@/lib/library";
import { SettingsView } from "@/components/settings/settings-view";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tag, Profile } from "@/types/database";

export function SettingsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const [tags, profileRes] = await Promise.all([
        fetchAllTags(supabase, user.id),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);
      if (!active) return;
      setTags(tags);
      setProfile(profileRes.data ?? null);
      setEmail(user.email ?? "");
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading)
    return (
      <div className="mx-auto max-w-3xl px-6 py-6 md:px-8">
        <Skeleton className="h-7 w-40 rounded-md" />
        <Skeleton className="mt-4 h-28 w-full rounded-xl" />
        <Skeleton className="mt-4 h-24 w-full rounded-xl" />
        <Skeleton className="mt-4 h-32 w-full rounded-xl" />
      </div>
    );

  return <SettingsView profile={profile} email={email} tags={tags} />;
}