import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role client. Bypasses RLS and is only usable server-side.
 * Never import this into a client component.
 */
export function createAdminSupabase() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}