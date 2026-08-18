import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AdminProfile } from "@/components/admin/admin-profile";

export function AdminProfilePage() {
  const [admin, setAdmin] = useState<{ displayName: string | null; email: string }>({
    displayName: null,
    email: "",
  });

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      setAdmin({ displayName: data?.display_name ?? null, email: user.email ?? "" });
    })();
    return () => {
      active = false;
    };
  }, []);

  return <AdminProfile displayName={admin.displayName} email={admin.email} />;
}