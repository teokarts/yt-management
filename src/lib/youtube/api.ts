import { callEdge, EdgeFunctionError } from "@/lib/edge";

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

export async function fetchVideoMetadata(videoId: string): Promise<YouTubeMetadata> {
  let metadata: YouTubeMetadata;
  try {
    metadata = await callEdge<YouTubeMetadata>("youtube-metadata", { videoId });
  } catch (err) {
    if (err instanceof EdgeFunctionError) {
      const message = err.message;
      if (/quota/i.test(message)) throw new YouTubeApiError("quota", message);
      if (/could not be found|private|region-locked|deleted/i.test(message)) {
        throw new YouTubeApiError("not_found", message);
      }
      if (/invalid YouTube URL|valid YouTube/i.test(message)) {
        throw new YouTubeApiError("api", message);
      }
      if (/network|reach/i.test(message)) throw new YouTubeApiError("network", message);
      throw new YouTubeApiError("api", message);
    }
    throw new YouTubeApiError("network", "Could not reach the metadata service.");
  }

  return metadata;
}