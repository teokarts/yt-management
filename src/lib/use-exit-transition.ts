import { useEffect, useState } from "react";

/**
 * Keeps a conditionally-rendered surface mounted while its exit animation
 * plays. Returns true while it should be in the DOM — both while `open` and
 * during the short window after close where the out-transition runs.
 */
export function useExitTransition(open: boolean, durationMs = 160): boolean {
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    const t = window.setTimeout(() => setMounted(false), durationMs);
    return () => window.clearTimeout(t);
  }, [open, mounted, durationMs]);

  return mounted;
}
