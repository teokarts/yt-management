import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ListVideo, Pencil, Trash2, ArrowLeft, MoreHorizontal, ArrowUpDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  fetchPlaylistBySlug,
  loadPlaylistVideos,
} from "@/lib/playlists";
import { deletePlaylist } from "@/lib/api";
import { PlaylistDialog } from "@/components/playlist/playlist-dialog";
import { VideoGrid } from "@/components/video/video-grid";
import { SortablePlaylistList } from "@/components/video/sortable-playlist-list";
import { PageLoader } from "@/components/library/page-loader";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm";
import { DropdownMenu, type MenuItem } from "@/components/ui/menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAppData } from "@/context/app-data-context";
import type { CardDensity } from "@/lib/constants";
import type { PlaylistWithCount, VideoWithRelations } from "@/types/database";

export function PlaylistPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refresh } = useAppData();

  const [playlist, setPlaylist] = useState<PlaylistWithCount | null>(null);
  const [videos, setVideos] = useState<VideoWithRelations[]>([]);
  const [density, setDensity] = useState<CardDensity>("comfortable");
  const [notFound, setNotFound] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reordering, setReordering] = useState(false);

  const loadData = useCallback(async () => {
    if (!slug) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const pl = await fetchPlaylistBySlug(supabase, user.id, slug);
    if (!pl) {
      setNotFound(true);
      return;
    }
    const vids = await loadPlaylistVideos(supabase, user.id, pl.id);
    setPlaylist({ ...pl, video_count: vids.length });
    setVideos(vids);

    const { data: profile } = await supabase
      .from("profiles")
      .select("card_density")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.card_density) setDensity(profile.card_density as CardDensity);
  }, [slug]);

  useEffect(() => {
    let active = true;
    setNotFound(false);
    setPlaylist(null);
    setVideos([]);
    loadData().catch(() => {
      if (active) setNotFound(true);
    });
    // Removals happen inside the card menu; the card announces them so the
    // ordered list here can re-render without a full navigation.
    const onChanged = () => void loadData();
    window.addEventListener("bookmarker:playlist-changed", onChanged);
    return () => {
      active = false;
      window.removeEventListener("bookmarker:playlist-changed", onChanged);
    };
  }, [loadData]);

  // Keep the sidebar count in sync after edits made through the dialog.
  useEffect(() => {
    if (!showEdit) void refresh();
  }, [showEdit, refresh]);

  if (notFound)
    return (
      <EmptyState
        icon={<ListVideo className="h-6 w-6" />}
        title="Playlist not found"
        description="This playlist may have been deleted."
      />
    );

  if (!playlist) return <PageLoader />;

  const menuItems: MenuItem[] = [
    {
      label: "Rename",
      icon: <Pencil className="h-4 w-4" />,
      onSelect: () => setShowEdit(true),
    },
    {
      label: "Delete playlist",
      icon: <Trash2 className="h-4 w-4" />,
      danger: true,
      onSelect: () => setConfirmDelete(true),
    },
  ];

  const handleDelete = async () => {
    const res = await deletePlaylist({ id: playlist.id });
    if (!res.ok) return toast("Could not delete playlist", { variant: "error" });
    toast("Playlist deleted", { description: playlist.name });
    await refresh();
    navigate("/app");
  };

  // Leaving reorder mode re-fetches so the grid reflects the persisted order.
  const toggleReorder = () => {
    const next = !reordering;
    setReordering(next);
    if (!next) void loadData();
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8">
      <Link
        to="/app"
        className="mb-5 inline-flex items-center gap-1.5 text-ui text-muted transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to library
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
              <ListVideo className="h-5 w-5" />
            </span>
            <h1 className="truncate font-display text-2xl font-bold tracking-tight text-primary md:text-[26px]">
              {playlist.name}
            </h1>
          </div>
          <p className="mt-2 text-ui text-muted">
            {playlist.video_count === 0
              ? "Empty playlist"
              : playlist.video_count === 1
                ? "1 video"
                : `${playlist.video_count} videos · use Reorder to rearrange them`}
          </p>
          {playlist.description && (
            <p className="mt-1 max-w-2xl text-ui leading-relaxed text-secondary">
              {playlist.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {videos.length > 1 && (
            <Button
              variant={reordering ? "primary" : "secondary"}
              size="sm"
              onClick={toggleReorder}
            >
              <ArrowUpDown className="h-4 w-4" />
              {reordering ? "Done" : "Reorder"}
            </Button>
          )}
          <DropdownMenu
            label={`Actions for ${playlist.name}`}
            trigger={({ open, toggle }) => (
              <button
                type="button"
                data-menu-trigger
                onClick={toggle}
                aria-label="Playlist actions"
                aria-haspopup="menu"
                aria-expanded={open}
                className="rounded-md p-2 text-muted transition-colors hover:bg-hover hover:text-primary"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            )}
            items={menuItems}
          />
        </div>
      </div>

      <div className="mt-8">
        {videos.length === 0 ? (
          <EmptyState
            icon={<ListVideo className="h-6 w-6" />}
            title="No videos yet"
            description="Open a video in your library and choose “Add to playlist” from its menu."
          />
        ) : reordering ? (
          <SortablePlaylistList key="reorder" playlistId={playlist.id} videos={videos} />
        ) : (
          <VideoGrid
            videos={videos}
            density={density}
            removeFromPlaylistId={playlist.id}
            key={videos.map((v) => v.id).join("|")}
          />
        )}
      </div>

      <PlaylistDialog
        open={showEdit}
        onClose={() => setShowEdit(false)}
        playlist={playlist}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete this playlist?"
        description="The playlist will be removed. Your videos stay in the library."
      confirmLabel="Delete playlist"
    />
  </div>
);
}
