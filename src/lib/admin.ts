import { supabase } from "@/lib/supabase";
import { callEdge } from "@/lib/edge";

export interface AdminSeriesPoint {
  day: string;
  users: number;
  videos: number;
}

export interface AdminUserRow {
  id: string;
  email: string | null;
  display_name: string | null;
  is_super_admin: boolean;
  joined_at: string;
  video_count: number;
  last_active: string | null;
}

export interface AdminTopUser {
  user_id: string;
  display_name: string | null;
  email: string | null;
  video_count: number;
}

export interface AdminActivityItem {
  id: string;
  title: string;
  user_name: string;
  user_email: string | null;
  created_at: string;
}

export interface AdminStats {
  totals: { users: number; videos: number; categories: number; tags: number };
  periods: {
    users7d: number;
    users30d: number;
    videos7d: number;
    videos30d: number;
    active7d: number;
    active30d: number;
  };
  series: AdminSeriesPoint[];
  topUsers: AdminTopUser[];
  users: AdminUserRow[];
  recentActivity: AdminActivityItem[];
}

/** True when the signed-in user is a super admin (reads their own profile, RLS-safe). */
export async function isSuperAdmin(): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .maybeSingle();
  return Boolean(data?.is_super_admin);
}

/** Loads platform stats via the admin-stats edge function (service-role, server-side). */
export async function loadAdminStats(): Promise<AdminStats> {
  return callEdge<AdminStats>("admin-stats", undefined, { method: "GET" });
}