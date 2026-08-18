import { cn } from "@/lib/utils";
import type { CardDensity } from "@/lib/constants";
import { VideoCard } from "@/components/video/video-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { VideoWithRelations } from "@/types/database";

const densityGrid: Record<CardDensity, string> = {
  cozy: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  comfortable: "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
  compact: "grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
  list: "grid-cols-1",
};

export function VideoGrid({
  videos,
  density = "comfortable",
}: {
  videos: VideoWithRelations[];
  density?: CardDensity;
}) {
  return (
    <div className={cn("grid grid-cols-1 gap-3.5 md:gap-4", densityGrid[density])}>
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} density={density} />
      ))}
    </div>
  );
}

export function VideoGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-elevated p-3">
          <Skeleton className="aspect-video w-full rounded-md" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/2" />
          <div className="mt-3 flex gap-1.5">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}