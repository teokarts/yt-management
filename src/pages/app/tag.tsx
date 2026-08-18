import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Hash } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { loadLibraryPageData, type LibraryPageData } from "@/lib/library";
import { LibraryView } from "@/components/library/library-view";
import { PageLoader } from "@/components/library/page-loader";
import { EmptyState } from "@/components/ui/empty-state";

export function TagPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<LibraryPageData | null>(null);
  const [tag, setTag] = useState<{ name: string; id: string } | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    (async () => {
      setNotFound(false);
      setData(null);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: tag } = await supabase
        .from("tags")
        .select("id, name, slug")
        .eq("user_id", user.id)
        .eq("slug", slug)
        .maybeSingle();
      if (!tag) {
        if (active) setNotFound(true);
        return;
      }
      const result = await loadLibraryPageData(supabase, user.id, {
        sort: "recently_added",
        tagIds: [tag.id],
      });
      if (!active) return;
      setTag(tag);
      setData(result);
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  if (notFound)
    return (
      <EmptyState
        icon={<Hash className="h-6 w-6" />}
        title="Tag not found"
        description="This tag may have been deleted."
      />
    );

  if (!data || !tag) return <PageLoader />;

  return (
    <LibraryView
      initial={data.initial}
      context={{
        title: `#${tag.name}`,
        subtitle: `Videos tagged with ${tag.name}.`,
        icon: <Hash className="h-5 w-5" />,
        baseTagIds: [tag.id],
      }}
      categories={data.categories}
      tags={data.tags}
      channels={data.channels}
      density={data.density}
      defaultSort={data.defaultSort}
    />
  );
}