import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { parseYouTubeUrl } from "@/lib/youtube/parse";
import { fetchVideoMetadata } from "@/lib/youtube/api";
import type { YouTubeMetadata } from "@/lib/youtube/api";
import {
  saveVideoSchema,
  updateVideoFlagsSchema,
  updateVideoNotesSchema,
  updateVideoOrganizationSchema,
  createCategorySchema,
  renameCategorySchema,
  deleteCategorySchema,
  createTagSchema,
  pinTagSchema,
  updateProfileSchema,
} from "@/lib/validation";
import { loadLibraryPage, type LibraryFilters } from "@/lib/library";
import { slugify, normalizeTag } from "@/lib/utils";
import type { VideoWithRelations } from "@/types/database";

export interface ActionResult<T = undefined> {
  ok: boolean;
  error?: string;
  code?: string;
  data?: T;
}

async function currentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in.");
  return user;
}

const credentialsSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function signIn(input: {
  email: string;
  password: string;
}): Promise<ActionResult<{ isSuperAdmin: boolean }>> {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return {
      ok: false,
      error:
        error.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : error.message,
    };
  }

  let isSuperAdmin = false;
  if (data.user?.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_super_admin")
      .eq("id", data.user.id)
      .maybeSingle();
    isSuperAdmin = Boolean(profile?.is_super_admin);
  }

  return { ok: true, data: { isSuperAdmin } };
}

