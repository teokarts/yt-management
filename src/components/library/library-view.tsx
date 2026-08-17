"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  ArrowDownUp,
  ChevronDown,
  X,
  Plus,
  LayoutGrid,
  Rows3,
  Columns4,
  List,
  Heart,
  Clock,
  Film,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, type MenuItem } from "@/components/ui/menu";
import { VideoGrid, VideoGridSkeleton } from "@/components/video/video-grid";
import { EditVideoDialog } from "@/components/video/edit-video-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { loadMoreVideos } from "@/app/actions/videos";
import { updateProfile } from "@/app/actions/profile";
import {
  SORT_OPTIONS,
  DATE_FILTERS,
  WATCH_STATUSES,
  CARD_DENSITIES,
  PAGE_SIZE,
  type SortOption,
  type DateFilter,
  type WatchStatus,
  type CardDensity,
} from "@/lib/constants";
import type { Category, Tag, VideoWithRelations } from "@/types/database";

const DENSITY_ICONS: Record<CardDensity, React.ReactNode> = {
  cozy: <Rows3 className="h-4 w-4" />,
  comfortable: <LayoutGrid className="h-4 w-4" />,
  compact: <Columns4 className="h-4 w-4" />,
  list: <List className="h-4 w-4" />,
};

export interface LibraryContext {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  baseCategoryIds?: string[];
  baseTagIds?: string[];
  favorite?: boolean;
  watchLater?: boolean;
}

interface LibraryViewProps {
  initial: { videos: VideoWithRelations[]; total: number; hasMore: boolean };
  context: LibraryContext;
  categories: Category[];
  tags: Tag[];
  channels: string[];
  density: CardDensity;
  defaultSort: SortOption;
}

