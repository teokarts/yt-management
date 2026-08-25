import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Playlist,
  PlaylistWithCount,
  VideoWithRelations,
} from "@/types/database";
import { attachRelations } from "@/lib/library";

type DB = SupabaseClient<Database>;

export async function fetchAllPlaylists(
  supabase: DB,
  userId: string,
): Promise<PlaylistWithCount[]> {
  const { data, error } = await supabase
    .from("playlists")
    .select("*, video_count:playlist_videos(count)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  type Row = Playlist & {
    video_count: { count: number }[] | { count: number } | number | null;
  };
  return ((data ?? []) as unknown as Row[]).map((p) => {
    const raw = p.video_count;
    const video_count =
      typeof raw === "number" ? raw : Array.isArray(raw) ? (raw[0]?.count ?? 0) : (raw?.count ?? 0);
    return { ...p, video_count } as PlaylistWithCount;
  });
}

export async function fetchPlaylistBySlug(
  supabase: DB,
  userId: string,
  slug: string,
): Promise<Playlist | null> {
  const { data } = await supabase
    .from("playlists")
    .select("*")
    .eq("user_id", userId)
    .eq("slug", slug)
    .maybeSingle();
  return (data as Playlist | null) ?? null;
}

/** Videos of a playlist in manual order (position asc). */
export async function loadPlaylistVideos(
  supabase: DB,
  userId: string,
  playlistId: string,
): Promise<VideoWithRelations[]> {
  const { data, error } = await supabase
    .from("playlist_videos")
    .select("position, videos(*)")
    .eq("playlist_id", playlistId)
    .order("position", { ascending: true })
    .order("added_at", { ascending: true });
  if (error) throw error;

  type Row = { videos: Database["public"]["Tables"]["videos"]["Row"] | null };
  const videos = ((data ?? []) as unknown as Row[])
    .map((r) => r.videos)
    .filter((v): v is Database["public"]["Tables"]["videos"]["Row"] => v !== null);
  return attachRelations(supabase, userId, videos);
}

/** Which of the user's playlists already contain the given video. */
export async function fetchVideoPlaylistIds(
  supabase: DB,
  userId: string,
  videoId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("playlist_videos")
    .select("playlist_id, playlists!inner(user_id)")
    .eq("video_id", videoId)
    .eq("playlists.user_id", userId);
  if (error) throw error;
  type Row = { playlist_id: string };
  return ((data ?? []) as unknown as Row[]).map((r) => r.playlist_id);
}
