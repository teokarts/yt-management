import { useEffect, useState } from "react";
import { ListPlus, Plus, Check } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, FieldError } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { supabase } from "@/lib/supabase";
import { addToPlaylist, removeFromPlaylist, createPlaylist } from "@/lib/api";
import { fetchVideoPlaylistIds } from "@/lib/playlists";
import { useAppData } from "@/context/app-data-context";
import { cn } from "@/lib/utils";
import type { PlaylistWithCount } from "@/types/database";

export function AddToPlaylistDialog({
  open,
  onClose,
  videoId,
  videoTitle,
}: {
  open: boolean;
  onClose: () => void;
  videoId: string;
  videoTitle: string;
}) {
  const { playlists, refresh } = useAppData();
  const { toast } = useToast();
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoaded(false);
    (async () => {
      const ids = await fetchVideoPlaylistIds(supabase, (await supabase.auth.getUser()).data.user!.id, videoId);
      if (!active) return;
      setMemberIds(new Set(ids));
      setLoaded(true);
    })();
    return () => {
      active = false;
    };
  }, [open, videoId]);

  const toggle = async (playlist: PlaylistWithCount) => {
    const isMember = memberIds.has(playlist.id);
    setBusyIds((prev) => new Set(prev).add(playlist.id));
    // Optimistic flip; rolled back on failure.
    setMemberIds((prev) => {
      const next = new Set(prev);
      if (isMember) next.delete(playlist.id);
      else next.add(playlist.id);
      return next;
    });
    const res = isMember
      ? await removeFromPlaylist({ playlistId: playlist.id, videoId })
      : await addToPlaylist({ playlistId: playlist.id, videoId });
    setBusyIds((prev) => {
      const next = new Set(prev);
      next.delete(playlist.id);
      return next;
    });
    if (!res.ok) {
      setMemberIds((prev) => {
        const next = new Set(prev);
        if (isMember) next.add(playlist.id);
        else next.delete(playlist.id);
        return next;
      });
      return toast("Could not update playlist", { variant: "error" });
    }
    void refresh();
  };

  const handleCreate = async () => {
    setError(null);
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await createPlaylist({ name: newName });
      if (!res.ok || !res.data) {
        setError(res.error ?? "Could not create playlist.");
        return;
      }
      await refresh();
      const addRes = await addToPlaylist({ playlistId: res.data.id, videoId });
      if (!addRes.ok) {
        toast("Playlist created, but the video could not be added", { variant: "error" });
      } else {
        setMemberIds((prev) => new Set(prev).add(res.data!.id));
        toast("Video added", { description: `${videoTitle} → ${newName.trim()}` });
      }
      setNewName("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add to playlist"
      description={videoTitle}
      size="sm"
    >
      <div className="px-6 py-5">
        {!loaded ? (
          <p className="py-4 text-sm text-muted">Loading…</p>
        ) : playlists.length === 0 ? (
          <p className="py-2 text-ui text-muted">
            You have no playlists yet. Create your first one below.
          </p>
        ) : (
          <ul className="-mx-2 space-y-0.5">
            {playlists.map((p) => {
              const member = memberIds.has(p.id);
              const busy = busyIds.has(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => toggle(p)}
                    disabled={busy}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-ui transition-colors hover:bg-hover disabled:opacity-50"
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                        member
                          ? "border-accent bg-accent text-accent-contrast"
                          : "border-border-strong bg-transparent",
                      )}
                    >
                      {member && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-secondary">{p.name}</span>
                    <span className="font-mono text-micro tabular-nums text-muted">
                      {p.video_count}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sunken text-muted">
              <ListPlus className="h-4 w-4" />
            </span>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              placeholder="New playlist name…"
              maxLength={60}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreate}
              loading={creating}
              disabled={!newName.trim()}
              aria-label="Create playlist and add video"
            >
              {!creating && <Plus className="h-4 w-4" />}
              New
            </Button>
          </div>
          <FieldError>{error}</FieldError>
        </div>
      </div>
    </Dialog>
  );
}
