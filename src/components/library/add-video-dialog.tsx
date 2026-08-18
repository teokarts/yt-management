import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Check,
  Clock,
  Heart,
  Link2,
  Play,
  Plus,
  RefreshCw,
  User,
  X,
} from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input, Textarea, FieldLabel, FieldError } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { CategoryPicker } from "@/components/category/category-picker";
import { TagInput } from "@/components/tag/tag-input";
import { addVideo, getYouTubeMetadata, updateVideoOrganization, createCategory } from "@/lib/api";
import { useAppData } from "@/context/app-data-context";
import type { YouTubeMetadata } from "@/lib/youtube/api";
import { formatDuration, formatDate, slugify, cn } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/icons";
import { buildParentOptions } from "@/lib/categories";
import type { Category, Tag, VideoWithRelations, WatchStatus } from "@/types/database";

interface AddVideoDialogProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  tags: Tag[];
}

type Stage = "url" | "loading" | "preview" | "saving";

export function AddVideoDialog({ open, onClose, categories, tags }: AddVideoDialogProps) {
  const { refresh } = useAppData();
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>("url");
  const [url, setUrl] = useState("");
  const [metadata, setMetadata] = useState<YouTubeMetadata | null>(null);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [tagNames, setTagNames] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [watchStatus, setWatchStatus] = useState<WatchStatus>("unwatched");
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<VideoWithRelations | null>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const [editingDuplicate, setEditingDuplicate] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(CATEGORY_COLORS[0]);
  const [newCatParentId, setNewCatParentId] = useState<string | null>(null);
  const [creatingCat, setCreatingCat] = useState(false);
  const [localCategories, setLocalCategories] = useState<Category[]>([]);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setStage("url");
      setUrl("");
      setMetadata(null);
      setError(null);
      setDuplicate(null);
      setCategoryIds([]);
      setTagNames([]);
      setNotes("");
      setIsFavorite(false);
      setIsWatchLater(false);
      setWatchStatus("unwatched");
      setEditingDuplicate(false);
      setShowNewCategory(false);
      setNewCatName("");
      setNewCatParentId(null);
    }
  }

  useEffect(() => {
    if (open) {
      setTimeout(() => urlRef.current?.focus(), 50);
    }
  }, [open]);

  const handleFetch = async () => {
    if (!url.trim()) {
      setError("Paste a YouTube URL to get started.");
      return;
    }
    setStage("loading");
    setError(null);
    const res = await getYouTubeMetadata({ youtubeUrl: url });
    if (!res.ok || !res.data) {
      setStage("url");
      setError(res.error ?? "Could not load this video.");
      return;
    }
    setMetadata(res.data);
    setStage("preview");
  };

  const allCategories = [
    ...localCategories,
    ...categories.filter((c) => !localCategories.some((l) => l.id === c.id)),
  ];

  const parentOptions = buildParentOptions(allCategories);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || creatingCat) return;
    setCreatingCat(true);
    setError(null);
    const res = await createCategory({
      name: newCatName.trim(),
      color: newCatColor,
      parentId: newCatParentId,
    });
    setCreatingCat(false);
    if (!res.ok || !res.data) {
      toast(res.error ?? "Could not create category.", { variant: "error" });
      return;
    }
    const newCat: Category = {
      id: res.data.id,
      user_id: "",
      name: newCatName.trim(),
      slug: slugify(newCatName),
      description: null,
      icon: null,
      color: newCatColor,
      parent_id: newCatParentId,
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setLocalCategories((prev) => [...prev, newCat]);
    setCategoryIds((prev) => [...prev, newCat.id]);
    const parentName = newCatParentId
      ? allCategories.find((c) => c.id === newCatParentId)?.name
      : null;
    setNewCatName("");
    setNewCatParentId(null);
    setShowNewCategory(false);
    toast(parentName ? "Subcategory created" : "Category created", {
      description: parentName ? `${parentName} → ${newCat.name}` : newCat.name,
    });
    refresh();
  };

  const handleSave = async () => {
    if (!metadata) return;
    setStage("saving");
    setError(null);
    const res = await addVideo({
      youtubeUrl: url,
      categoryIds,
      tagNames,
      personalNotes: notes || null,
      isFavorite,
      isWatchLater,
      watchStatus,
    });

    if (!res.ok) {
      if (res.code === "duplicate" && res.data?.duplicate) {
        setDuplicate(res.data.duplicate);
        setCategoryIds(res.data.duplicate.categories.map((c) => c.id));
        setTagNames(res.data.duplicate.tags.map((t) => t.name));
        setStage("preview");
        return;
      }
      setStage("preview");
      setError(res.error ?? "Could not save this video.");
      return;
    }

    toast("Video saved", { description: metadata.title });
    onClose();
    await refresh();
    window.dispatchEvent(new CustomEvent("bookmarker:library-changed"));
  };

  const handleDuplicateUpdate = async () => {
    if (!duplicate) return;
    setStage("saving");
    const res = await updateVideoOrganization({
      videoId: duplicate.id,
      categoryIds,
      tagNames,
    });
    setStage("preview");
    if (!res.ok) {
      setError(res.error ?? "Could not update this video.");
      return;
    }
    toast("Video updated", { description: duplicate.title });
    onClose();
    await refresh();
    window.dispatchEvent(new CustomEvent("bookmarker:library-changed"));
  };

  const canSave = metadata != null;

  return (
    <Dialog
      open={open}
      onClose={stage === "loading" || stage === "saving" ? () => {} : onClose}
      title={duplicate ? "Already in your library" : "Add a video"}
      description={
        duplicate
          ? "This video is already saved. You can update its organization below."
          : "Paste a YouTube link and organize it your way."
      }
      size="xl"
    >
      <div className="flex min-h-[480px] flex-col md:flex-row">
        {/* Left: URL + metadata */}
        <div className="flex-1 border-b border-border p-6 md:border-b-0 md:border-r">
          {stage === "url" || stage === "loading" ? (
            <div className="flex h-full flex-col">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleFetch();
                }}
                className="space-y-3"
              >
                <FieldLabel htmlFor="add-url">YouTube URL</FieldLabel>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <Input
                      id="add-url"
                      ref={urlRef}
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        setError(null);
                      }}
                      placeholder="https://www.youtube.com/watch?v=…"
                      className="pl-9"
                      disabled={stage === "loading"}
                    />
                  </div>
                  <Button type="submit" variant="primary" loading={stage === "loading"}>
                    {stage === "loading" ? "Fetching…" : "Fetch"}
                  </Button>
                </div>
                <FieldError>{error}</FieldError>
                <p className="text-xs leading-relaxed text-muted">
                  Works with youtube.com/watch, youtu.be, shorts, embed and live links.
                </p>
              </form>

              <div className="mt-8 flex-1 space-y-3" aria-hidden="true">
                <div className="aspect-video w-full rounded-lg bg-elevated" />
                <div className="h-4 w-3/4 rounded bg-elevated" />
                <div className="h-3 w-1/2 rounded bg-elevated" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-sunken">
                {metadata?.thumbnailUrl ? (
                  <img
                    src={metadata.thumbnailUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-elevated text-muted">
                    <Play className="h-8 w-8" />
                  </div>
                )}
                {metadata?.duration && (
                  <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 font-mono text-xs text-white">
                    {formatDuration(metadata.duration)}
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-display text-[15px] font-semibold leading-snug text-primary">
                  {metadata?.title}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted">
                  {metadata?.channelName && (
                    <span className="inline-flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" />
                      {metadata.channelName}
                    </span>
                  )}
                  {metadata?.publishedAt && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(metadata.publishedAt)}
                    </span>
                  )}
                  {metadata?.viewCount !== undefined && (
                    <span className="inline-flex items-center gap-1.5">
                      <Play className="h-3 w-3" />
                      {(metadata.viewCount / 1000).toFixed(1)}k views
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setIsFavorite((v) => !v)}
                  aria-pressed={isFavorite}
                  className={
                    isFavorite
                      ? "inline-flex items-center gap-1.5 rounded-full border border-transparent bg-danger-soft px-3 py-1.5 text-[12.5px] font-medium text-danger"
                      : "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12.5px] font-medium text-secondary hover:border-border-strong hover:text-primary"
                  }
                >
                  <Heart className={isFavorite ? "h-3.5 w-3.5 fill-current" : "h-3.5 w-3.5"} />
                  Favorite
                </button>
                <button
                  type="button"
                  onClick={() => setIsWatchLater((v) => !v)}
                  aria-pressed={isWatchLater}
                  className={
                    isWatchLater
                      ? "inline-flex items-center gap-1.5 rounded-full border border-transparent bg-accent-soft px-3 py-1.5 text-[12.5px] font-medium text-accent-strong"
                      : "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[12.5px] font-medium text-secondary hover:border-border-strong hover:text-primary"
                  }
                >
                  <Clock className="h-3.5 w-3.5" />
                  Watch later
                </button>
              </div>

              {duplicate && (
                <div className="rounded-lg border border-accent/30 bg-accent-soft/60 p-4">
                  <p className="text-[13px] leading-relaxed text-accent-strong">
                    <strong>This video was saved</strong> {duplicate.updated_at ? `on ${formatDate(duplicate.updated_at)}` : "earlier"}.
                    {editingDuplicate
                      ? " You can update its categories and tags below."
                      : " Instead of saving a duplicate, you can update it here."}
                  </p>
                  {!editingDuplicate && duplicate.categories.length === 0 && duplicate.tags.length === 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setEditingDuplicate(true)}
                    >
                      Update organization
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: organization */}
        <div className="flex w-full flex-col space-y-5 p-6 md:w-[380px] md:shrink-0">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <FieldLabel>Categories</FieldLabel>
              <button
                type="button"
                onClick={() => setShowNewCategory((v) => !v)}
                className="inline-flex items-center gap-1 text-[12.5px] font-medium text-accent transition-colors hover:text-accent-strong"
              >
                {showNewCategory ? (
                  <>
                    <X className="h-3.5 w-3.5" /> Cancel
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5" /> New
                  </>
                )}
              </button>
            </div>

            {showNewCategory && (
              <form
                onSubmit={handleCreateCategory}
                className="mb-3 space-y-3 rounded-lg border border-border bg-sunken p-3"
              >
                <Input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Category name, e.g. Development"
                  autoFocus
                  maxLength={40}
                  aria-label="New category name"
                />

                <div className="space-y-1.5">
                  <label
                    htmlFor="new-cat-parent"
                    className="block text-[12px] font-medium text-secondary"
                  >
                    Nest under
                  </label>
                  <select
                    id="new-cat-parent"
                    value={newCatParentId ?? ""}
                    onChange={(e) => setNewCatParentId(e.target.value || null)}
                    className="h-9 w-full rounded-md border border-border bg-elevated px-2.5 text-[13px] text-primary transition-colors hover:border-border-strong focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    <option value="">Top level — no parent</option>
                    {parentOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {`${"  ".repeat(opt.depth)}${opt.depth > 0 ? "↳ " : ""}${opt.name}`}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11.5px] leading-snug text-muted">
                    {newCatParentId
                      ? "Creates a subcategory inside the selected category."
                      : "Pick a parent to create a subcategory instead."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {CATEGORY_COLORS.slice(0, 8).map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Color ${c}`}
                      onClick={() => setNewCatColor(c)}
                      className={cn(
                        "h-6 w-6 rounded-full transition-transform hover:scale-110",
                        newCatColor === c &&
                          "ring-2 ring-primary ring-offset-2 ring-offset-sunken",
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <div className="ml-auto flex gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewCategory(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm" loading={creatingCat}>
                      Create
                    </Button>
                  </div>
                </div>
              </form>
            )}

            <CategoryPicker
              value={categoryIds}
              onChange={setCategoryIds}
              categories={allCategories}
            />
          </div>

          <div>
            <FieldLabel>Tags</FieldLabel>
            <TagInput
              value={tagNames}
              onChange={setTagNames}
              suggestions={tags}
              placeholder="Add tags…  e.g. tutorial, important"
            />
          </div>

          <div>
            <FieldLabel htmlFor="add-notes">Personal notes</FieldLabel>
            <Textarea
              id="add-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What should you remember about this video?"
              rows={3}
              maxLength={4000}
            />
          </div>

          <div>
            <FieldLabel>Watch status</FieldLabel>
            <div className="grid grid-cols-3 gap-1.5 rounded-md border border-border bg-sunken p-1">
              {(["unwatched", "watching", "watched"] as WatchStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setWatchStatus(s)}
                  className={
                    watchStatus === s
                      ? "rounded px-2 py-1.5 text-[12.5px] font-medium capitalize text-accent-contrast bg-accent"
                      : "rounded px-2 py-1.5 text-[12.5px] font-medium capitalize text-secondary hover:text-primary"
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <FieldError>{error}</FieldError>

          <div className="mt-auto flex gap-2.5 pt-2">
            {duplicate && (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={handleDuplicateUpdate}
                loading={stage === "saving"}
                disabled={stage === "saving"}
              >
                <RefreshCw className="h-4 w-4" />
                Update video
              </Button>
            )}
            {!duplicate && (
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleSave}
                loading={stage === "saving"}
                disabled={!canSave || stage === "saving"}
              >
                <Check className="h-4 w-4" />
                Save to library
              </Button>
            )}
            {!duplicate && (
              <a href={url} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost">Open on YouTube</Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}