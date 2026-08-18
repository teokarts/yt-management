import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { SearchX } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { loadLibraryPage, fetchAllCategories, fetchAllTags } from "@/lib/library";
import { VideoDetail } from "@/components/video/video-detail";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { VideoWithRelations, Category, Tag } from "@/types/database";

function VideoPageLoader() {
  return (
    <div className="px-6 py-6 md:px-8">
      <Skeleton className="h-5 w-24 rounded-md" />
      <Skeleton className="mt-4 aspect-video w-full rounded-xl" />
      <Skeleton className="mt-5 h-7 w-2/3 rounded-md" />
      <Skeleton className="mt-2 h-4 w-1/3 rounded-md" />
    </div>
  );
}

export function VideoPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const editMode = searchParams.get("edit") === "1";
  const [video, setVideo] = useState<VideoWithRelations | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [related, setRelated] = useState<VideoWithRelations[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const loadedIdRef = useRef<string | null>(null);

  useEffect(() => {
    const onChanged = () => setReloadKey((k) => k + 1);
    window.addEventListener("bookmarker:library-changed", onChanged);
    return () => window.removeEventListener("bookmarker:library-changed", onChanged);
  }, []);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      setNotFound(false);
      // Only blank out on a genuine navigation to another video. A background
      // refetch of the same video must keep the current data on screen,
      // otherwise the whole page (player included) flashes back to a skeleton.
      if (loadedIdRef.current !== id) {
        setVideo(null);
        setRelated([]);
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: videoRaw } = await supabase
        .from("videos")
        .select("*, categories!video_categories(*), tags!video_tags(*)")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (!videoRaw) {
        if (active) setNotFound(true);
        return;
      }
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
      if (!active) return;
      loadedIdRef.current = id;
      setCategories(categories);
      setTags(tags);
      setRelated((relatedPage?.videos ?? []).filter((v) => v.id !== id).slice(0, 8));
      setVideo(video);
    })();
    return () => {
      active = false;
    };
  }, [id, reloadKey]);

  if (notFound)
    return (
      <div className="px-6 py-6 md:px-8">
        <EmptyState
          icon={<SearchX className="h-6 w-6" />}
          title="Video not found"
          description="This video may have been deleted, or you don't have access to it."
        />
      </div>
    );

  if (!video) return <VideoPageLoader />;

  return (
    <VideoDetail
      video={video}
      categories={categories}
      tags={tags}
      editMode={editMode}
      related={related}
    />
  );
}