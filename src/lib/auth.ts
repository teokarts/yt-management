import { createServerSupabase } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export async function getSessionUser(): Promise<User | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Throws when no authenticated user — used inside server actions/pages. */
export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new Error("You must be signed in.");
  return user;
}
