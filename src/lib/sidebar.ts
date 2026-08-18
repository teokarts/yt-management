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

/**
 * Counts rows per foreign key in a junction table.
 *
 * The counts are deliberately NOT fetched as a PostgREST embedded aggregate
 * (`videos!video_categories(count)`). `categories` carries a self-referencing
 * `parent_id` FK for subcategories, which makes that embed ambiguous to
 * relationship resolution — it errors instead of returning rows, and the
 * sidebar then renders as if the user had no categories at all.
 */
async function countByColumn(
  supabase: DB,
  table: "video_categories" | "video_tags",
  column: "category_id" | "tag_id",
  ids: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (ids.length === 0) return counts;

  const { data, error } = await supabase.from(table).select(column).in(column, ids);
  if (error) throw error;

  for (const row of (data ?? []) as unknown as Record<string, string>[]) {
    const key = row[column];
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export async function loadSidebarData(supabase: DB, userId: string): Promise<SidebarData> {
  const [categoriesRes, tagsRes, totalRes, favRes, laterRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, slug, color, icon, parent_id, sort_order")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("tags")
      .select("id, name, slug, normalized_name, is_pinned")
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

  // Surface failures instead of silently degrading to an empty sidebar.
  if (categoriesRes.error) throw categoriesRes.error;
  if (tagsRes.error) throw tagsRes.error;
  if (totalRes.error) throw totalRes.error;
  if (favRes.error) throw favRes.error;
  if (laterRes.error) throw laterRes.error;

  type CategoryRow = {
    id: string;
    name: string;
    slug: string;
    color: string | null;
    icon: string | null;
    parent_id: string | null;
    sort_order: number;
  };
  type TagRow = {
    id: string;
    name: string;
    slug: string;
    normalized_name: string;
    is_pinned: boolean;
  };

  const categoryRows = (categoriesRes.data ?? []) as unknown as CategoryRow[];
  const tagRows = (tagsRes.data ?? []) as unknown as TagRow[];

  const [categoryCounts, tagCounts] = await Promise.all([
    countByColumn(
      supabase,
      "video_categories",
      "category_id",
      categoryRows.map((c) => c.id),
    ),
    countByColumn(
      supabase,
      "video_tags",
      "tag_id",
      tagRows.map((t) => t.id),
    ),
  ]);

  const categories: CategoryWithCount[] = categoryRows.map((c) => ({
    id: c.id,
    user_id: userId,
    name: c.name,
    slug: c.slug,
    color: c.color,
    icon: c.icon,
    parent_id: c.parent_id,
    sort_order: c.sort_order,
    video_count: categoryCounts.get(c.id) ?? 0,
    created_at: "",
    updated_at: "",
    description: null,
  }));

  const pinnedTags: TagWithCount[] = tagRows.map((t) => ({
    id: t.id,
    user_id: userId,
    name: t.name,
    slug: t.slug,
    normalized_name: t.normalized_name,
    is_pinned: t.is_pinned,
    video_count: tagCounts.get(t.id) ?? 0,
    created_at: "",
    updated_at: "",
  }));

  return {
    categories,
    pinnedTags,
    totalVideos: totalRes.count ?? 0,
    favoriteCount: favRes.count ?? 0,
    watchLaterCount: laterRes.count ?? 0,
  };
}
