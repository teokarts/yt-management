import { VideoGridSkeleton } from "@/components/video/video-grid";

export function PageLoader() {
  return (
    <div className="animate-fade-in px-6 py-6 md:px-8">
      <div className="h-7 w-44 rounded-md bg-sunken" />
      <div className="mt-2 h-4 w-64 rounded bg-sunken" />
      <div className="mt-6">
        <VideoGridSkeleton count={12} />
      </div>
    </div>
  );
}