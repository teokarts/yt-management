import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FolderOpen } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { loadLibraryPageData, collectCategoryDescendants } from "@/lib/library";
import { LibraryView } from "@/components/library/library-view";

export const metadata: Metadata = { title: "Category" };

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireUser();
  const supabase = await createServerSupabase();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name, slug, color, description, parent_id")
    .eq("user_id", user.id)
    .eq("slug", slug)
    .maybeSingle();

  if (!category) notFound();

  const categoryIds = await collectCategoryDescendants(supabase, user.id, category.id);

  const data = await loadLibraryPageData(supabase, user.id, {
    sort: "recently_added",
    categoryIds,
  });

  return (
    <LibraryView
      initial={data.initial}
      context={{
        title: category.name,
        subtitle: category.description ?? "Videos in this category. A video can belong to several.",
        icon: <FolderOpen className="h-5 w-5" style={{ color: category.color ?? undefined }} />,
        baseCategoryIds: categoryIds,
      }}
      categories={data.categories}
      tags={data.tags}
      channels={data.channels}
      density={data.density}
      defaultSort={data.defaultSort}
    />
  );
}