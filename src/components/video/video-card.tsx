import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Info,
  Share,
  ListPlus,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Tooltip } from "@/components/ui/tooltip";
import { DropdownMenu, type MenuItem } from "@/components/ui/menu";
import { ConfirmDialog } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { cn, formatDuration, relativeTime, truncate } from "@/lib/utils";
import type { CardDensity } from "@/lib/constants";
import type { VideoWithRelations } from "@/types/database";
import { deleteVideo, refreshVideoMetadata, updateVideoFlags, buildShareUrl, createShareLink, removeFromPlaylist } from "@/lib/api";
import { useAppData } from "@/context/app-data-context";
import { AddToPlaylistDialog } from "@/components/video/add-to-playlist-dialog";

const statusStyles: Record<string, { label: string; className: string }> = {
  watched: { label: "Watched", className: "bg-success text-white" },
  watching: { label: "Watching", className: "bg-accent text-accent-contrast" },
  unwatched: { label: "", className: "" },
};

const gridStyles: Record<
  "cozy" | "comfortable" | "compact",
  { card: string; body: string; title: string; channel: string; chip: string; tag: string; footer: string }
> = {
  cozy: {
    card: "p-4",
    body: "mt-4 gap-1.5",
    title: "text-[15px]",
    channel: "text-[12.5px]",
    chip: "text-[11px]",
    tag: "text-[11px]",
    footer: "text-[12px]",
  },
  comfortable: {
    card: "p-3",
    body: "mt-3 gap-1",
    title: "text-[13.5px]",
    channel: "text-[12px]",
    chip: "text-[10.5px]",
    tag: "text-[10.5px]",
    footer: "text-[11px]",
  },
  compact: {
    card: "p-2.5",
    body: "mt-2 gap-0.5",
    title: "text-[12.5px]",
    channel: "text-[11px]",
    chip: "text-[10px]",
    tag: "text-[10px]",
    footer: "text-[10.5px]",
  },
};

const catLimits: Record<"cozy" | "comfortable" | "compact", number> = {
  cozy: 4,
  comfortable: 3,
  compact: 2,
};

const tagLimits: Record<"cozy" | "comfortable" | "compact", number> = {
  cozy: 3,
  comfortable: 2,
  compact: 1,
};

