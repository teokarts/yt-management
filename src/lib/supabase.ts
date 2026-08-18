import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing Supabase env vars. Copy .env.example to .env.local and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
  );
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    // The app uses HashRouter, so the router owns the URL hash. Supabase's own
    // URL parsing would race it — `consumeAuthFromUrl` handles tokens instead.
    detectSessionInUrl: false,
    flowType: "implicit",
    persistSession: true,
    autoRefreshToken: true,
  },
});

export function getSupabase() {
  return supabase;
}