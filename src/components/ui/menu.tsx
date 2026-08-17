"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface MenuItem {
  label?: string;
  icon?: React.ReactNode;
  onSelect?: () => void;
  danger?: boolean;
  disabled?: boolean;
  shortcut?: string;
  separator?: boolean;
}

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
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const triggerEl = containerRef.current?.querySelector<HTMLElement>("[data-menu-trigger]");
    if (!triggerEl) return;
    const rect = triggerEl.getBoundingClientRect();
    const menuWidth = 220;
    const left =
      align === "end"
        ? Math.min(window.innerWidth - menuWidth - 8, rect.right)
        : Math.max(8, rect.left);
    setPosition({ top: rect.bottom + 6, left });

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
    const onScroll = () => close();
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, align, close]);

  return (
    <div ref={containerRef} className="relative inline-flex">
      {trigger({ open, toggle })}
      {open && position
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              aria-label={label}
              className="animate-scale-in fixed z-[70] w-[220px] rounded-lg border border-border-strong bg-elevated py-1.5 shadow-pop"
              style={{ top: position.top, left: position.left }}
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
                        "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors",
                        "disabled:pointer-events-none disabled:opacity-40",
                        item.danger
                          ? "text-danger hover:bg-danger/10"
                          : "text-secondary hover:bg-hover hover:text-primary",
                      )}
                    >
                      {item.icon && <span className="h-4 w-4 shrink-0">{item.icon}</span>}
                      <span className="flex-1">{item.label}</span>
                      {item.shortcut && (
                        <kbd className="font-mono text-[10px] text-muted">{item.shortcut}</kbd>
                      )}
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
