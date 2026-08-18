import { useEffect, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/sidebar";
import { Logo } from "@/components/layout/logo";
import { AddVideoDialog } from "@/components/library/add-video-dialog";
import type { Category, Tag, CategoryWithCount, TagWithCount, Profile } from "@/types/database";

export interface AppShellData {
  categories: Category[];
  categoryCounts: CategoryWithCount[];
  tags: Tag[];
  pinnedTags: TagWithCount[];
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

  const sidebarProps = {
    categories: data.categoryCounts,
    pinnedTags: data.pinnedTags,
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
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div
            className="animate-fade-in absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="animate-fade-up absolute inset-y-0 left-0">
            <Sidebar {...sidebarProps} />
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="absolute right-4 top-4 rounded-md p-2 text-secondary hover:bg-hover hover:text-primary"
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