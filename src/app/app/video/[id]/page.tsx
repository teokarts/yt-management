import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { loadLibraryPage, fetchAllCategories, fetchAllTags } from "@/lib/library";
import { VideoDetail } from "@/components/video/video-detail";
import type { VideoWithRelations } from "@/types/database";

export const metadata: Metadata = { title: "Video" };

export default async function VideoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;
  const user = await requireUser();
  const supabase = await createServerSupabase();

  const { data: videoRaw } = await supabase
    .from("videos")
    .select("*, categories!video_categories(*), tags!video_tags(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!videoRaw) notFound();

  const video = videoRaw as unknown as VideoWithRelations;

  const [categories, tags, relatedPage] = await Promise.all([
    fetchAllCategories(supabase, user.id),
    fetchAllTags(supabase, user.id),
    video.categories.length > 0
      ? loadLibraryPage(supabase, user.id, {
          sort: "recently_added",
          categoryIds: video.categories.map((c) => c.id),
        })
      : Promise.resolve(null),
  ]);

  const related = (relatedPage?.videos ?? [])
    .filter((v) => v.id !== id)
    .slice(0, 8);

  return (
    <VideoDetail
      video={video}
      categories={categories}
      tags={tags}
      editMode={edit === "1"}
      related={related}
    />
  );
}