export function LibraryView({
  initial,
  context,
  categories,
  tags,
  channels,
  density,
  defaultSort,
}: LibraryViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const searchRef = useRef<HTMLInputElement>(null);

  const [videos, setVideos] = useState<VideoWithRelations[]>(initial.videos);
  const [total, setTotal] = useState(initial.total);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [extraTagIds, setExtraTagIds] = useState<string[]>([]);
  const [status, setStatus] = useState<WatchStatus | undefined>();
  const [added, setAdded] = useState<DateFilter>("all");
  const [channel, setChannel] = useState<string | undefined>();
  const [sort, setSort] = useState<SortOption>(defaultSort);
  const [editingVideo, setEditingVideo] = useState<VideoWithRelations | null>(null);

  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    const hasClientFilters =
      debouncedQ.trim() !== "" ||
      extraTagIds.length > 0 ||
      !!status ||
      added !== "all" ||
      !!channel;
    if (!hasClientFilters) {
      setVideos(initial.videos);
      setTotal(initial.total);
      setHasMore(initial.hasMore);
    }
  }

  const filters = useMemo(
    () => ({
      q: debouncedQ || undefined,
      categoryIds:
        context.baseCategoryIds?.length ? context.baseCategoryIds : undefined,
      tagIds:
        context.baseTagIds?.length
          ? [...context.baseTagIds, ...extraTagIds]
          : extraTagIds.length
            ? extraTagIds
            : undefined,
      channelId: channel,
      added,
      status,
      favorite: context.favorite || undefined,
      watchLater: context.watchLater || undefined,
      sort,
    }),
    [debouncedQ, context.baseCategoryIds, context.baseTagIds, context.favorite, context.watchLater, extraTagIds, channel, added, status, sort],
  );

  const fetchPage = useCallback(
    async (offset: number) => {
      return loadMoreVideos(filters, offset);
    },
    [filters],
  );

  const runSearch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPage(0);
      const data = res.data;
      if (res.ok && data) {
        setVideos(data.videos);
        setTotal(data.total);
        setHasMore(data.hasMore);
      }
    } catch {
      toast("Search failed", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }, [fetchPage, toast]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const res = await fetchPage(videos.length);
      const data = res.data;
      if (res.ok && data) {
        setVideos((prev) => [...prev, ...data.videos]);
        setTotal(data.total);
        setHasMore(data.hasMore);
      }
    } catch {
      toast("Could not load more videos", { variant: "error" });
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, hasMore, loadingMore, videos.length, toast]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q), 300);
    return () => window.clearTimeout(t);
  }, [q]);

  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    const onFocusSearch = () => {
      searchRef.current?.focus();
      searchRef.current?.select();
    };
    window.addEventListener("reelist:focus-search", onFocusSearch);
    return () => window.removeEventListener("reelist:focus-search", onFocusSearch);
  }, []);

  useEffect(() => {
    const onEditVideo = (e: Event) => {
      const id = (e as CustomEvent<{ id: string }>).detail?.id;
      const video = videos.find((v) => v.id === id);
      if (video) setEditingVideo(video);
    };
    window.addEventListener("reelist:edit-video", onEditVideo);
    return () => window.removeEventListener("reelist:edit-video", onEditVideo);
  }, [videos]);

  const activeFilterCount =
    (debouncedQ ? 1 : 0) +
    (extraTagIds.length ? 1 : 0) +
    (status ? 1 : 0) +
    (added !== "all" ? 1 : 0) +
    (channel ? 1 : 0);

  const clearAll = () => {
    setQ("");
    setDebouncedQ("");
    setExtraTagIds([]);
    setStatus(undefined);
    setAdded("all");
    setChannel(undefined);
  };

  const changeDensity = async (value: CardDensity) => {
    const res = await updateProfile({ cardDensity: value });
    if (!res.ok) return toast("Could not save setting", { variant: "error" });
    toast("Layout updated");
    router.refresh();
  };

  const activeClientFilters: { id: string; label: string; clear: () => void }[] = [];
  if (status) {
    activeClientFilters.push({
      id: `status-${status}`,
      label: `Status: ${status[0].toUpperCase()}${status.slice(1)}`,
      clear: () => setStatus(undefined),
    });
  }
  if (added !== "all") {
    activeClientFilters.push({
      id: "added",
      label: `Added: ${DATE_FILTERS.find((d) => d.value === added)?.label}`,
      clear: () => setAdded("all"),
    });
  }
  if (channel) {
    activeClientFilters.push({
      id: `channel-${channel}`,
      label: `Channel: ${channel}`,
      clear: () => setChannel(undefined),
    });
  }
  for (const id of extraTagIds) {
    const tag = tags.find((t) => t.id === id);
    if (tag) {
      activeClientFilters.push({
        id: `tag-${id}`,
        label: `#${tag.name}`,
        clear: () => setExtraTagIds((prev) => prev.filter((t) => t !== id)),
      });
    }
  }

  const hasAnyFilter =
    !!context.baseCategoryIds?.length ||
    !!context.baseTagIds?.length ||
    context.favorite ||
    context.watchLater ||
    activeFilterCount > 0;

  const isContextFilter =
    !!context.baseCategoryIds?.length ||
    !!context.baseTagIds?.length ||
    context.favorite ||
    context.watchLater;

  const filterItems: MenuItem[] = [
    {
      label: "Status",
      disabled: true,
      icon: <span className="text-muted">—</span>,
    },
    ...WATCH_STATUSES.map((s) => ({
      label: `${s[0].toUpperCase()}${s.slice(1)}`,
      onSelect: () => setStatus(status === s ? undefined : s),
      active: status === s,
    })),
    { separator: true },
    {
      label: "Added",
      disabled: true,
      icon: <span className="text-muted">—</span>,
    },
    ...DATE_FILTERS.map((d) => ({
      label: d.label,
      onSelect: () => setAdded(added === d.value ? "all" : d.value),
      active: added === d.value,
    })),
    ...(channels.length > 0
      ? ([
          { separator: true },
          { label: "Channel", disabled: true, icon: <span className="text-muted">—</span> },
          ...channels.map((c) => ({
            label: c,
            onSelect: () => setChannel(channel === c ? undefined : c),
            active: channel === c,
          })),
        ] as MenuItem[])
      : []),
    ...(activeFilterCount > 0
      ? [{ separator: true }, { label: "Clear filters", danger: true, onSelect: clearAll }]
      : []),
  ];

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 md:px-8 md:py-8">
      {/* Header */}
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {context.icon && (
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
              {context.icon}
            </span>
          )}
          <div className="flex items-baseline gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight text-primary">
              {context.title}
            </h1>
            <span className="text-sm text-muted">
              {total} {total === 1 ? "video" : "videos"}
            </span>
          </div>
        </div>
        {context.subtitle && (
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-secondary">
            {context.subtitle}
          </p>
        )}
      </header>

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search your library…"
            aria-label="Search videos"
            className="h-10 w-full rounded-md border border-border bg-sunken pl-9 pr-8 text-sm text-primary placeholder:text-muted transition-colors hover:border-border-strong focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted hover:text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 font-mono text-[10px] text-muted sm:block">
            /
          </kbd>
        </div>

        <div className="flex-1" />

        <DropdownMenu
          label="Filters"
          align="end"
          trigger={({ open, toggle }) => (
            <Button
              variant="secondary"
              size="md"
              data-menu-trigger
              onClick={toggle}
              aria-expanded={open}
              className={cn(activeFilterCount > 0 && "border-accent/40 text-accent-strong")}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-contrast">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown
                className={cn("h-4 w-4 text-muted transition-transform", open && "rotate-180")}
              />
            </Button>
          )}
          items={filterItems}
        />

        <DropdownMenu
          label="Sort"
          align="end"
          trigger={({ open, toggle }) => (
            <Button variant="secondary" data-menu-trigger onClick={toggle} aria-expanded={open} aria-haspopup="menu">
              <ArrowDownUp className="h-4 w-4" />
              <span className="hidden sm:inline">
                Sort: {SORT_OPTIONS.find((s) => s.value === sort)?.label}
              </span>
              <ChevronDown
                className={cn("h-4 w-4 text-muted transition-transform", open && "rotate-180")}
              />
            </Button>
          )}
          items={SORT_OPTIONS.map((s) => ({
            label: s.label,
            onSelect: () => setSort(s.value),
            active: sort === s.value,
          }))}
        />

        <DropdownMenu
          label="Card layout"
          align="end"
          trigger={({ open, toggle }) => (
            <Button
              variant="secondary"
              data-menu-trigger
              onClick={toggle}
              aria-expanded={open}
              aria-haspopup="menu"
              aria-label="Card layout"
            >
              {DENSITY_ICONS[density]}
              <span className="hidden sm:inline">
                {CARD_DENSITIES.find((d) => d.value === density)?.label}
              </span>
              <ChevronDown
                className={cn("h-4 w-4 text-muted transition-transform", open && "rotate-180")}
              />
            </Button>
          )}
          items={CARD_DENSITIES.map((d) => ({
            label: d.label,
            onSelect: () => changeDensity(d.value),
            icon: DENSITY_ICONS[d.value],
            active: density === d.value,
          }))}
        />

        <Button
          variant="primary"
          onClick={() => window.dispatchEvent(new CustomEvent("reelist:open-add"))}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add video</span>
        </Button>
      </div>

      {/* Context filter chips */}
      {isContextFilter && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-muted">Showing:</span>
          {context.baseCategoryIds?.map((id) => {
            const cat = categories.find((c) => c.id === id);
            if (!cat) return null;
            const isTopOfSelection =
              !cat.parent_id || !context.baseCategoryIds?.includes(cat.parent_id);
            if (!isTopOfSelection) return null;
            return (
              <span key={id} className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-2.5 py-1 text-[12px] font-medium text-accent-strong">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cat.color ?? "currentColor" }} />
                {cat.name}
              </span>
            );
          })}
          {context.baseTagIds?.map((id) => {
            const tag = tags.find((t) => t.id === id);
            return tag ? (
              <span key={id} className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent-soft px-2.5 py-1 text-[12px] font-medium text-accent-strong">
                <Hash className="h-3 w-3" /> {tag.name}
              </span>
            ) : null;
          })}
          {context.favorite && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-danger/30 bg-danger-soft px-2.5 py-1 text-[12px] font-medium text-danger">
              <Heart className="h-3 w-3 fill-current" /> Favorites
            </span>
          )}
          {context.watchLater && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-2.5 py-1 text-[12px] font-medium text-accent-strong">
              <Clock className="h-3 w-3" /> Watch later
            </span>
          )}
          <button
            type="button"
            onClick={() => router.push("/app")}
            className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] text-muted transition-colors hover:text-primary"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        </div>
      )}

      {/* Active filter chips */}
      {activeClientFilters.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-muted">Filtering:</span>
          {activeClientFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={f.clear}
              className="inline-flex items-center gap-1 rounded-full border border-border-strong bg-elevated px-2.5 py-1 text-[12px] font-medium text-secondary transition-colors hover:border-accent/50 hover:text-primary"
            >
              {f.label}
              <X className="h-3 w-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="ml-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] text-muted transition-colors hover:text-primary"
          >
            <X className="h-3 w-3" /> Clear all
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <VideoGridSkeleton count={8} />
      ) : videos.length === 0 ? (
        <EmptyState
          icon={
            isContextFilter ? (
              <Film className="h-6 w-6" />
            ) : (
              <LayoutGrid className="h-6 w-6" />
            )
          }
          title={
            isContextFilter
              ? "Nothing here yet"
              : debouncedQ
                ? "No matches found"
                : "Your library is empty"
          }
          description={
            isContextFilter
              ? context.favorite
                ? "Videos you favorite will show up here. Tap the heart on any card to save it."
                : context.watchLater
                  ? "Add videos to your watch-later list and they'll appear here."
                  : "This collection has no videos yet. Videos can belong to several categories at once."
              : debouncedQ
                ? "Try a different search, or clear your filters to see everything."
                : "Start building your private video library — save the videos that matter to you."
          }
          action={
            hasAnyFilter && !isContextFilter ? (
              <Button variant="secondary" onClick={clearAll}>
                Clear filters
              </Button>
            ) : !isContextFilter ? (
              <Button
                variant="primary"
                onClick={() => window.dispatchEvent(new CustomEvent("reelist:open-add"))}
              >
                <Plus className="h-4 w-4" />
                Add your first video
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <VideoGrid videos={videos} density={density} />
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <Button variant="secondary" onClick={loadMore} loading={loadingMore}>
                {loadingMore ? "Loading…" : `Load more (${total - videos.length} remaining)`}
              </Button>
            </div>
          )}
          {!hasMore && videos.length > PAGE_SIZE && (
            <p className="mt-8 text-center text-xs text-muted">
              You&apos;ve reached the end — {total} videos in total.
            </p>
          )}
        </>
      )}

      {editingVideo && (
        <EditVideoDialog
          open
          onClose={() => setEditingVideo(null)}
          video={editingVideo}
          categories={categories}
          tags={tags}
        />
      )}
    </div>
  );
}