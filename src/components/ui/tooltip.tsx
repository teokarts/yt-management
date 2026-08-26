"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  /** Gap between tooltip and trigger in pixels (default 8) */
  sideOffset?: number;
}

const CONTENT_PX = 8; // half of px-4 (padding on tooltip content box)

export function Tooltip({
  content,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnChange,
  side = "top",
  align = "center",
  sideOffset = 8,
}: TooltipProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; arrowX: number; arrowY: number } | null>(null);
  const parentRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<number | null>(null);

  const open = controlledOpen ?? localOpen;
  const setOpen = controlledOnChange ?? setLocalOpen;

  useEffect(() => {
    if (!open || !parentRef.current) return;
    const trigger = parentRef.current.getBoundingClientRect();
    const halfW = trigger.width / 2;
    const vw = window.innerWidth;
    let left: number, top: number, arrowX: number, arrowY: number;

    if (side === "top" || side === "bottom") {
      switch (align) {
        case "start":
          left = trigger.left + halfW - CONTENT_PX;
          arrowX = sideOffset;
          break;
        case "end":
          left = trigger.right - halfW + CONTENT_PX;
          arrowX = trigger.width + sideOffset;
          break;
        default: {
          const c = vw / 2;
          left = trigger.left + halfW + (c < trigger.right ? -(trigger.right - c) : 0) - CONTENT_PX;
          arrowX = trigger.width / 2 + sideOffset;
        }
      }
      top = side === "top" ? trigger.top - sideOffset : trigger.bottom + sideOffset;
      arrowY = -(trigger.height / 2 + sideOffset);
    } else {
      switch (align) {
        case "start":
          arrowX = sideOffset;
          break;
        case "end":
          arrowX = trigger.width + sideOffset;
          break;
        default:
          arrowX = trigger.width / 2 + sideOffset;
      }
      left = side === "left" ? trigger.left - sideOffset : trigger.right + sideOffset;
      top = trigger.top + halfW + (vw / 2 < trigger.bottom ? -(trigger.bottom - vw / 2) : 0);
      arrowY = -(halfW + sideOffset);
    }

    setPos({ left, top: Math.round(top), arrowX, arrowY });
  }, [open, side, align, sideOffset]);

  const show = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(true);
  }, [setOpen]);

  const hide = useCallback(() => {
    timerRef.current = window.setTimeout(() => setOpen(false), 150);
  }, [setOpen]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const sideClasses: Record<string, string> = {
    top: "bottom-[calc(100%_+_var(--so)_px)]",
    bottom: "top-[calc(var(--so)_px)]",
    left: "right-[calc(100%_+_var(--so)_px)]",
    right: "left-[calc(var(--so)_px)]",
  };

  return (
    <span
      ref={parentRef}
      className="relative inline-flex"
      style={{ "--so": sideOffset } as React.CSSProperties}
      // only attach pointer/focus events when uncontrolled; in controlled mode
      // the parent manages visibility and we must not steal focus away from e.g.
      // inputs inside an open dialog
      {...(controlledOpen === undefined ? { onMouseEnter: show, onMouseLeave: hide, onFocus: show, onBlur: hide } : {})}
    >
      {children}
      {open && pos && (
        <div
          className={cn(
            "pointer-events-none fixed z-50 animate-fade-in select-none",
            sideClasses[side],
            align === "center" ? "left-[calc(var(--tx)_px-50%)]" : align === "start" ? "left-[var(--tx)_px]" : "right-[var(--tx)_px]",
          )}
          style={{
            "--tx": pos.left,
            "--ty": pos.top,
          } as React.CSSProperties}
        >
          <div className="rounded-md bg-elevated px-2 py-1 text-micro font-medium text-primary shadow-pop border border-border-strong whitespace-nowrap">
            {content}
          </div>
          <div
            className="absolute -z-1 h-3 w-3 bg-elevated border-r border-b border-border-strong"
            style={{
              [side === "top" ? "bottom" : "top"]: `calc(var(--ty)_px_+_var(--ay)_px_-_50%)`,
              [side === "left" || side === "right" ? "top" : "left"]: `calc(var(--tx)_px_+_var(--ax)_px_-_1.5px)`,
            } as React.CSSProperties}
          />
        </div>
      )}
    </span>
  );
}