export async function signUp(input: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<ActionResult> {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: input.displayName?.trim() ? { display_name: input.displayName.trim() } : undefined,
    },
  });

  if (error) {
    return {
      ok: false,
      error:
        error.message.toLowerCase().includes("already registered")
          ? "An account with this email already exists."
          : error.message,
    };
  }

  return { ok: true };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function requestPasswordReset(input: {
  email: string;
}): Promise<ActionResult> {
  const email = z.string().trim().email().safeParse(input.email);
  if (!email.success) {
    return { ok: false, error: "Enter a valid email address" };
  }
const origin = import.meta.env.VITE_APP_URL || window.location.origin;

  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: origin,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function getYouTubeMetadata(
  input: { youtubeUrl: string },
): Promise<ActionResult<YouTubeMetadata>> {
  const url = input.youtubeUrl?.trim() ?? "";
  const videoId = parseYouTubeUrl(url);
  if (!videoId) {
    return { ok: false, code: "invalid_url", error: "That doesn't look like a valid YouTube URL." };
  }

  try {
    const metadata = await fetchVideoMetadata(videoId);
    return { ok: true, data: metadata };
  } catch (err) {
    const e = err as { kind?: string; message: string };
    return { ok: false, code: e.kind ?? "api", error: e.message };
  }
}

export async function addVideo(
  input: {
    youtubeUrl: string;
    categoryIds?: string[];
    tagNames?: string[];
    personalNotes?: string | null;
    isFavorite?: boolean;
    isWatchLater?: boolean;
    watchStatus?: "unwatched" | "watching" | "watched";
  },
): Promise<ActionResult<{ duplicate: VideoWithRelations | null }>> {
  const user = await currentUser();
  const parsed = saveVideoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const videoId = parseYouTubeUrl(parsed.data.youtubeUrl);
  if (!videoId) {
    return { ok: false, code: "invalid_url", error: "That doesn't look like a valid YouTube URL." };
  }

  const existing = await supabase
    .from("videos")
    .select("*, categories!video_categories(*), tags!video_tags(*)")
    .eq("user_id", user.id)
    .eq("youtube_video_id", videoId)
    .maybeSingle();

  if (existing.data) {
    return {
      ok: false,
      code: "duplicate",
      error: "This video is already in your library.",
      data: { duplicate: existing.data as unknown as VideoWithRelations },
    };
  }

  let metadata: YouTubeMetadata;
  try {
    metadata = await fetchVideoMetadata(videoId);
  } catch (err) {
    const e = err as { kind?: string; message: string };
    return { ok: false, code: e.kind ?? "api", error: e.message };
  }

  const { error: rpcError } = await supabase.rpc("add_video_with_relations", {
    p_youtube_video_id: metadata.videoId,
    p_youtube_url: parsed.data.youtubeUrl.trim(),
    p_title: metadata.title,
    p_description: metadata.description,
    p_thumbnail_url: metadata.thumbnailUrl,
    p_channel_name: metadata.channelName,
    p_channel_id: metadata.channelId,
    p_published_at: metadata.publishedAt,
    p_duration: metadata.duration,
    p_notes: parsed.data.personalNotes ?? null,
    p_favorite: parsed.data.isFavorite,
    p_watch_later: parsed.data.isWatchLater,
    p_status: parsed.data.watchStatus,
    p_categories: parsed.data.categoryIds,
    p_tags: parsed.data.tagNames,
  });

  if (rpcError) return { ok: false, error: rpcError.message };
  return { ok: true, data: { duplicate: null } };
}

export async function loadMoreVideos(
  filters: LibraryFilters,
  offset: number,
): Promise<ActionResult<{ videos: VideoWithRelations[]; total: number; hasMore: boolean }>> {
  const user = await currentUser();
  try {
    const page = await loadLibraryPage(supabase, user.id, filters, offset);
    return { ok: true, data: page };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export async function updateVideoOrganization(
  input: { videoId: string; categoryIds: string[]; tagNames: string[] },
): Promise<ActionResult> {
  const parsed = updateVideoOrganizationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { error } = await supabase.rpc("set_video_relations", {
    p_video: parsed.data.videoId,
    p_categories: parsed.data.categoryIds,
    p_tags: parsed.data.tagNames,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateVideoNotes(
  input: { videoId: string; personalNotes: string | null },
): Promise<ActionResult> {
  const user = await currentUser();
  const parsed = updateVideoNotesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { error } = await supabase
    .from("videos")
    .update({ personal_notes: parsed.data.personalNotes || null })
    .eq("id", parsed.data.videoId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateVideoFlags(
  input: {
    videoId: string;
    isFavorite?: boolean;
    isWatchLater?: boolean;
    watchStatus?: "unwatched" | "watching" | "watched";
  },
): Promise<ActionResult> {
  const user = await currentUser();
  const parsed = updateVideoFlagsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const patch: {
    is_favorite?: boolean;
    is_watch_later?: boolean;
    watch_status?: "unwatched" | "watching" | "watched";
  } = {};
  if (parsed.data.isFavorite !== undefined) patch.is_favorite = parsed.data.isFavorite;
  if (parsed.data.isWatchLater !== undefined) patch.is_watch_later = parsed.data.isWatchLater;
  if (parsed.data.watchStatus !== undefined) patch.watch_status = parsed.data.watchStatus;

  const { error } = await supabase
    .from("videos")
    .update(patch)
    .eq("id", parsed.data.videoId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function refreshVideoMetadata(
  input: { videoId: string },
): Promise<ActionResult> {
  const user = await currentUser();

  const { data: video, error: fetchError } = await supabase
    .from("videos")
    .select("id, youtube_video_id")
    .eq("id", input.videoId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !video) {
    return { ok: false, error: "Video not found." };
  }

  let metadata: YouTubeMetadata;
  try {
    metadata = await fetchVideoMetadata(video.youtube_video_id);
  } catch (err) {
    const e = err as { kind?: string; message: string };
    return { ok: false, code: e.kind ?? "api", error: e.message };
  }

  const { error } = await supabase
    .from("videos")
    .update({
      title: metadata.title,
      description: metadata.description,
      thumbnail_url: metadata.thumbnailUrl,
      channel_name: metadata.channelName,
      channel_id: metadata.channelId,
      published_at: metadata.publishedAt,
      duration: metadata.duration,
    })
    .eq("id", video.id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteVideo(input: { videoId: string }): Promise<ActionResult> {
  const user = await currentUser();
  const { error } = await supabase
    .from("videos")
    .delete()
    .eq("id", input.videoId)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function resolveParent(
  parentId: string | null | undefined,
  selfId?: string,
): Promise<{ ok: true; parentId: string | null } | { ok: false; error: string }> {
  const user = await currentUser();
  if (!parentId) return { ok: true, parentId: null };

  if (selfId && parentId === selfId) {
    return { ok: false, error: "A category cannot be nested inside itself." };
  }

  const { data: parent, error } = await supabase
    .from("categories")
    .select("id, parent_id")
    .eq("id", parentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!parent) return { ok: false, error: "Parent category not found." };

  if (selfId) {
    let cursor: { id: string; parent_id: string | null } | null = parent;
    const seen = new Set<string>([parentId]);
    while (cursor?.parent_id) {
      if (cursor.parent_id === selfId) {
        return { ok: false, error: "A category cannot be nested inside itself." };
      }
      if (seen.has(cursor.parent_id)) break;
      seen.add(cursor.parent_id);
      const { data: ancestor } = (await supabase
        .from("categories")
        .select("id, parent_id")
        .eq("id", cursor.parent_id)
        .eq("user_id", user.id)
        .maybeSingle()) as {
        data: { id: string; parent_id: string | null } | null;
      };
      cursor = ancestor;
    }
  }

  return { ok: true, parentId };
}

export async function createCategory(input: {
  name: string;
  parentId?: string | null;
  color?: string | null;
  icon?: string | null;
  description?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  const user = await currentUser();
  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const parent = await resolveParent(parsed.data.parentId);
  if (!parent.ok) return parent;

  const { data: maxRow } = await supabase
    .from("categories")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: user.id,
      name: parsed.data.name.trim(),
      slug: slugify(parsed.data.name),
      color: parsed.data.color ?? null,
      icon: parsed.data.icon ?? null,
      description: parsed.data.description ?? null,
      parent_id: parent.parentId,
      sort_order: (maxRow?.sort_order ?? -1) + 1,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "A category with this name already exists." };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true, data: { id: data.id } };
}

export async function renameCategory(input: {
  id: string;
  name: string;
  parentId?: string | null;
  color?: string | null;
  icon?: string | null;
  description?: string | null;
}): Promise<ActionResult> {
  const user = await currentUser();
  const parsed = renameCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("id", parsed.data.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) return { ok: false, error: "Category not found." };

  const parent = await resolveParent(parsed.data.parentId, parsed.data.id);
  if (!parent.ok) return parent;

  const { error } = await supabase
    .from("categories")
    .update({
      name: parsed.data.name.trim(),
      slug: slugify(parsed.data.name),
      color: parsed.data.color ?? null,
      icon: parsed.data.icon ?? null,
      description: parsed.data.description ?? null,
      parent_id: parent.parentId,
    })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "A category with this name already exists." };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function deleteCategory(input: { id: string }): Promise<ActionResult> {
  const user = await currentUser();
  const parsed = deleteCategorySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function reorderCategories(input: { ids: string[] }): Promise<ActionResult> {
  const user = await currentUser();
  for (const [index, id] of input.ids.entries()) {
    const { error } = await supabase
      .from("categories")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function createTag(input: { name: string }): Promise<ActionResult<{ id: string }>> {
  const user = await currentUser();
  const parsed = createTagSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const name = parsed.data.name.trim();
  const normalized = normalizeTag(name);

  const { data, error } = await supabase
    .from("tags")
    .insert({
      user_id: user.id,
      name,
      normalized_name: normalized,
      slug: slugify(normalized),
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "This tag already exists." };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true, data: { id: data.id } };
}

export async function pinTag(input: { id: string; isPinned: boolean }): Promise<ActionResult> {
  const user = await currentUser();
  const parsed = pinTagSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { error } = await supabase
    .from("tags")
    .update({ is_pinned: parsed.data.isPinned })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteTag(input: { id: string }): Promise<ActionResult> {
  const user = await currentUser();
  const { error } = await supabase
    .from("tags")
    .delete()
    .eq("id", input.id)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateProfile(input: {
  displayName?: string | null;
  defaultSort?: string;
  cardDensity?: "cozy" | "comfortable" | "compact" | "list";
}): Promise<ActionResult> {
  const user = await currentUser();
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const update: {
    display_name?: string | null;
    default_sort?: string;
    card_density?: "cozy" | "comfortable" | "compact" | "list";
  } = {};
  if (parsed.data.displayName !== undefined) update.display_name = parsed.data.displayName || null;
  if (parsed.data.defaultSort !== undefined) update.default_sort = parsed.data.defaultSort;
  if (parsed.data.cardDensity !== undefined) update.card_density = parsed.data.cardDensity;

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}