"use client";

import { useState } from "react";
import { Play, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VideoPlayer({
  videoId,
  title,
  autoplay = false,
}: {
  videoId: string;
  title: string;
  autoplay?: boolean;
}) {
  const [ready, setReady] = useState(false);

  // No `modestbranding` — it is deprecated and now yields a stripped control
  // bar with no CC / volume / settings buttons. Omitting it restores the full
  // YouTube chrome. `cc_load_policy=0` keeps captions off unless the viewer
  // turns them on from that bar.
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&controls=1&cc_load_policy=0${
    autoplay || ready ? "&autoplay=1" : ""
  }`;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black">
      {!ready && (
        <button
          type="button"
          onClick={() => setReady(true)}
          className="absolute inset-0 z-10 flex items-center justify-center bg-sunken"
          aria-label={`Play ${title}`}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-accent-contrast shadow-pop transition-transform hover:scale-105">
            <Play className="ml-1 h-7 w-7 fill-current" />
          </span>
        </button>
      )}
      <iframe
        src={embedUrl}
        title={title}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
      <a
        href={`https://www.youtube.com/watch?v=${videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-3 top-3 z-10"
        aria-label="Open on YouTube"
      >
        <Button variant="secondary" size="sm" className="bg-black/60 backdrop-blur hover:bg-black/80">
          <ExternalLink className="h-3.5 w-3.5" />
          YouTube
        </Button>
      </a>
    </div>
  );
}