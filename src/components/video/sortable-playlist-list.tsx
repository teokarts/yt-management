import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import { cn, formatDuration, truncate } from "@/lib/utils";
import { animateSpring, rubberband } from "@/lib/spring";
import { reorderPlaylist } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import type { VideoWithRelations } from "@/types/database";

interface DragState {
  pointerId: number;
  startIndex: number;
  currentIndex: number;
  startY: number;
  rawDy: number;
  rowH: number;
  el: HTMLElement;
  history: { t: number; y: number }[];
}

/**
 * Vertical ordered list with drag-to-reorder. Gesture rules: the dragged row
 * tracks the pointer 1:1 from wherever it was grabbed, boundaries resist with
 * a rubber-band instead of stopping hard, and on release the finger's exact
 * velocity is handed off to a critically-damped spring that settles into the
 * slot — no seam between gesture and animation. Keyboard users get move
 * up/down buttons on every row.
 */
export function SortablePlaylistList({
  playlistId,
  videos,
}: {
  playlistId: string;
  videos: VideoWithRelations[];
}) {
  const { toast } = useToast();
  const [items, setItems] = useState(videos);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [displacements, setDisplacements] = useState<number[]>([]);

  const rowRefs = useRef<(HTMLElement | null)[]>([]);
  const dragRef = useRef<DragState | null>(null);
  const springCancelRef = useRef<(() => void) | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // External data refreshes (e.g. removals elsewhere) re-sync the list while
  // no drag is in flight.
  useEffect(() => {
    if (!dragRef.current) setItems(videos);
  }, [videos]);

  useEffect(
    () => () => {
      springCancelRef.current?.();
    },
    [],
  );

  /** Release velocity in px/s over the recent pointer history. */
  const releaseVelocity = (history: DragState["history"]): number => {
    if (history.length < 2) return 0;
    const first = history[0];
    const last = history[history.length - 1];
    const dt = last.t - first.t;
    if (dt <= 0) return 0;
    return ((last.y - first.y) / dt) * 1000;
  };

  const beginDrag = (e: React.PointerEvent<HTMLButtonElement>, index: number) => {
    if (springCancelRef.current) {
      springCancelRef.current();
      springCancelRef.current = null;
    }
    const rows = rowRefs.current;
    const el = rows[index];
    if (!el) return;

    const tops = rows.slice(0, items.length).map((r) => r?.offsetTop ?? 0);
    const rowH =
      items.length > 1 ? tops[1] - tops[0] : (el.offsetHeight ?? 64);

    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    dragRef.current = {
      pointerId: e.pointerId,
      startIndex: index,
      currentIndex: index,
      startY: e.clientY,
      rawDy: 0,
      rowH,
      el,
      history: [{ t: performance.now(), y: e.clientY }],
    };
    setDraggingIndex(index);
    setDisplacements(new Array(items.length).fill(0));
  };

  const moveDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;

    const n = items.length;
    const min = (0 - d.startIndex) * d.rowH;
    const max = (n - 1 - d.startIndex) * d.rowH;
    const dy = e.clientY - d.startY;

    // Rubber-band beyond the first/last slot instead of a hard stop.
    const bounded =
      dy < min
        ? dy - rubberband(dy - min, d.rowH)
        : dy > max
          ? dy - rubberband(dy - max, d.rowH)
          : dy;
    d.rawDy = bounded;
    d.history.push({ t: performance.now(), y: e.clientY });
    if (d.history.length > 6) d.history.shift();

    // 1:1 — the row is glued to the finger.
    d.el.style.transform = `translate3d(0, ${bounded}px, 0)`;

    const targetIndex = Math.min(
      n - 1,
      Math.max(0, d.startIndex + Math.round(bounded / d.rowH)),
    );
    if (targetIndex === d.currentIndex) return;
    d.currentIndex = targetIndex;

    const next = new Array(n).fill(0);
    // Siblings between the origin and target slots slide out of the way.
    for (let i = 0; i < n; i++) {
      if (i === d.startIndex) continue;
      if (
        (targetIndex > d.startIndex && i > d.startIndex && i <= targetIndex) ||
        (targetIndex < d.startIndex && i >= targetIndex && i < d.startIndex)
      ) {
        next[i] = targetIndex > d.startIndex ? -d.rowH : d.rowH;
      }
    }
    setDisplacements(next);
  };

  const endDrag = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;

    const velocity = releaseVelocity(d.history);
    const finalOffset = (d.currentIndex - d.startIndex) * d.rowH;
    const el = d.el;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const finish = () => {
      // Clear the imperative transform BEFORE reordering: React diffs style
      // props (0px → 0px = unchanged) and would never reset the inline
      // transform we wrote during the drag/spring, leaving the row stranded
      // over its old neighbors with a gap below.
      el.style.transform = "";
      commit(d.startIndex, d.currentIndex);
    };

    dragRef.current = null;
    setDraggingIndex(null);

    if (reduce || Math.abs(finalOffset - d.rawDy) < 0.5) {
      el.style.transform = `translate3d(0, ${finalOffset}px, 0)`;
      finish();
      return;
    }

    // Velocity handoff: the spring continues at the finger's release speed.
    springCancelRef.current = animateSpring(d.rawDy, finalOffset, {
      response: 0.4,
      velocity,
      onUpdate: (v) => {
        el.style.transform = `translate3d(0, ${v}px, 0)`;
      },
      onComplete: finish,
    });
  };

  const cancelDrag = () => {
    const d = dragRef.current;
    if (!d) return;
    springCancelRef.current?.();
    springCancelRef.current = null;
    dragRef.current = null;
    setDraggingIndex(null);
    setDisplacements(new Array(items.length).fill(0));
    d.el.style.transform = "";
  };

  // Escape aborts an in-flight drag and restores the starting order.
  useEffect(() => {
    if (draggingIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        cancelDrag();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingIndex]);

  /** Applies a move (from drag settle or keyboard buttons) and persists it. */
  const commit = (from: number, to: number) => {
    const current = [...itemsRef.current];
    const [moved] = current.splice(from, 1);
    current.splice(to, 0, moved);
    setItems(current);
    setDisplacements([]);
    void persist(current);
  };

  const moveByButton = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= items.length) return;
    commit(index, to);
  };

  const persist = async (ordered: VideoWithRelations[]) => {
    const res = await reorderPlaylist({
      playlistId,
      videoIds: ordered.map((v) => v.id),
    });
    if (!res.ok) {
      toast("Could not save the new order", { description: res.error, variant: "error" });
      setItems(videos); // roll back to the server truth held by the parent
    }
  };

  return (
    <ul className="flex flex-col gap-2" aria-label="Playlist videos in order">
      {items.map((video, i) => {
        const isDragging = draggingIndex === i;
        return (
          <li
            key={video.id}
            ref={(el) => {
              rowRefs.current[i] = el;
            }}
            style={{
              transform: `translate3d(0, ${displacements[i] ?? 0}px, 0)`,
              willChange: isDragging ? "transform" : undefined,
            }}
            className={cn(
              "flex select-none items-center gap-3 rounded-xl border border-border bg-elevated p-2.5",
              "transition-[transform] duration-200 ease-out",
              isDragging &&
                "relative z-10 border-border-strong shadow-pop transition-none",
            )}
          >
            <span className="w-7 shrink-0 text-center font-mono text-caption tabular-nums text-muted">
              {i + 1}
            </span>

            <div className="aspect-video w-24 shrink-0 overflow-hidden rounded-md bg-sunken sm:w-32">
              {video.thumbnail_url && (
                <img
                  src={video.thumbnail_url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  width={320}
                  height={180}
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-ui font-medium leading-snug text-primary">
                {video.title}
              </p>
              <p className="mt-0.5 truncate text-caption text-muted">
                {video.channel_name ?? ""}
                {video.duration ? ` · ${formatDuration(video.duration)}` : ""}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={() => moveByButton(i, -1)}
                disabled={i === 0}
                aria-label={`Move ${truncate(video.title, 40)} earlier`}
                className="rounded p-1.5 text-muted transition-colors hover:bg-hover hover:text-primary disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => moveByButton(i, 1)}
                disabled={i === items.length - 1}
                aria-label={`Move ${truncate(video.title, 40)} later`}
                className="rounded p-1.5 text-muted transition-colors hover:bg-hover hover:text-primary disabled:pointer-events-none disabled:opacity-30"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label={`Drag to reorder ${truncate(video.title, 40)}`}
                onPointerDown={(e) => beginDrag(e, i)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={() => cancelDrag()}
                className="ml-0.5 cursor-grab touch-none rounded p-1.5 text-muted transition-colors hover:bg-hover hover:text-primary active:cursor-grabbing"
              >
                <GripVertical className="h-4 w-4" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
