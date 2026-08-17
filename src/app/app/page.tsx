import type { Metadata } from "next";
import { Heart, Clock, LayoutGrid } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { loadLibraryPageData } from "@/lib/library";
import { LibraryView } from "@/components/library/library-view";

export const metadata: Metadata = { title: "Your library" };

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ favorite?: string; later?: string }>;
}) {
  const params = await searchParams;
  const favorite = params.favorite === "1";
  const watchLater = params.later === "1";

  const user = await requireUser();
  const supabase = await createServerSupabase();

  const data = await loadLibraryPageData(supabase, user.id, {
    sort: "recently_added",
    favorite: favorite || undefined,
    watchLater: watchLater || undefined,
  });

  const context = favorite
    ? {
        title: "Favorites",
        subtitle: "The videos you've marked as important.",
        icon: <Heart className="h-5 w-5" />,
        favorite: true,
      }
    : watchLater
      ? {
          title: "Watch later",
          subtitle: "Saved for when you have time to watch.",
          icon: <Clock className="h-5 w-5" />,
          watchLater: true,
        }
      : {
          title: "All videos",
          subtitle:
            data.initial.total === 0
              ? "Your private library, ready for its first video."
              : "Every video you've saved, all in one place.",
          icon: <LayoutGrid className="h-5 w-5" />,
        };

  return (
    <LibraryView
      initial={data.initial}
      context={context}
      categories={data.categories}
      tags={data.tags}
      channels={data.channels}
      density={data.density}
      defaultSort={data.defaultSort}
    />
  );
}