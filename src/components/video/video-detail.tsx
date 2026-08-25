import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Heart,
  Clock,
  Copy,
  ExternalLink,
  RefreshCw,
  Trash2,
  Pencil,
  Calendar,
  Eye,
  Check,
  Hash,
  FolderOpen,
  StickyNote,
  ArrowLeft,
  ChevronRight,
  ListPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { VideoPlayer } from "@/components/video/video-player";
import { EditVideoDialog } from "@/components/video/edit-video-dialog";
import { AddToPlaylistDialog } from "@/components/video/add-to-playlist-dialog";
import { cn, formatDate, formatDuration } from "@/lib/utils";
import type { Category, Tag, VideoWithRelations } from "@/types/database";
import {
  deleteVideo,
  refreshVideoMetadata,
  updateVideoFlags,
  updateVideoNotes,
} from "@/lib/api";
import { useAppData } from "@/context/app-data-context";
import { getCategoryPath } from "@/lib/categories";

export function VideoDetail({
  video: videoProp,
  categories,
  tags,
  editMode,
  related,
}: {
  video: VideoWithRelations;
  categories: Category[];
  tags: Tag[];
  editMode: boolean;
  related?: VideoWithRelations[];
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refresh } = useAppData();
  // Notes and flags are edited in place. Keeping a local copy lets a save land
  // instantly without a page-level refetch, which would tear down the player.
  const [video, setVideo] = useState(videoProp);
  const [showEdit, setShowEdit] = useState(editMode);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRefresh, setConfirmRefresh] = useState(false);
  const [expandDesc, setExpandDesc] = useState(false);
  const [notesDraft, setNotesDraft] = useState(videoProp.personal_notes ?? "");
  const [notesOpen, setNotesOpen] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [busyFlag, setBusyFlag] = useState(false);
  const [showPlaylists, setShowPlaylists] = useState(false);

  useEffect(() => {
    setVideo(videoProp);
  }, [videoProp]);

  // A different video means a fresh draft; a refetch of the same one must not
  // discard what the user is currently typing.
  useEffect(() => {
    setNotesDraft(videoProp.personal_notes ?? "");
    setNotesOpen(false);
    setExpandDesc(false);
    // Deliberately keyed on the id alone: depending on personal_notes too would
    // wipe the user's in-progress draft whenever the video is refetched.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoProp.id]);

  // Sidebar counts still need to follow along, but the video page itself has
  // already been updated locally, so no library-changed event is fired here.
  const syncSidebar = () => {
    void refresh();
  };

  // For changes that come from outside (a metadata refresh rewrites title,
  // thumbnail and channel), a real refetch is the only way to pick them up.
  const notifyChanged = async () => {
    await refresh();
    window.dispatchEvent(new CustomEvent("bookmarker:library-changed"));
  };

  const toggleFavorite = async () => {
    const next = !video.is_favorite;
    setBusyFlag(true);
    setVideo((v) => ({ ...v, is_favorite: next }));
    const res = await updateVideoFlags({ videoId: video.id, isFavorite: next });
    setBusyFlag(false);
    if (!res.ok) {
      setVideo((v) => ({ ...v, is_favorite: !next }));
      return toast("Could not update", { variant: "error" });
    }
    syncSidebar();
  };

  const toggleWatchLater = async () => {
    const next = !video.is_watch_later;
    setBusyFlag(true);
    setVideo((v) => ({ ...v, is_watch_later: next }));
    const res = await updateVideoFlags({ videoId: video.id, isWatchLater: next });
    setBusyFlag(false);
    if (!res.ok) {
      setVideo((v) => ({ ...v, is_watch_later: !next }));
      return toast("Could not update", { variant: "error" });
    }
    syncSidebar();
  };

  const setStatus = async (s: "unwatched" | "watching" | "watched") => {
    const prev = video.watch_status;
    setVideo((v) => ({ ...v, watch_status: s }));
    const res = await updateVideoFlags({ videoId: video.id, watchStatus: s });
    if (!res.ok) {
      setVideo((v) => ({ ...v, watch_status: prev }));
      return toast("Could not update status", { variant: "error" });
    }
    syncSidebar();
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(video.youtube_url);
      toast("Link copied");
    } catch {
      toast("Could not copy link", { variant: "error" });
    }
  };

  const handleDelete = async () => {
    const res = await deleteVideo({ videoId: video.id });
    if (!res.ok) return toast("Could not delete video", { variant: "error" });
    toast("Video removed");
    await refresh();
    navigate("/app");
  };

  const saveNotes = async () => {
    const saved = notesDraft || null;
    setSavingNotes(true);
    const res = await updateVideoNotes({ videoId: video.id, personalNotes: saved });
    setSavingNotes(false);
    if (!res.ok) return toast("Could not save notes", { variant: "error" });
    setVideo((v) => ({ ...v, personal_notes: saved }));
    setNotesOpen(false);
    toast("Notes saved");
  };

  const renderDescription = () => {
    const text = video.description ?? "";
    if (!text) return null;
    const visible = expandDesc ? text : text.length > 400 ? `${text.slice(0, 400)}…` : text;
    return (
      <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-secondary">
        {visible.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
          /^https?:\/\//.test(part) ? (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-accent-strong underline-offset-2 hover:underline"
            >
              {part}
            </a>
          ) : (
            <span key={i}>{part}</span>
          ),
        )}
        {!expandDesc && text.length > 400 && (
          <button
            type="button"
            onClick={() => setExpandDesc(true)}
            className="ml-1 font-medium text-accent-strong hover:underline"
          >
            Show more
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8">
      <Link
        to="/app"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to library
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Player + description */}
        <div className="min-w-0">
          <VideoPlayer videoId={video.youtube_video_id} title={video.title} />

          {/* Action bar */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleFavorite}
              disabled={busyFlag}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all",
                video.is_favorite
                  ? "border-transparent bg-danger-soft text-danger"
                  : "border-border text-secondary hover:border-border-strong hover:text-primary",
              )}
            >
              <Heart className={cn("h-4 w-4", video.is_favorite && "fill-current")} />
              {video.is_favorite ? "Favorited" : "Favorite"}
            </button>
            <button
              type="button"
              onClick={toggleWatchLater}
              disabled={busyFlag}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all",
                video.is_watch_later
                  ? "border-transparent bg-accent-soft text-accent-strong"
                  : "border-border text-secondary hover:border-border-strong hover:text-primary",
              )}
            >
              <Clock className="h-4 w-4" />
              {video.is_watch_later ? "In watch later" : "Watch later"}
            </button>
            <button
              type="button"
              onClick={() => setShowPlaylists(true)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-[13px] font-medium text-secondary transition-all hover:border-border-strong hover:text-primary"
            >
              <ListPlus className="h-4 w-4" /> Playlist
            </button>
            <button
              type="button"
              onClick={copyUrl}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-[13px] font-medium text-secondary transition-all hover:border-border-strong hover:text-primary"
            >
              <Copy className="h-4 w-4" /> Copy link
            </button>
            <a
              href={video.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-[13px] font-medium text-secondary transition-all hover:border-border-strong hover:text-primary"
            >
              <ExternalLink className="h-4 w-4" /> Open on YouTube
            </a>
            <div className="flex-1" />
            <Button variant="ghost" size="sm" onClick={() => setConfirmRefresh(true)}>
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowEdit(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-danger hover:bg-danger/10 hover:text-danger"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>

          {/* Title + meta */}
          <h1 className="mt-5 font-display text-2xl font-bold leading-tight tracking-tight text-primary md:text-[26px]">
            {video.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-muted">
            {video.channel_name && (
              <span className="font-medium text-secondary">{video.channel_name}</span>
            )}
            {video.published_at && (
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> Published {formatDate(video.published_at)}
              </span>
            )}
            {video.duration && (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                <Eye className="h-3.5 w-3.5" /> {formatDuration(video.duration)}
              </span>
            )}
            <span className="tabular-nums">Saved {formatDate(video.created_at)}</span>
          </div>

          {/* Status */}
          <div className="mt-5">
            <p className="mb-1.5 text-[12px] font-medium text-muted">Watch status</p>
            <div className="grid w-full max-w-xs grid-cols-3 gap-1 rounded-md border border-border bg-sunken p-1">
              {(["unwatched", "watching", "watched"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    "flex items-center justify-center gap-1 rounded px-2 py-1.5 text-[12.5px] font-medium capitalize transition-colors",
                    video.watch_status === s
                      ? "bg-accent text-accent-contrast"
                      : "text-secondary hover:text-primary",
                  )}
                >
                  {video.watch_status === s && <Check className="h-3 w-3" />}
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          {video.description && (
            <div className="mt-6 rounded-xl border border-border bg-elevated p-5">
              <h2 className="mb-2 font-display text-sm font-semibold text-primary">Description</h2>
              {renderDescription()}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Organization */}
          <section className="rounded-xl border border-border bg-elevated p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-primary">
              <FolderOpen className="h-4 w-4 text-muted" /> Categories
            </h2>
            {video.categories.length === 0 ? (
              <p className="text-[13px] text-muted">
                No categories assigned.{" "}
                <button
                  type="button"
                  onClick={() => setShowEdit(true)}
                  className="font-medium text-accent-strong hover:underline"
                >
                  Organize
                </button>
              </p>
            ) : (
              <ul className="space-y-2">
                {video.categories.map((cat) => {
                  const path = getCategoryPath(cat.id, categories);
                  const chain = path.length > 0 ? path : [cat];
                  return (
                    <li key={cat.id} className="flex flex-wrap items-center gap-x-1 gap-y-1">
                      {chain.map((node, i) => {
                        const isLeaf = i === chain.length - 1;
                        return (
                          <span key={node.id} className="inline-flex items-center gap-1">
                            {i > 0 && (
                              <ChevronRight className="h-3 w-3 shrink-0 text-muted" aria-hidden />
                            )}
                            <Link
                              to={`/app/category/${node.slug}`}
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px] transition-colors",
                                isLeaf
                                  ? "border-border font-medium text-secondary hover:border-border-strong hover:text-primary"
                                  : "border-transparent bg-sunken font-normal text-muted hover:text-secondary",
                              )}
                            >
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: node.color ?? "currentColor" }}
                              />
                              {node.name}
                            </Link>
                          </span>
                        );
                      })}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-border bg-elevated p-5">
            <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-primary">
              <Hash className="h-4 w-4 text-muted" /> Tags
            </h2>
            {video.tags.length === 0 ? (
              <p className="text-[13px] text-muted">
                No tags yet.{" "}
                <button
                  type="button"
                  onClick={() => setShowEdit(true)}
                  className="font-medium text-accent-strong hover:underline"
                >
                  Add tags
                </button>
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {video.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    to={`/app/tag/${tag.slug}`}
                    className="rounded-full bg-accent-soft px-2.5 py-1 text-[12.5px] font-medium text-accent-strong transition-colors hover:bg-accent-soft-strong"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Notes */}
          <section className="rounded-xl border border-border bg-elevated p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-primary">
                <StickyNote className="h-4 w-4 text-muted" /> Notes
              </h2>
              <button
                type="button"
                onClick={() => setNotesOpen((v) => !v)}
                className="text-[12px] font-medium text-accent-strong hover:underline"
              >
                {notesOpen ? "Hide" : "Edit"}
              </button>
            </div>
            {notesOpen ? (
              <div className="space-y-2.5">
                <Textarea
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  placeholder="Your thoughts on this video…"
                  rows={5}
                  maxLength={4000}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setNotesDraft(video.personal_notes ?? "");
                      setNotesOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button size="sm" onClick={saveNotes} loading={savingNotes}>
                    Save notes
                  </Button>
                </div>
              </div>
            ) : video.personal_notes ? (
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-secondary">
                {video.personal_notes}
              </p>
            ) : (
              <p className="text-[13px] text-muted">
                Add private notes — timestamps, ideas, things to try. They&apos;re searchable.
              </p>
            )}
          </section>
        </div>
      </div>

      {/* Related */}
      {related && related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 font-display text-lg font-semibold text-primary">
            Related in your library
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {related.map((r) => (
              <Link
                key={r.id}
                to={`/app/video/${r.id}`}
                className="group flex gap-3 rounded-lg border border-border bg-elevated p-2.5 transition-colors hover:border-border-strong"
              >
                <div className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-md bg-sunken">
                  {r.thumbnail_url ? (
                    <img
                      src={r.thumbnail_url}
                      alt=""
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : null}
                  {r.duration && (
                    <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 py-0.5 font-mono text-[10px] text-white">
                      {formatDuration(r.duration)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-[13px] font-medium leading-snug text-primary">
                    {r.title}
                  </p>
                  <p className="mt-1 truncate text-[11.5px] text-muted">
                    {r.channel_name ?? "Unknown channel"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <AddToPlaylistDialog
        open={showPlaylists}
        onClose={() => setShowPlaylists(false)}
        videoId={video.id}
        videoTitle={video.title}
      />

      {/* Edit dialog */}
      <EditVideoDialog
        open={showEdit}
        onClose={() => {
          setShowEdit(false);
          navigate(`/app/video/${video.id}`, { replace: true });
        }}
        video={video}
        categories={categories}
        tags={tags}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete this video?"
        description="This video will be removed from your library. This can't be undone."
        confirmLabel="Delete video"
      />
      <ConfirmDialog
        open={confirmRefresh}
        onClose={() => setConfirmRefresh(false)}
        onConfirm={async () => {
          const res = await refreshVideoMetadata({ videoId: video.id });
          if (!res.ok) return toast("Could not refresh metadata", { description: res.error, variant: "error" });
          toast("Metadata refreshed");
          await notifyChanged();
        }}
        title="Refresh metadata?"
        description="Re-fetches title, description, thumbnail and channel info from YouTube. Notes and organization are kept."
        confirmLabel="Refresh"
        tone="default"
      />
    </div>
  );
}