export function VideoCard({
  video,
  density,
  removeFromPlaylistId,
}: {
  video: VideoWithRelations;
  density: CardDensity;
  /** When set (playlist page), the card menu offers removal from that playlist. */
  removeFromPlaylistId?: string;
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refresh } = useAppData();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRefresh, setConfirmRefresh] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [shareNotes, setShareNotes] = useState("");
  const [shareToken, setShareToken] = useState<string | null>(null);

  const openShare = async () => {
    setShowShare(true);
    const res = await createShareLink({ videoId: video.id });
    setShareToken(res.ok && res.data ? res.data.token : null);
  };

  const copyShareLink = async () => {
    const withNote = async (token: string) => {
      const res = await createShareLink({ videoId: video.id, note: shareNotes });
      return buildShareUrl(res.ok && res.data ? res.data.token : token);
    };
    try {
      const url = shareToken ? await withNote(shareToken) : "";
      if (!url) throw new Error("no link");
      await navigator.clipboard.writeText(url);
      toast("Link copied", { description: url });
    } catch {
      toast("Could not copy link", { variant: "error" });
    }
  };

  const status = statusStyles[video.watch_status];
  const isList = density === "list";
  const g = !isList ? gridStyles[density] : null;

  const catLimit = isList ? 4 : catLimits[density];
  const tagLimit = isList ? 3 : tagLimits[density];

  const notifyLibraryChanged = async () => {
    await refresh();
    window.dispatchEvent(new CustomEvent("bookmarker:library-changed"));
  };

  const toggleFavorite = async () => {
    const res = await updateVideoFlags({ videoId: video.id, isFavorite: !video.is_favorite });
    if (!res.ok) {
      toast("Could not update favorite", { variant: "error" });
      return;
    }
    await notifyLibraryChanged();
  };

  const toggleWatchLater = async () => {
    const res = await updateVideoFlags({ videoId: video.id, isWatchLater: !video.is_watch_later });
    if (!res.ok) {
      toast("Could not update watch later", { variant: "error" });
      return;
    }
    await notifyLibraryChanged();
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
    await notifyLibraryChanged();
  };

  const menuItems: MenuItem[] = [
    {
      label: "Open in player",
      icon: <Play className="h-4 w-4" />,
      onSelect: () => navigate(`/app/video/${video.id}`),
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
    {
      label: "Add to playlist",
      icon: <ListPlus className="h-4 w-4" />,
      onSelect: () => setShowPlaylists(true),
    },
    ...(removeFromPlaylistId
      ? [
          {
            label: "Remove from this playlist",
            icon: <ListPlus className="h-4 w-4" />,
            danger: true,
            onSelect: async () => {
              const res = await removeFromPlaylist({
                playlistId: removeFromPlaylistId!,
                videoId: video.id,
              });
              if (!res.ok) {
                toast("Could not remove from playlist", { variant: "error" });
                return;
              }
              toast("Removed from playlist", { description: truncate(video.title, 60) });
              await notifyLibraryChanged();
              window.dispatchEvent(new CustomEvent("bookmarker:playlist-changed"));
            },
          },
        ]
      : []),
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
      onSelect: () =>
        window.dispatchEvent(
          new CustomEvent("bookmarker:edit-video", { detail: { id: video.id } }),
        ),
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

  const menu = (
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
  );

  const meta = (chipClass: string) => (
    <>
      {video.categories.slice(0, catLimit).map((cat) => (
        <Link
          key={cat.id}
          to={`/app/category/${cat.slug}`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 font-medium text-secondary transition-colors hover:border-border-strong hover:text-primary",
            chipClass,
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cat.color ?? "currentColor" }} />
          {cat.name}
        </Link>
      ))}
      {video.categories.length > catLimit && (
        <span className={cn("text-muted", chipClass)}>+{video.categories.length - catLimit}</span>
      )}
      {video.tags.slice(0, tagLimit).map((tag) => (
        <Link
          key={tag.id}
          to={`/app/tag/${tag.slug}`}
          className={cn("font-medium text-accent-strong/80 transition-colors hover:text-accent-strong", chipClass)}
        >
          #{tag.name}
        </Link>
      ))}
      {video.tags.length > tagLimit && (
        <span className={cn("text-muted", chipClass)}>+{video.tags.length - tagLimit}</span>
      )}
    </>
  );

  const footer = (footerClass: string) => (
    <div className={cn("mt-auto flex items-center justify-between pt-2 text-muted", footerClass)}>
      {video.personal_notes && (
        <button
          type="button"
          onClick={() => setShowNotes(true)}
          aria-label="View notes"
          className={cn(
            "inline-flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-hover hover:text-primary",
            footerClass,
          )}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      )}
      <Tooltip content="Share video">
        <button
          type="button"
          onClick={openShare}
          aria-label="Share video"
          className={cn(
            "inline-flex h-5 w-5 items-center justify-center rounded text-accent-strong transition-colors hover:bg-hover",
            footerClass,
          )}
        >
          <Share className="h-3.5 w-3.5 fill-current" />
        </button>
      </Tooltip>
      <span className="ml-auto tabular-nums">Saved {relativeTime(video.created_at)}</span>
    </div>
  );

  const thumbnail = (className: string, playSize: string) => (
    <Link
      to={`/app/video/${video.id}`}
      className={cn("relative block overflow-hidden rounded-lg bg-sunken", className)}
      aria-label={`Play ${video.title}`}
    >
      {video.thumbnail_url ? (
        <img
          src={video.thumbnail_url}
          alt=""
          loading="lazy"
          decoding="async"
          width={640}
          height={360}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-muted">
          <Play className="h-7 w-7" />
        </div>
      )}

      {/* Play overlay */}
      <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <span className={cn("flex items-center justify-center rounded-full bg-accent text-accent-contrast shadow-pop transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100", playSize)}>
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
  );

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-elevated transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-[var(--shadow-card-hover)]",
        "focus-within:border-accent/40 motion-reduce:hover:translate-y-0",
        isList ? "flex flex-row gap-4 p-3" : cn("flex flex-col", g?.card),
      )}
    >
      {isList ? (
        <>
          {thumbnail("aspect-video w-36 shrink-0 self-center sm:w-48 lg:w-56", "h-9 w-9")}
          <div className="flex min-w-0 flex-1 flex-col gap-1 py-1">
            <div className="flex items-start justify-between gap-2">
              <Link
                to={`/app/video/${video.id}`}
                className="line-clamp-2 flex-1 text-[15px] font-semibold leading-snug text-primary transition-colors hover:text-accent-strong"
              >
                {video.title}
              </Link>
              {menu}
            </div>
            {video.channel_name && (
              <p className="truncate text-[12.5px] text-muted">{video.channel_name}</p>
            )}
            {video.description && (
              <p className="line-clamp-2 text-[12.5px] leading-relaxed text-secondary">
                {truncate(video.description, 180)}
              </p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">{meta("text-[11px]")}</div>
            {footer("text-[11px]")}
          </div>
        </>
      ) : (
        <>
          {thumbnail("aspect-video w-full", "h-11 w-11")}
          <div className={cn("flex flex-1 flex-col", g?.body)}>
            <div className="flex items-start justify-between gap-2">
              <Link
                to={`/app/video/${video.id}`}
                className={cn("line-clamp-2 flex-1 font-semibold leading-snug text-primary transition-colors hover:text-accent-strong", g?.title)}
              >
                {video.title}
              </Link>
              {menu}
            </div>
            {video.channel_name && (
              <p className={cn("truncate text-muted", g?.channel)}>{video.channel_name}</p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">{meta(g!.chip)}</div>
            {density !== "compact" && footer(g!.footer)}
          </div>
        </>
      )}

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
          await notifyLibraryChanged();
        }}
        title="Refresh metadata?"
        description="Re-fetches the title, description, thumbnail and channel info from YouTube. Your notes and organization are kept."
        confirmLabel="Refresh"
        tone="default"
      />

      <AddToPlaylistDialog
        open={showPlaylists}
        onClose={() => setShowPlaylists(false)}
        videoId={video.id}
        videoTitle={video.title}
      />

      {video.personal_notes && (
      <Dialog
        open={showNotes}
          onClose={() => setShowNotes(false)}
          title="Notes"
          description={truncate(video.title, 80)}
          size="md"
        >
          <div className="p-6 whitespace-pre-wrap text-secondary">{video.personal_notes}</div>
        </Dialog>
      )}

      <Dialog
        open={showShare}
        onClose={() => setShowShare(false)}
        title="Share"
        description={truncate(video.title, 80)}
        size="md"
      >
        <div className="p-6 space-y-4">
          <div className="aspect-video overflow-hidden rounded-lg bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${video.youtube_video_id}`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              className="h-full w-full"
              loading="lazy"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-sm text-secondary">
              {shareToken ? buildShareUrl(shareToken) : "Creating link…"}
            </span>
            <button
              type="button"
              disabled={!shareToken}
              onClick={copyShareLink}
              className="shrink-0 rounded-md bg-accent-soft px-3 py-1.5 text-[12.5px] font-medium text-accent-strong transition-colors hover:bg-accent-soft-strong disabled:opacity-50"
            >
              Copy link
            </button>
          </div>
          <div>
            <p className="mb-1.5 text-[12px] font-medium text-secondary">Note for the recipient</p>
            <textarea
              value={shareNotes}
              onChange={(e) => setShareNotes(e.target.value)}
              placeholder="Add a note — it's shown on the shared page…"
              rows={3}
              className="w-full resize-none rounded-md border border-border bg-elevated px-3 py-2 text-sm text-primary placeholder:text-muted/70 shadow-sm transition-colors hover:border-border-strong focus:border-accent/40 focus:outline-none"
            />
            <p className="mt-1.5 text-[11.5px] text-muted">
              Anyone with this link can watch the video and save it to their own account.
            </p>
          </div>
        </div>
      </Dialog>
    </article>
  );
}