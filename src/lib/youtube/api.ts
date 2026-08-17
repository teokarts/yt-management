export interface YouTubeMetadata {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelName: string;
  channelId: string;
  publishedAt: string | null;
  duration: string | null;
  viewCount?: number;
}

export class YouTubeApiError extends Error {
  kind: "quota" | "not_found" | "private" | "unavailable" | "api" | "network";

  constructor(kind: YouTubeApiError["kind"], message: string) {
    super(message);
    this.kind = kind;
  }
}

const API_BASE = "https://www.googleapis.com/youtube/v3";

function pickThumbnail(thumbnails: Record<string, { url: string }> | undefined): string {
  if (!thumbnails) return "";
  const order = ["maxres", "standard", "high", "medium", "default"] as const;
  for (const size of order) {
    const t = thumbnails[size];
    if (t?.url) return t.url;
  }
  return "";
}

export async function fetchVideoMetadata(
  videoId: string,
  apiKey: string,
): Promise<YouTubeMetadata> {
  if (!apiKey) {
    throw new YouTubeApiError("api", "YouTube API key is not configured.");
  }

  const params = new URLSearchParams({
    part: "snippet,contentDetails,statistics",
    id: videoId,
    key: apiKey,
  });

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/videos?${params.toString()}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    });
  } catch {
    throw new YouTubeApiError("network", "Could not reach the YouTube API.");
  }

  if (response.status === 403 || response.status === 429) {
    throw new YouTubeApiError(
      "quota",
      "The YouTube API quota has been exceeded for today. Try again later.",
    );
  }

  if (!response.ok) {
    throw new YouTubeApiError("api", `YouTube API returned status ${response.status}.`);
  }

  let data: {
    items?: Array<{
      id?: string;
      snippet?: {
        title?: string;
        description?: string;
        channelTitle?: string;
        channelId?: string;
        publishedAt?: string;
        thumbnails?: Record<string, { url: string }>;
      };
      contentDetails?: { duration?: string };
      statistics?: { viewCount?: string };
    }>;
    error?: { message?: string };
  };
  try {
    data = await response.json();
  } catch {
    throw new YouTubeApiError("api", "YouTube API returned malformed JSON.");
  }

  if (data.error?.message) {
    throw new YouTubeApiError("api", data.error.message);
  }

  const item = data.items?.[0];
  if (!item?.id || !item.snippet?.title) {
    throw new YouTubeApiError(
      "not_found",
      "This video could not be found. It may be private, region-locked, or deleted.",
    );
  }

  return {
    videoId: item.id,
    title: item.snippet.title || "Untitled video",
    description: item.snippet.description || "",
    thumbnailUrl: pickThumbnail(item.snippet.thumbnails),
    channelName: item.snippet.channelTitle || "Unknown channel",
    channelId: item.snippet.channelId || "",
    publishedAt: item.snippet.publishedAt || null,
    duration: item.contentDetails?.duration || null,
    viewCount: item.statistics?.viewCount
      ? Number(item.statistics.viewCount)
      : undefined,
  };
}
