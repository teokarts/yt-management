"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import {
  Heart,
  Clock,
  Plus,
  Settings,
  Hash,
  LayoutGrid,
  Pin,
  LogOut,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";
import type { CategoryWithCount, TagWithCount } from "@/types/database";
import { CategoryDialog } from "@/components/category/category-dialog";
import { signOut } from "@/app/actions/auth";

interface SidebarProps {
  categories: CategoryWithCount[];
  pinnedTags: TagWithCount[];
  totalVideos: number;
  favoriteCount: number;
  watchLaterCount: number;
  displayName: string | null;
  email: string;
}

function NavItem({
  href,
  icon,
  label,
  count,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  count?: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2 text-[13.5px] transition-colors",
        active
          ? "bg-selected text-primary"
          : "text-secondary hover:bg-hover hover:text-primary",
      )}
      aria-current={active ? "page" : undefined}
    >
      <span className={cn("shrink-0", active ? "text-accent" : "text-muted group-hover:text-secondary")}>
        {icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 font-mono text-[10.5px] tabular-nums",
            active ? "bg-accent/15 text-accent-strong" : "bg-elevated text-muted group-hover:text-secondary",
          )}
        >
          {count}
        </span>
      )}
    </Link>
  );
}

function SidebarInner(props: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const favoriteActive = pathname === "/app" && searchParams.get("favorite") === "1";
  const laterActive = pathname === "/app" && searchParams.get("later") === "1";

  const categoryActive = useMemo(() => {
    const m = pathname.match(/^\/app\/category\/(.+)$/);
    return m ? decodeURIComponent(m[1]) : null;
  }, [pathname]);

  const tagActive = useMemo(() => {
    const m = pathname.match(/^\/app\/tag\/(.+)$/);
    return m ? decodeURIComponent(m[1]) : null;
  }, [pathname]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  const initial = (props.displayName ?? props.email).slice(0, 1).toUpperCase();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex h-16 items-center px-5">
        <Link href="/app" className="transition-opacity hover:opacity-90" aria-label="Reelist home">
          <Logo />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Main navigation">
        <div className="space-y-0.5">
          <p className="px-3 pb-1.5 pt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Library
          </p>
          <NavItem
            href="/app"
            icon={<LayoutGrid className="h-4 w-4" />}
            label="All videos"
            count={props.totalVideos}
            active={pathname === "/app" && !favoriteActive && !laterActive}
          />
          <NavItem
            href="/app?favorite=1"
            icon={<Heart className="h-4 w-4" />}
            label="Favorites"
            count={props.favoriteCount}
            active={favoriteActive}
          />
          <NavItem
            href="/app?later=1"
            icon={<Clock className="h-4 w-4" />}
            label="Watch later"
            count={props.watchLaterCount}
            active={laterActive}
          />
        </div>

        <div className="mt-6 space-y-0.5">
          <div className="flex items-center justify-between px-3 pb-1.5 pt-2">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              Categories
            </p>
            <button
              type="button"
              onClick={() => setShowCategoryDialog(true)}
              aria-label="New category"
              className="rounded p-1 text-muted transition-colors hover:bg-hover hover:text-accent"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          {props.categories.length === 0 && (
            <p className="px-3 py-1.5 text-xs leading-relaxed text-muted">
              No categories yet. Create one to start organizing.
            </p>
          )}
          {props.categories.map((cat) => {
            const active = categoryActive === cat.slug;
            return (
              <Link
                key={cat.id}
                href={`/app/category/${cat.slug}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] transition-colors",
                  active
                    ? "bg-selected text-primary"
                    : "text-secondary hover:bg-hover hover:text-primary",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    cat.color ? "" : "bg-muted/60",
                  )}
                  style={cat.color ? { backgroundColor: cat.color } : undefined}
                />
                <span className="flex-1 truncate">{cat.name}</span>
                {cat.video_count > 0 && (
                  <span className="font-mono text-[10.5px] tabular-nums text-muted group-hover:text-secondary">
                    {cat.video_count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-6 space-y-0.5">
          <div className="flex items-center justify-between px-3 pb-1.5 pt-2">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              Pinned tags
            </p>
            <Link
              href="/app/settings"
              aria-label="Manage pinned tags"
              className="rounded p-1 text-muted transition-colors hover:bg-hover hover:text-accent"
            >
              <Pin className="h-3.5 w-3.5" />
            </Link>
          </div>
          {props.pinnedTags.length === 0 && (
            <p className="px-3 py-1.5 text-xs leading-relaxed text-muted">
              Pin your most-used tags in Settings.
            </p>
          )}
          {props.pinnedTags.map((tag) => {
            const active = tagActive === tag.slug;
            return (
              <Link
                key={tag.id}
                href={`/app/tag/${tag.slug}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] transition-colors",
                  active
                    ? "bg-selected text-primary"
                    : "text-secondary hover:bg-hover hover:text-primary",
                )}
              >
                <Hash className={cn("h-3.5 w-3.5 shrink-0", active ? "text-accent" : "text-muted group-hover:text-secondary")} />
                <span className="flex-1 truncate">{tag.name}</span>
                {tag.video_count > 0 && (
                  <span className="font-mono text-[10.5px] tabular-nums text-muted group-hover:text-secondary">
                    {tag.video_count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <Link
          href="/app/settings"
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-[13.5px] transition-colors",
            pathname === "/app/settings"
              ? "bg-selected text-primary"
              : "text-secondary hover:bg-hover hover:text-primary",
          )}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-contrast">
            {initial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-primary">
              {props.displayName || "Your profile"}
            </span>
            <span className="block truncate text-[11px] text-muted">{props.email}</span>
          </span>
          <Settings className="h-4 w-4 shrink-0 text-muted" />
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] text-muted transition-colors hover:bg-hover hover:text-danger disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>

      <CategoryDialog open={showCategoryDialog} onClose={() => setShowCategoryDialog(false)} />
    </aside>
  );
}

export function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={<div className="h-full w-64 shrink-0 bg-sidebar" />}>
      <SidebarInner {...props} />
    </Suspense>
  );
}