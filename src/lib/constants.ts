export const APP_NAME = "Reelist";
export const APP_TAGLINE = "Your private video knowledge library";

export const PAGE_SIZE = 24;

export const WATCH_STATUSES = ["unwatched", "watching", "watched"] as const;
export type WatchStatus = (typeof WATCH_STATUSES)[number];

export const SORT_OPTIONS = [
  { value: "recently_added", label: "Recently added" },
  { value: "oldest_added", label: "Oldest added" },
  { value: "newest_video", label: "Newest video" },
  { value: "oldest_video", label: "Oldest video" },
  { value: "title_asc", label: "Title A–Z" },
  { value: "title_desc", label: "Title Z–A" },
  { value: "channel", label: "Channel" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export const DATE_FILTERS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
] as const;

export type DateFilter = (typeof DATE_FILTERS)[number]["value"];

export const CARD_DENSITIES = [
  { value: "cozy", label: "Cozy", description: "Larger thumbnails, more breathing room" },
  { value: "comfortable", label: "Comfortable", description: "Balanced grid for most screens" },
  { value: "compact", label: "Compact", description: "More videos per row" },
] as const;

export type CardDensity = (typeof CARD_DENSITIES)[number]["value"];
