import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Heart, Clock, LayoutGrid } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { loadLibraryPageData, type LibraryPageData } from "@/lib/library";
import { LibraryView } from "@/components/library/library-view";
import { PageLoader } from "@/components/library/page-loader";

export function LibraryPage() {
  const [searchParams] = useSearchParams();
  const favorite = searchParams.get("favorite") === "1";
  const watchLater = searchParams.get("later") === "1";
  const [data, setData] = useState<LibraryPageData | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const result = await loadLibraryPageData(supabase, user.id, {
        sort: "recently_added",
        favorite: favorite || undefined,
        watchLater: watchLater || undefined,
      });
      if (active) setData(result);
    })();
    return () => {
      active = false;
    };
  }, [favorite, watchLater]);

  if (!data) return <PageLoader />;

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
      density={data.density}
      defaultSort={data.defaultSort}
    />
  );
}