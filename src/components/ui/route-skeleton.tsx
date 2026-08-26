import { VideoGridSkeleton } from "@/components/video/video-grid";

/**
 * Neutral Suspense fallback for lazy route chunks — a quiet skeleton that
 * matches the app's content shape instead of an attention-grabbing spinner.
 * Auth checks still use FullScreenLoader (different semantic: blocking).
 */
export function RouteSkeleton() {
  return (
    <div className="min-h-screen bg-base">
      <div className="mx-auto w-full max-w-[1600px] animate-fade-in px-4 py-6 md:px-8">
        <div className="skeleton h-7 w-44 rounded-md" />
        <div className="skeleton mt-2 h-4 w-64 rounded" />
        <div className="mt-8">
          <VideoGridSkeleton count={10} />
        </div>
      </div>
    </div>
  );
}
