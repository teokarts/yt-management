import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FolderOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  loadLibraryPageData,
  collectCategoryDescendants,
  type LibraryPageData,
} from "@/lib/library";
import { LibraryView } from "@/components/library/library-view";
import { PageLoader } from "@/components/library/page-loader";
import { EmptyState } from "@/components/ui/empty-state";

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<LibraryPageData | null>(null);
  const [category, setCategory] = useState<{
    name: string;
    description: string | null;
    color: string | null;
  } | null>(null);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
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
      const { data: category } = await supabase
        .from("categories")
        .select("id, name, slug, color, description, parent_id")
        .eq("user_id", user.id)
        .eq("slug", slug)
        .maybeSingle();
      if (!category) {
        if (active) setNotFound(true);
        return;
      }
      const ids = await collectCategoryDescendants(supabase, user.id, category.id);
      const result = await loadLibraryPageData(supabase, user.id, {
        sort: "recently_added",
        categoryIds: ids,
      });
      if (!active) return;
      setCategory(category);
      setCategoryIds(ids);
      setData(result);
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  if (notFound)
    return (
      <EmptyState
        icon={<FolderOpen className="h-6 w-6" />}
        title="Category not found"
        description="This category may have been deleted."
      />
    );

  if (!data || !category) return <PageLoader />;

  return (
    <LibraryView
      initial={data.initial}
      context={{
        title: category.name,
        subtitle:
          category.description ?? "Videos in this category. A video can belong to several.",
        icon: (
          <FolderOpen className="h-5 w-5" style={{ color: category.color ?? undefined }} />
        ),
        baseCategoryIds: categoryIds,
      }}
      categories={data.categories}
      tags={data.tags}
      density={data.density}
      defaultSort={data.defaultSort}
    />
  );
}