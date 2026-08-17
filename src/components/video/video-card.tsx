"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play,
  Heart,
  Clock,
  Check,
  EllipsisVertical,
  ExternalLink,
  Link2,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  StickyNote,
} from "lucide-react";
import { DropdownMenu, type MenuItem } from "@/components/ui/menu";
import { ConfirmDialog } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { cn, formatDuration, relativeTime, truncate } from "@/lib/utils";
import type { VideoWithRelations } from "@/types/database";
import {
  deleteVideo,
  refreshVideoMetadata,
  updateVideoFlags,
} from "@/app/actions/videos";

const statusStyles: Record<string, { label: string; className: string }> = {
  watched: { label: "Watched", className: "bg-success text-white" },
  watching: { label: "Watching", className: "bg-accent text-accent-contrast" },
  unwatched: { label: "", className: "" },
};

export function VideoCard({
  video,
  compact,
}: {
  video: VideoWithRelations;
  compact?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRefresh, setConfirmRefresh] = useState(false);

  const status = statusStyles[video.watch_status];

  const toggleFavorite = async () => {
    const res = await updateVideoFlags({ videoId: video.id, isFavorite: !video.is_favorite });
    if (!res.ok) {
      toast("Could not update favorite", { variant: "error" });
      return;
    }
    router.refresh();
  };

  const toggleWatchLater = async () => {
    const res = await updateVideoFlags({ videoId: video.id, isWatchLater: !video.is_watch_later });
    if (!res.ok) {
      toast("Could not update watch later", { variant: "error" });
      return;
    }
    router.refresh();
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(video.youtube_url);
      toast("Link copied", { description: video.youtube_url });
    } catch {
      toast("Could not copy link", { variant: "error" });
    }
  };

  const handleDelete = async () => {
    const res = await deleteVideo({ videoId: video.id });
    if (!res.ok) {
      toast("Could not delete video", { variant: "error" });
      return;
    }
    toast("Video removed", { description: truncate(video.title, 60) });
    router.refresh();
  };

  const menuItems: MenuItem[] = [
    {
      label: "Open in player",
      icon: <Play className="h-4 w-4" />,
      onSelect: () => router.push(`/app/video/${video.id}`),
    },
    {
      label: video.is_favorite ? "Remove from favorites" : "Add to favorites",
      icon: <Heart className={cn("h-4 w-4", video.is_favorite && "fill-danger text-danger")} />,
      onSelect: toggleFavorite,
    },
    {
      label: video.is_watch_later ? "Remove from watch later" : "Add to watch later",
      icon: <Clock className="h-4 w-4" />,
      onSelect: toggleWatchLater,
    },
    { separator: true },
    {
      label: "Copy YouTube link",
      icon: <Link2 className="h-4 w-4" />,
      onSelect: copyUrl,
    },
    {
      label: "Open on YouTube",
      icon: <ExternalLink className="h-4 w-4" />,
      onSelect: () => window.open(video.youtube_url, "_blank", "noopener,noreferrer"),
    },
    { separator: true },
    {
      label: "Edit details",
      icon: <Pencil className="h-4 w-4" />,
      onSelect: () => router.push(`/app/video/${video.id}?edit=1`),
    },
    {
      label: "Refresh metadata",
      icon: <RefreshCw className="h-4 w-4" />,
      onSelect: () => setConfirmRefresh(true),
    },
    { separator: true },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      danger: true,
      onSelect: () => setConfirmDelete(true),
    },
  ];

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border border-border bg-elevated transition-all duration-200 hover:border-border-strong hover:shadow-elevated",
        compact ? "p-2.5" : "p-3",
      )}
    >
      {/* Thumbnail */}
      <Link
        href={`/app/video/${video.id}`}
        className="relative block aspect-video w-full overflow-hidden rounded-md bg-sunken"
        aria-label={`Play ${video.title}`}
      >
        {video.thumbnail_url ? (
          <Image
            src={video.thumbnail_url}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 320px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            unoptimized={false}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">
            <Play className="h-7 w-7" />
          </div>
        )}

        {/* Play overlay */}
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/30 group-hover:opacity-100">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-contrast shadow-pop">
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </span>
        </span>

        {video.duration && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 font-mono text-[11px] font-medium text-white">
            {formatDuration(video.duration)}
          </span>
        )}

        {status.label && (
          <span
            className={cn(
              "absolute left-1.5 top-1.5 flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold",
              status.className,
            )}
          >
            {video.watch_status === "watching" ? <Eye className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            {status.label}
          </span>
        )}

        {video.is_favorite && (
          <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-danger">
            <Heart className="h-3.5 w-3.5 fill-current" />
          </span>
        )}
      </Link>

      {/* Body */}
      <div className={cn("flex flex-1 flex-col", compact ? "mt-2 gap-1" : "mt-3 gap-1")}>
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/app/video/${video.id}`}
            className="line-clamp-2 flex-1 text-[13.5px] font-semibold leading-snug text-primary transition-colors hover:text-accent-strong"
          >
            {video.title}
          </Link>
          <DropdownMenu
            label={`Actions for ${video.title}`}
            trigger={({ open, toggle }) => (
              <button
                type="button"
                data-menu-trigger
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggle();
                }}
                aria-label="More actions"
                aria-expanded={open}
                className={cn(
                  "rounded-md p-1 text-muted transition-colors hover:bg-hover hover:text-primary",
                  open && "bg-hover text-primary",
                )}
              >
                <EllipsisVertical className="h-4 w-4" />
              </button>
            )}
            items={menuItems}
          />
        </div>

        {video.channel_name && (
          <p className="truncate text-[12px] text-muted">{video.channel_name}</p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {video.categories.slice(0, 3).map((cat) => (
            <Link
              key={cat.id}
              href={`/app/category/${cat.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[10.5px] font-medium text-secondary transition-colors hover:border-border-strong hover:text-primary"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cat.color ?? "currentColor" }} />
              {cat.name}
            </Link>
          ))}
          {video.categories.length > 3 && (
            <span className="text-[10.5px] text-muted">+{video.categories.length - 3}</span>
          )}
          {video.tags.slice(0, 2).map((tag) => (
            <Link
              key={tag.id}
              href={`/app/tag/${tag.slug}`}
              className="text-[10.5px] font-medium text-accent-strong/80 transition-colors hover:text-accent-strong"
            >
              #{tag.name}
            </Link>
          ))}
          {video.tags.length > 2 && (
            <span className="text-[10.5px] text-muted">+{video.tags.length - 2}</span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-2 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1">
            {video.personal_notes && <StickyNote className="h-3 w-3" />}
            {video.categories.length + video.tags.length > 0
              ? `${video.categories.length} cat${video.categories.length === 1 ? "" : "s"} · ${video.tags.length} tag${video.tags.length === 1 ? "" : "s"}`
              : "Unorganized"}
          </span>
          <span className="tabular-nums">Saved {relativeTime(video.created_at)}</span>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete this video?"
        description={
          <>
            “{truncate(video.title, 80)}” will be removed from your library. Categories and tags
            are unaffected.
          </>
        }
        confirmLabel="Delete video"
      />
      <ConfirmDialog
        open={confirmRefresh}
        onClose={() => setConfirmRefresh(false)}
        onConfirm={async () => {
          const res = await refreshVideoMetadata({ videoId: video.id });
          if (!res.ok) {
            toast("Could not refresh metadata", { description: res.error, variant: "error" });
            return;
          }
          toast("Metadata refreshed");
          router.refresh();
        }}
        title="Refresh metadata?"
        description="Re-fetches the title, description, thumbnail and channel info from YouTube. Your notes and organization are kept."
        confirmLabel="Refresh"
        tone="default"
      />
    </article>
  );
}