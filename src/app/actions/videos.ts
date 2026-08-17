"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { parseYouTubeUrl } from "@/lib/youtube/parse";
import { fetchVideoMetadata } from "@/lib/youtube/api";
import type { YouTubeMetadata } from "@/lib/youtube/api";
import {
  saveVideoSchema,
  updateVideoFlagsSchema,
  updateVideoNotesSchema,
  updateVideoOrganizationSchema,
} from "@/lib/validation";
import { loadLibraryPage, type LibraryFilters } from "@/lib/library";
import type { VideoWithRelations } from "@/types/database";
import { revalidatePath } from "next/cache";

export interface ActionResult<T = undefined> {
  ok: boolean;
  error?: string;
  code?: string;
  data?: T;
}

function youtubeApiKey(): string {
  return process.env.YOUTUBE_API_KEY ?? "";
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
    const metadata = await fetchVideoMetadata(videoId, youtubeApiKey());
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
  const user = await requireUser();
  const parsed = saveVideoSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const videoId = parseYouTubeUrl(parsed.data.youtubeUrl);
  if (!videoId) {
    return { ok: false, code: "invalid_url", error: "That doesn't look like a valid YouTube URL." };
  }

  const supabase = await createServerSupabase();

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
    metadata = await fetchVideoMetadata(videoId, youtubeApiKey());
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

  if (rpcError) {
    return { ok: false, error: rpcError.message };
  }

  revalidatePath("/app", "layout");
  return { ok: true, data: { duplicate: null } };
}

export async function loadMoreVideos(
  filters: LibraryFilters,
  offset: number,
): Promise<ActionResult<{ videos: VideoWithRelations[]; total: number; hasMore: boolean }>> {
  const user = await requireUser();
  const supabase = await createServerSupabase();
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

  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("set_video_relations", {
    p_video: parsed.data.videoId,
    p_categories: parsed.data.categoryIds,
    p_tags: parsed.data.tagNames,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function updateVideoNotes(
  input: { videoId: string; personalNotes: string | null },
): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = updateVideoNotesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("videos")
    .update({ personal_notes: parsed.data.personalNotes || null })
    .eq("id", parsed.data.videoId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/app", "layout");
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
  const user = await requireUser();
  const parsed = updateVideoFlagsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createServerSupabase();
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
  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function refreshVideoMetadata(
  input: { videoId: string },
): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createServerSupabase();

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
    metadata = await fetchVideoMetadata(video.youtube_video_id, youtubeApiKey());
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
  revalidatePath("/app", "layout");
  return { ok: true };
}

export async function deleteVideo(input: { videoId: string }): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("videos")
    .delete()
    .eq("id", input.videoId)
    .eq("user_id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app", "layout");
  return { ok: true };
}
