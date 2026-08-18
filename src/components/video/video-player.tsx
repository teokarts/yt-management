"use client";

import { useState } from "react";
import { Play } from "lucide-react";

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

  // Keep the top-right corner of the frame free of overlays: YouTube renders
  // its CC / settings controls along the TOP edge on hover, and an absolutely
  // positioned button there covers them. "Open on YouTube" already exists in
  // the action bar below the player.
  //
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
    </div>
  );
}