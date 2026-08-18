// YouTube Data API v3 proxy.
//
// Keeps YOUTUBE_API_KEY server-side. The browser calls this function
// instead of Google directly. Input: { videoId }. Output: YouTubeMetadata.
//
// Deploy: supabase functions deploy youtube-metadata

interface YouTubeMetadata {
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

const API_BASE = "https://www.googleapis.com/youtube/v3";
const ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

function pickThumbnail(thumbnails: Record<string, { url: string }> | undefined): string {
  if (!thumbnails) return "";
  const order = ["maxres", "standard", "high", "medium", "default"] as const;
  for (const size of order) {
    const t = thumbnails[size];
    if (t?.url) return t.url;
  }
  return "";
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  const apiKey = Deno.env.get("YOUTUBE_API_KEY");
  if (!apiKey) {
    return json({ error: "YouTube API key is not configured." }, 500);
  }

  let body: { videoId?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const videoId = body.videoId?.trim() ?? "";
  if (!ID_PATTERN.test(videoId)) {
    return json({ error: "That doesn't look like a valid YouTube URL." }, 400);
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
    });
  } catch {
    return json({ error: "Could not reach the YouTube API." }, 502);
  }

  if (response.status === 403 || response.status === 429) {
    return json(
      { error: "The YouTube API quota has been exceeded for today. Try again later." },
      429,
    );
  }

  if (!response.ok) {
    return json({ error: `YouTube API returned status ${response.status}.` }, 502);
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
    return json({ error: "YouTube API returned malformed JSON." }, 502);
  }

  if (data.error?.message) {
    return json({ error: data.error.message }, 502);
  }

  const item = data.items?.[0];
  if (!item?.id || !item.snippet?.title) {
    return json(
      { error: "This video could not be found. It may be private, region-locked, or deleted." },
      404,
    );
  }

  const metadata: YouTubeMetadata = {
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

  return json(metadata);
});