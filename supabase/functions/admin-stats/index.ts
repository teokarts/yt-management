// Admin platform stats proxy.
//
// Uses SUPABASE_SERVICE_ROLE_KEY (server-side only) to call the admin RPCs
// that are revoked from `public` and granted only to `service_role`.
// Only a signed-in super admin may invoke this function.
//
// Deploy: supabase functions deploy admin-stats

import { createClient } from "jsr:@supabase/supabase-js";

interface AdminStats {
  totals: { users: number; videos: number; categories: number; tags: number };
  periods: {
    users7d: number;
    users30d: number;
    videos7d: number;
    videos30d: number;
    active7d: number;
    active30d: number;
  };
  series: { day: string; users: number; videos: number }[];
  topUsers: { user_id: string; display_name: string | null; email: string | null; video_count: number }[];
  users: { id: string; email: string | null; display_name: string | null; is_super_admin: boolean; joined_at: string; video_count: number; last_active: string | null }[];
  recentActivity: { id: string; title: string; user_name: string; user_email: string | null; created_at: string }[];
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

const dayAgoIso = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

type AdminClient = ReturnType<typeof createClient>;

async function countRows(db: AdminClient, table: "profiles" | "videos" | "categories" | "tags", sinceIso?: string) {
  let q = db.from(table).select("id", { count: "exact", head: true });
  if (sinceIso) q = q.gte("created_at", sinceIso);
  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

async function fetchAuthUserMap(db: AdminClient): Promise<Map<string, { email: string | null; name: string | null }>> {
  const map = new Map<string, { email: string | null; name: string | null }>();
  const perPage = 200;
  for (let page = 1; page <= 25; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage });
    if (error) break;
    for (const u of data.users) {
      map.set(u.id, {
        email: u.email ?? null,
        name: (u.user_metadata?.full_name as string | undefined) ?? null,
      });
    }
    if (data.users.length < perPage) break;
  }
  return map;
}

async function loadAdminStats(db: AdminClient): Promise<AdminStats> {
  const [
    usersCount, videosCount, categoriesCount, tagsCount,
    users7d, users30d, videos7d, videos30d,
    active7d, active30d,
    seriesRes, topUsersRes, userStatsRes,
    profilesRes, recentVideosRes,
  ] = await Promise.all([
    countRows(db, "profiles"),
    countRows(db, "videos"),
    countRows(db, "categories"),
    countRows(db, "tags"),
    countRows(db, "profiles", dayAgoIso(7)),
    countRows(db, "profiles", dayAgoIso(30)),
    countRows(db, "videos", dayAgoIso(7)),
    countRows(db, "videos", dayAgoIso(30)),
    db.rpc("admin_active_users", { days: 7 }),
    db.rpc("admin_active_users", { days: 30 }),
    db.rpc("admin_daily_series", { days: 30 }),
    db.rpc("admin_top_users", { lim: 10 }),
    db.rpc("admin_user_stats"),
    db.from("profiles").select("id, display_name, is_super_admin, created_at").order("created_at", { ascending: false }).limit(2000),
    db.from("videos").select("id, user_id, title, created_at").order("created_at", { ascending: false }).limit(12),
  ]);

  for (const res of [seriesRes, topUsersRes, userStatsRes, profilesRes, recentVideosRes]) {
    if (res.error) throw res.error;
  }

  const authMap = await fetchAuthUserMap(db);

  const profileById = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
  const statsById = new Map(
    (userStatsRes.data ?? []).map((s) => [s.user_id, { video_count: Number(s.video_count ?? 0), last_active: s.last_active as string | null }]),
  );

  const displayName = (id: string): string | null => {
    const p = profileById.get(id);
    if (p?.display_name) return p.display_name;
    return authMap.get(id)?.name ?? null;
  };
  const emailOf = (id: string): string | null => authMap.get(id)?.email ?? null;

  const users = (profilesRes.data ?? []).map((p) => {
    const st = statsById.get(p.id);
    return {
      id: p.id,
      email: emailOf(p.id),
      display_name: p.display_name,
      is_super_admin: p.is_super_admin,
      joined_at: p.created_at,
      video_count: st?.video_count ?? 0,
      last_active: st?.last_active ?? null,
    };
  });

  const topUsers = (topUsersRes.data ?? []).map((t) => ({
    user_id: t.user_id,
    display_name: displayName(t.user_id),
    email: emailOf(t.user_id),
    video_count: Number(t.video_count ?? 0),
  }));

  const recentActivity = (recentVideosRes.data ?? []).map((v) => ({
    id: v.id,
    title: v.title,
    user_name: displayName(v.user_id) ?? emailOf(v.user_id) ?? "Unknown user",
    user_email: emailOf(v.user_id),
    created_at: v.created_at,
  }));

  return {
    totals: { users: usersCount, videos: videosCount, categories: categoriesCount, tags: tagsCount },
    periods: {
      users7d, users30d, videos7d, videos30d,
      active7d: Number(active7d.data ?? 0),
      active30d: Number(active30d.data ?? 0),
    },
    series: (seriesRes.data ?? []).map((s) => ({ day: s.day, users: Number(s.users ?? 0), videos: Number(s.videos ?? 0) })),
    topUsers,
    users,
    recentActivity,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "GET") {
    return json({ error: "Method not allowed." }, 405);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    return json({ error: "Admin function is not configured." }, 500);
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  // Identify the caller from their JWT.
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return json({ error: "Unauthorized." }, 401);

  const {
    data: { user },
    error: userError,
  } = await admin.auth.getUser(token);
  if (userError || !user) return json({ error: "Unauthorized." }, 401);

  // Only a super admin may view platform stats.
  const { data: profile } = await admin
    .from("profiles")
    .select("is_super_admin")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_super_admin) return json({ error: "Forbidden." }, 403);

  try {
    const stats = await loadAdminStats(admin);
    return json(stats);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});