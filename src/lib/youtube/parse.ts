/**
 * Extracts a YouTube video ID from common URL shapes.
 *
 * Supported formats:
 *   https://www.youtube.com/watch?v=VIDEO_ID&t=60
 *   https://youtu.be/VIDEO_ID
 *   https://www.youtube.com/shorts/VIDEO_ID
 *   https://www.youtube.com/embed/VIDEO_ID
 *   https://youtube.com/v/VIDEO_ID
 *   https://www.youtube.com/live/VIDEO_ID
 *
 * Rejects unrelated domains and malformed IDs.
 */
export function parseYouTubeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host !== "youtube.com" && host !== "youtu.be" && host !== "m.youtube.com") {
    return null;
  }

  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0] ?? "";
    return isValidId(id) ? id : null;
  }

  const path = url.pathname;
  if (path === "/watch") {
    const id = url.searchParams.get("v") ?? "";
    return isValidId(id) ? id : null;
  }

  const segments = path.split("/").filter(Boolean);
  if (segments.length >= 2) {
    const [kind, value] = segments;
    if (kind === "shorts" || kind === "embed" || kind === "live" || kind === "v") {
      const id = value?.split("/")[0] ?? "";
      return isValidId(id) ? id : null;
    }
  }

  return null;
}

const ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export function isValidId(id: string): boolean {
  return ID_PATTERN.test(id);
}
