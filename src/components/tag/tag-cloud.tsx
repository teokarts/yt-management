import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Hash, Pin, PinOff, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TagWithCount } from "@/types/database";

/**
 * Five discrete weight steps. Discrete steps (rather than a continuous font
 * scale) keep the cloud on the type scale and stop a single heavily-used tag
 * from dwarfing everything else.
 */
const STEPS = [
  { text: "text-[12.5px]", pad: "px-2.5 py-1", dot: "h-1 w-1" },
  { text: "text-[13.5px]", pad: "px-3 py-1.5", dot: "h-1.5 w-1.5" },
  { text: "text-[15px]", pad: "px-3.5 py-1.5", dot: "h-1.5 w-1.5" },
  { text: "text-[17px]", pad: "px-4 py-2", dot: "h-2 w-2" },
  { text: "text-[19px]", pad: "px-4.5 py-2", dot: "h-2 w-2" },
] as const;

type SortMode = "usage" | "alpha";

export function TagCloud({
  tags,
  onTogglePin,
  onDelete,
}: {
  tags: TagWithCount[];
  onTogglePin: (tag: TagWithCount) => void;
  onDelete: (tag: TagWithCount) => void;
}) {
  const [sortMode, setSortMode] = useState<SortMode>("usage");
  const [active, setActive] = useState<string | null>(null);

  const max = useMemo(
    () => tags.reduce((m, t) => Math.max(m, t.video_count), 0),
    [tags],
  );
  const min = useMemo(
    () => tags.reduce((m, t) => Math.min(m, t.video_count), Number.POSITIVE_INFINITY),
    [tags],
  );

  const sorted = useMemo(() => {
    const copy = [...tags];
    if (sortMode === "alpha") {
      copy.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      copy.sort((a, b) => b.video_count - a.video_count || a.name.localeCompare(b.name));
    }
    return copy;
  }, [tags, sortMode]);

  // Map a tag's usage onto a weight step. When every tag has the same count
  // the range collapses, so fall back to the middle step for all of them.
  const stepFor = (count: number) => {
    if (max <= min) return STEPS[2];
    const ratio = (count - min) / (max - min);
    return STEPS[Math.min(STEPS.length - 1, Math.round(ratio * (STEPS.length - 1)))];
  };

  const totalUses = tags.reduce((sum, t) => sum + t.video_count, 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12.5px] text-muted">
          <span className="font-mono text-secondary">{tags.length}</span>{" "}
          {tags.length === 1 ? "tag" : "tags"} ·{" "}
          <span className="font-mono text-secondary">{totalUses}</span>{" "}
          {totalUses === 1 ? "use" : "uses"}
        </p>
        <div
          className="flex items-center gap-0.5 rounded-md border border-border bg-sunken p-0.5"
          role="group"
          aria-label="Sort tags"
        >
          {(
            [
              { value: "usage", label: "Most used" },
              { value: "alpha", label: "A–Z" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSortMode(opt.value)}
              aria-pressed={sortMode === opt.value}
              className={cn(
                "rounded px-2.5 py-1 text-[12px] font-medium transition-colors",
                sortMode === opt.value
                  ? "bg-selected text-primary"
                  : "text-muted hover:text-secondary",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {sorted.map((tag) => {
          const step = stepFor(tag.video_count);
          const isActive = active === tag.id;
          return (
            <span
              key={tag.id}
              className="group/tag relative inline-flex"
              onMouseEnter={() => setActive(tag.id)}
              onMouseLeave={() => setActive((cur) => (cur === tag.id ? null : cur))}
            >
              <Link
                to={`/app/tag/${tag.slug}`}
                onFocus={() => setActive(tag.id)}
                title={`${tag.video_count} ${tag.video_count === 1 ? "video" : "videos"}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border font-medium transition-all duration-200",
                  step.text,
                  step.pad,
                  tag.is_pinned
                    ? "border-accent/45 bg-accent-soft text-accent-strong hover:border-accent/70"
                    : "border-border bg-elevated text-secondary hover:border-border-strong hover:bg-hover hover:text-primary",
                )}
              >
                {tag.is_pinned ? (
                  <Pin className="h-3 w-3 shrink-0 fill-current" aria-hidden="true" />
                ) : (
                  <Hash className="h-3 w-3 shrink-0 text-muted" aria-hidden="true" />
                )}
                <span>{tag.name}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-full font-mono text-[10.5px] tabular-nums",
                    tag.is_pinned ? "text-accent-strong/70" : "text-muted",
                  )}
                >
                  {tag.video_count}
                </span>
              </Link>

              {/* Actions reveal on hover/focus so the cloud stays readable at rest. */}
              <span
                className={cn(
                  "absolute -right-1 -top-2 z-10 flex items-center gap-0.5 rounded-full border border-border-strong bg-elevated p-0.5 shadow-[var(--shadow-pop)] transition-opacity",
                  isActive
                    ? "opacity-100"
                    : "pointer-events-none opacity-0 group-focus-within/tag:pointer-events-auto group-focus-within/tag:opacity-100",
                )}
              >
                <button
                  type="button"
                  onClick={() => onTogglePin(tag)}
                  aria-pressed={tag.is_pinned}
                  aria-label={tag.is_pinned ? `Unpin ${tag.name}` : `Pin ${tag.name}`}
                  title={tag.is_pinned ? "Unpin from sidebar" : "Pin to sidebar"}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full transition-colors",
                    tag.is_pinned
                      ? "text-accent-strong hover:bg-hover"
                      : "text-muted hover:bg-hover hover:text-primary",
                  )}
                >
                  {tag.is_pinned ? (
                    <PinOff className="h-3 w-3" />
                  ) : (
                    <Pin className="h-3 w-3" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(tag)}
                  aria-label={`Delete tag ${tag.name}`}
                  title="Delete tag"
                  className="flex h-6 w-6 items-center justify-center rounded-full text-muted transition-colors hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
