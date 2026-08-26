import { useEffect, useRef, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/sidebar";
import { Logo } from "@/components/layout/logo";
import { AddVideoDialog } from "@/components/library/add-video-dialog";
import { cn } from "@/lib/utils";
import { useExitTransition } from "@/lib/use-exit-transition";
import type { Category, Tag, CategoryWithCount, TagWithCount, PlaylistWithCount, Profile } from "@/types/database";

export interface AppShellData {
  categories: Category[];
  categoryCounts: CategoryWithCount[];
  tags: Tag[];
  pinnedTags: TagWithCount[];
  playlists: PlaylistWithCount[];
  totalVideos: number;
  favoriteCount: number;
  watchLaterCount: number;
  profile: Profile | null;
  email: string;
}

export function AppShell({ data, children }: { data: AppShellData; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const { pathname } = useLocation();
  // Drawer stays mounted while its exit animation plays.
  const drawerMounted = useExitTransition(mobileOpen, 200);
  const drawerClosing = !mobileOpen && drawerMounted;
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (typing) return;

      if (e.key.toLowerCase() === "n" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setAddOpen(true);
      } else if (e.key === "/") {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("bookmarker:focus-search"));
      }
    };
    const onOpenAdd = () => setAddOpen(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("bookmarker:open-add", onOpenAdd);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("bookmarker:open-add", onOpenAdd);
    };
  }, []);

  // Mobile drawer modal semantics: focus trap, Escape to close, focus
  // restoration — mirroring the base Dialog behavior.
  useEffect(() => {
    if (!mobileOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setMobileOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const root = drawerRef.current;
      if (!root) return;
      const focusable = root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      window.setTimeout(() => previousFocus?.focus?.(), 0);
    };
  }, [mobileOpen]);

  const sidebarProps = {
    categories: data.categoryCounts,
    pinnedTags: data.pinnedTags,
    playlists: data.playlists,
    totalVideos: data.totalVideos,
    favoriteCount: data.favoriteCount,
    watchLaterCount: data.watchLaterCount,
    displayName: data.profile?.display_name ?? null,
    email: data.email,
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar {...sidebarProps} />
      </div>

      {/* Mobile drawer */}
      {drawerMounted && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div
            className={cn(
              "absolute inset-0 bg-black/70 backdrop-blur-[2px]",
              drawerClosing ? "animate-fade-out" : "animate-fade-in",
            )}
            onClick={() => setMobileOpen(false)}
          />
          <div
            ref={drawerRef}
            className={cn(
              "absolute inset-y-0 left-0",
              drawerClosing ? "animate-slide-out-left pointer-events-none" : "animate-fade-up",
            )}
          >
            <Sidebar {...sidebarProps} />
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="absolute right-4 top-4 rounded-md p-2 text-secondary transition-colors hover:bg-hover hover:text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-sidebar px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="rounded-md p-1.5 text-secondary transition-colors hover:bg-hover hover:text-primary"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo />
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("bookmarker:focus-search"))}
            aria-label="Search"
            className="rounded-md p-1.5 text-secondary transition-colors hover:bg-hover hover:text-primary"
          >
            <Search className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      <AddVideoDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        categories={data.categories}
        tags={data.tags}
      />
    </div>
  );
}