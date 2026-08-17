import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, VideoWithRelations, Category, Tag } from "@/types/database";
import { PAGE_SIZE } from "@/lib/constants";
import type { SortOption, DateFilter, WatchStatus, CardDensity } from "@/lib/constants";

export interface LibraryFilters {
  q?: string;
  categoryIds?: string[];
  tagIds?: string[];
  channelId?: string;
  added?: DateFilter;
  status?: WatchStatus;
  favorite?: boolean;
  watchLater?: boolean;
  sort: SortOption;
}

export interface LibraryPage {
  videos: VideoWithRelations[];
  total: number;
  hasMore: boolean;
}

type DB = SupabaseClient<Database>;

const SORT_COLUMNS: Record<
  SortOption,
  { column: string; ascending: boolean; nullsFirst?: boolean }
> = {
  recently_added: { column: "created_at", ascending: false },
  oldest_added: { column: "created_at", ascending: true },
  newest_video: { column: "published_at", ascending: false, nullsFirst: false },
  oldest_video: { column: "published_at", ascending: true, nullsFirst: false },
  title_asc: { column: "title", ascending: true },
  title_desc: { column: "title", ascending: false },
  channel: { column: "channel_name", ascending: true, nullsFirst: false },
};

export function dateCutoff(added: DateFilter): Date | null {
  const now = new Date();
  switch (added) {
    case "today": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

export async function loadLibraryPage(
  supabase: DB,
  userId: string,
  filters: LibraryFilters,
  offset = 0,
): Promise<LibraryPage> {
  const selectParts = ["*"];
  if (filters.categoryIds?.length) {
    selectParts.push("categories!video_categories!inner(id)");
  }
  if (filters.tagIds?.length) {
    selectParts.push("tags!video_tags!inner(id)");
  }

  let query = supabase
    .from("videos")
    .select(selectParts.join(","), { count: "exact" })
    .eq("user_id", userId)
    .range(offset, offset + PAGE_SIZE - 1);

  const q = filters.q?.trim();
  if (q) {
    query = query.textSearch("search_vector", q, {
      type: "plain",
      config: "simple",
    });
  }

  if (filters.categoryIds?.length) {
    query = query.in("categories.id", filters.categoryIds);
  }
  if (filters.tagIds?.length) {
    query = query.in("tags.id", filters.tagIds);
  }
  if (filters.channelId) {
    query = query.eq("channel_id", filters.channelId);
  }

  const cutoff = dateCutoff(filters.added ?? "all");
  if (cutoff) {
    query = query.gte("created_at", cutoff.toISOString());
  }
  if (filters.status) {
    query = query.eq("watch_status", filters.status);
  }
  if (filters.favorite) {
    query = query.eq("is_favorite", true);
  }
  if (filters.watchLater) {
    query = query.eq("is_watch_later", true);
  }

  const sort = SORT_COLUMNS[filters.sort];
  query = query.order(sort.column, {
    ascending: sort.ascending,
    nullsFirst: sort.nullsFirst,
  });

  const { data, error, count } = await query;
  if (error) throw error;

  const videos = (data ?? []) as unknown as Array<
    Database["public"]["Tables"]["videos"]["Row"]
  >;
  const withRelations = await attachRelations(supabase, userId, videos);

  return {
    videos: withRelations,
    total: count ?? withRelations.length,
    hasMore: (offset + withRelations.length) < (count ?? 0),
  };
}

export async function fetchAllCategories(
  supabase: DB,
  userId: string,
): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Returns the given category id plus every nested descendant id. */
export async function collectCategoryDescendants(
  supabase: DB,
  userId: string,
  categoryId: string,
): Promise<string[]> {
  const all = await fetchAllCategories(supabase, userId);
  const byParent = new Map<string, string[]>();
  for (const c of all) {
    if (c.parent_id) {
      const list = byParent.get(c.parent_id) ?? [];
      list.push(c.id);
      byParent.set(c.parent_id, list);
    }
  }
  const result: string[] = [categoryId];
  const queue = [categoryId];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const child of byParent.get(cur) ?? []) {
      result.push(child);
      queue.push(child);
    }
  }
  return result;
}

export async function fetchAllTags(supabase: DB, userId: string): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchDistinctChannels(
  supabase: DB,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("videos")
    .select("channel_name, channel_id")
    .eq("user_id", userId)
    .not("channel_name", "is", null)
    .order("channel_name", { ascending: true });
  if (error) throw error;
  const seen = new Set<string>();
  const channels: string[] = [];
  for (const v of data ?? []) {
    const name = (v as { channel_name: string }).channel_name;
    const id = (v as { channel_id: string | null }).channel_id;
    const key = id ?? name;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    channels.push(name);
  }
  return channels;
}

async function attachRelations(
  supabase: DB,
  userId: string,
  videos: Array<Database["public"]["Tables"]["videos"]["Row"]>,
): Promise<VideoWithRelations[]> {
  if (videos.length === 0) return [];

  const ids = videos.map((v) => v.id);
  const [categories, tags, catRels, tagRels] = await Promise.all([
    fetchAllCategories(supabase, userId),
    fetchAllTags(supabase, userId),
    supabase.from("video_categories").select("video_id, category_id").in("video_id", ids),
    supabase.from("video_tags").select("video_id, tag_id").in("video_id", ids),
  ]);

  const catById = new Map(categories.map((c) => [c.id, c]));
  const tagById = new Map(tags.map((t) => [t.id, t]));

  const catMap = new Map<string, Category[]>();
  for (const r of catRels.data ?? []) {
    const c = catById.get(r.category_id);
    if (!c) continue;
    const list = catMap.get(r.video_id) ?? [];
    list.push(c);
    catMap.set(r.video_id, list);
  }

  const tagMap = new Map<string, Tag[]>();
  for (const r of tagRels.data ?? []) {
    const t = tagById.get(r.tag_id);
    if (!t) continue;
    const list = tagMap.get(r.video_id) ?? [];
    list.push(t);
    tagMap.set(r.video_id, list);
  }

  return videos.map((v) => ({
    ...v,
    categories: catMap.get(v.id) ?? [],
    tags: tagMap.get(v.id) ?? [],
  }));
}

export interface LibraryPageData {
  initial: LibraryPage;
  categories: Category[];
  tags: Tag[];
  channels: string[];
  defaultSort: SortOption;
  density: CardDensity;
}

export async function loadLibraryPageData(
  supabase: DB,
  userId: string,
  filters: LibraryFilters,
): Promise<LibraryPageData> {
  const [initial, categories, tags, channels, profileRes] = await Promise.all([
    loadLibraryPage(supabase, userId, filters, 0),
    fetchAllCategories(supabase, userId),
    fetchAllTags(supabase, userId),
    fetchDistinctChannels(supabase, userId),
    supabase.from("profiles").select("default_sort, card_density").eq("id", userId).maybeSingle(),
  ]);

  const profile = profileRes.data as { default_sort?: string; card_density?: string } | null;
  const defaultSort = (profile?.default_sort ?? "recently_added") as SortOption;
  const density = (profile?.card_density ?? "comfortable") as CardDensity;

  return { initial, categories, tags, channels, defaultSort, density };
}
