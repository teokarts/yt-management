"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExitTransition } from "@/lib/use-exit-transition";

export interface MenuItem {
  label?: string;
  icon?: React.ReactNode;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
  shortcut?: string;
  separator?: boolean;
  active?: boolean;
}

const MENU_WIDTH = 220;
const GAP = 6;
const MARGIN = 8;

export function DropdownMenu({
  trigger,
  items,
  align = "end",
  label,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => React.ReactNode;
  items: MenuItem[];
  align?: "start" | "end";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  // Keep the portal mounted while the exit animation plays. Position freezes
  // during the out-transition and outside-click/scroll listeners are already
  // gone, so a closing menu is inert.
  const mounted = useExitTransition(open, 150);
  const closing = !open && mounted;
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    maxHeight: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  const reposition = useCallback(() => {
    const triggerEl = containerRef.current?.querySelector<HTMLElement>("[data-menu-trigger]");
    if (!triggerEl) return;
    const rect = triggerEl.getBoundingClientRect();

    // "end" aligns the menu's right edge with the trigger's, so it grows
    // leftwards from rect.right — anchoring `left` there instead pushes the
    // whole menu a full width past the button.
    const preferredLeft = align === "end" ? rect.right - MENU_WIDTH : rect.left;
    const maxLeft = Math.max(MARGIN, window.innerWidth - MENU_WIDTH - MARGIN);
    const left = Math.min(Math.max(MARGIN, preferredLeft), maxLeft);

    // Flip above the trigger when the menu would spill past the viewport
    // bottom, but only if there is genuinely more headroom up there. The
    // height is only known after the first paint, hence the layout pass below.
    // scrollHeight, not offsetHeight: the applied maxHeight clamps offsetHeight,
    // which would make each pass measure a different value and oscillate.
    const menuHeight = menuRef.current?.scrollHeight ?? 0;
    const spaceBelow = window.innerHeight - rect.bottom - GAP - MARGIN;
    const spaceAbove = rect.top - GAP - MARGIN;
    const flipUp = menuHeight > 0 && menuHeight > spaceBelow && spaceAbove > spaceBelow;
    const top = flipUp ? Math.max(MARGIN, rect.top - GAP - menuHeight) : rect.bottom + GAP;
    // A long list (every channel in the library) must scroll inside the menu
    // rather than run off the bottom of the screen.
    const maxHeight = Math.max(120, flipUp ? spaceAbove : spaceBelow);

    setPosition((prev) =>
      prev && prev.top === top && prev.left === left && prev.maxHeight === maxHeight
        ? prev
        : { top, left, maxHeight },
    );
  }, [align]);

  useEffect(() => {
    if (!open) return;
    reposition();

    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      if (containerRef.current?.contains(e.target as Node)) return;
      close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    // The menu is fixed-positioned, so it cannot follow a scrolling trigger.
    const onScroll = () => close();
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, close, reposition]);

  // The first pass runs before the portal exists, so the menu height is still
  // unknown. Measure once it is mounted and correct the placement if needed.
  useLayoutEffect(() => {
    if (!open || !position) return;
    reposition();
  }, [open, position, reposition]);

  return (
    <div ref={containerRef} className="relative inline-flex">
      {trigger({ open, toggle })}
      {mounted && position
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              aria-label={label}
              className={cn(
                "fixed z-[70] w-[220px] overflow-y-auto overscroll-contain rounded-lg border border-border-strong bg-elevated py-1.5 shadow-pop",
                closing ? "animate-scale-out pointer-events-none" : "animate-scale-in",
              )}
              style={{ top: position.top, left: position.left, maxHeight: position.maxHeight }}
              aria-hidden={closing || undefined}
            >
              {items.map((item, i) => (
                <div key={i}>
                  {item.separator ? (
                    <div className="my-1.5 h-px bg-border" />
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      disabled={item.disabled}
                      onClick={() => {
                        close();
                        item.onSelect?.();
                      }}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-2 text-left text-ui transition-colors",
                        "disabled:pointer-events-none disabled:opacity-40",
                        item.danger
                          ? "text-danger hover:bg-danger/10"
                          : "text-secondary hover:bg-hover hover:text-primary",
                      )}
                    >
                      {item.icon && <span className="h-4 w-4 shrink-0">{item.icon}</span>}
                      <span className="flex-1">{item.label}</span>
                      {item.shortcut && (
                        <kbd className="font-mono text-micro text-muted">{item.shortcut}</kbd>
                      )}
                      {item.active && <Check className="h-3.5 w-3.5 text-accent-strong" />}
                    </button>
                  )}
                </div>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
