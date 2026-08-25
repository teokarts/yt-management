import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea, FieldLabel, FieldError } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createPlaylist, updatePlaylist } from "@/lib/api";
import { useAppData } from "@/context/app-data-context";
import type { PlaylistWithCount } from "@/types/database";

export function PlaylistDialog({
  open,
  onClose,
  playlist,
}: {
  open: boolean;
  onClose: () => void;
  playlist?: PlaylistWithCount | null;
}) {
  const isEdit = Boolean(playlist);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { refresh } = useAppData();

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName(playlist?.name ?? "");
      setDescription(playlist?.description ?? "");
      setError(null);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Give the playlist a name.");
      return;
    }
    setBusy(true);
    try {
      if (isEdit && playlist) {
        const res = await updatePlaylist({ id: playlist.id, name, description });
        if (!res.ok) {
          setError(res.error ?? "Could not update playlist.");
          return;
        }
        toast("Playlist updated");
      } else {
        const res = await createPlaylist({ name, description });
        if (!res.ok) {
          setError(res.error ?? "Could not create playlist.");
          return;
        }
        toast("Playlist created", { description: name.trim() });
      }
      await refresh();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit playlist" : "New playlist"}
      description={
        isEdit ? "Update this playlist." : "Group videos into an ordered, watchable list."
      }
      size="sm"
    >
      <form onSubmit={handleSubmit} className="px-6 py-5">
        <div className="space-y-4">
          <div>
            <FieldLabel htmlFor="playlist-name">Name</FieldLabel>
            <Input
              id="playlist-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weekend watch"
              autoFocus
              maxLength={60}
            />
          </div>
          <div>
            <FieldLabel htmlFor="playlist-description">Description (optional)</FieldLabel>
            <Textarea
              id="playlist-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this playlist for?"
              rows={2}
              maxLength={300}
            />
          </div>
          <FieldError>{error}</FieldError>
        </div>

        <div className="mt-6 flex justify-end gap-2.5">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={busy}>
            {isEdit ? "Save changes" : "Create playlist"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
