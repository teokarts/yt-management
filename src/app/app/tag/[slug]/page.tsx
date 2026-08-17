import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Hash } from "lucide-react";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { loadLibraryPageData } from "@/lib/library";
import { LibraryView } from "@/components/library/library-view";

export const metadata: Metadata = { title: "Tag" };

export default async function TagPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireUser();
  const supabase = await createServerSupabase();

  const { data: tag } = await supabase
    .from("tags")
    .select("id, name, slug")
    .eq("user_id", user.id)
    .eq("slug", slug)
    .maybeSingle();

  if (!tag) notFound();

  const data = await loadLibraryPageData(supabase, user.id, {
    sort: "recently_added",
    tagIds: [tag.id],
  });

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