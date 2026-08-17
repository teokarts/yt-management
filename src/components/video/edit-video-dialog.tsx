"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Textarea, FieldLabel } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { CategoryPicker } from "@/components/category/category-picker";
import { TagInput } from "@/components/tag/tag-input";
import type { Category, Tag, VideoWithRelations } from "@/types/database";
import {
  updateVideoNotes,
  updateVideoOrganization,
} from "@/app/actions/videos";

export function EditVideoDialog({
  open,
  onClose,
  video,
  categories,
  tags,
}: {
  open: boolean;
  onClose: () => void;
  video: VideoWithRelations;
  categories: Category[];
  tags: Tag[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [categoryIds, setCategoryIds] = useState(video.categories.map((c) => c.id));
  const [tagNames, setTagNames] = useState(video.tags.map((t) => t.name));
  const [notes, setNotes] = useState(video.personal_notes ?? "");
  const [busy, setBusy] = useState(false);

  const handleSave = async () => {
    setBusy(true);
    const [org, note] = await Promise.all([
      updateVideoOrganization({ videoId: video.id, categoryIds, tagNames }),
      updateVideoNotes({ videoId: video.id, personalNotes: notes || null }),
    ]);
    setBusy(false);
    if (!org.ok || !note.ok) {
      toast("Could not save changes", { variant: "error" });
      return;
    }
    toast("Changes saved");
    onClose();
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Edit video"
      description="Update how this video is organized."
      size="lg"
    >
      <div className="space-y-5 px-6 py-5">
        <div>
          <FieldLabel>Categories</FieldLabel>
          <CategoryPicker value={categoryIds} onChange={setCategoryIds} categories={categories} />
        </div>
        <div>
          <FieldLabel>Tags</FieldLabel>
          <TagInput value={tagNames} onChange={setTagNames} suggestions={tags} />
        </div>
        <div>
          <FieldLabel htmlFor="edit-notes">Personal notes</FieldLabel>
          <Textarea
            id="edit-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            maxLength={4000}
            placeholder="Timestamps, ideas, reminders…"
          />
        </div>
        <div className="flex justify-end gap-2.5">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} loading={busy}>
            Save changes
          </Button>
        </div>
      </div>
    </Dialog>
  );
}