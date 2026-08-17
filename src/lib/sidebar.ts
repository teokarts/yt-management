import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, CategoryWithCount, TagWithCount } from "@/types/database";

type DB = SupabaseClient<Database>;

export interface SidebarData {
  categories: CategoryWithCount[];
  pinnedTags: TagWithCount[];
  totalVideos: number;
  favoriteCount: number;
  watchLaterCount: number;
}

type Count = { count: number } | { count: number }[] | number | null | undefined;

function countValue(v: Count): number {
  if (typeof v === "number") return v;
  if (Array.isArray(v)) return v[0]?.count ?? 0;
  return v?.count ?? 0;
}

export async function loadSidebarData(supabase: DB, userId: string): Promise<SidebarData> {
  const [categoriesRes, tagsRes, totalRes, favRes, laterRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, color, icon, sort_order, video_count:videos!video_categories(count)")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("tags")
      .select("id, name, slug, normalized_name, is_pinned, video_count:videos!video_tags(count)")
      .eq("user_id", userId)
      .eq("is_pinned", true)
      .order("name", { ascending: true }),
    supabase.from("videos").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_favorite", true),
    supabase
      .from("videos")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_watch_later", true),
  ]);

  const mapCategory = (c: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
    icon: string | null;
    sort_order: number;
    video_count: { count: number } | number | null;
  }): CategoryWithCount => ({
    id: c.id,
    user_id: userId,
    name: c.name,
    slug: c.slug,
    color: c.color,
    icon: c.icon,
    sort_order: c.sort_order,
    video_count: countValue(c.video_count),
    created_at: "",
    updated_at: "",
    description: null,
  });

  const mapTag = (t: {
    id: string;
    name: string;
    slug: string;
    normalized_name: string;
    is_pinned: boolean;
    video_count: { count: number } | number | null;
  }): TagWithCount => ({
    id: t.id,
    user_id: userId,
    name: t.name,
    slug: t.slug,
    normalized_name: t.normalized_name,
    is_pinned: t.is_pinned,
    video_count: countValue(t.video_count),
    created_at: "",
    updated_at: "",
  });

  return {
    categories: (
      (categoriesRes.data ?? []) as unknown as Parameters<typeof mapCategory>[0][]
    ).map(mapCategory),
    pinnedTags: ((tagsRes.data ?? []) as unknown as Parameters<typeof mapTag>[0][]).map(mapTag),
    totalVideos: totalRes.count ?? 0,
    favoriteCount: favRes.count ?? 0,
    watchLaterCount: laterRes.count ?? 0,
  };
}