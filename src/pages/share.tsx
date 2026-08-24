import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BookmarkCheck, BookmarkPlus, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { useAuth } from "@/context/auth-context";
import { fetchSharedVideo, saveSharedVideoToLibrary } from "@/lib/api";
import { formatDuration } from "@/lib/utils";
import type { SharedVideo } from "@/types/database";

type SaveState = "idle" | "busy" | "saved" | "duplicate";

function formatPublishedAt(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function SharePage() {
  const { token = "" } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const [video, setVideo] = useState<SharedVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setSaveState("idle");
    setSaveError(null);
    fetchSharedVideo(token).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (!res.ok || !res.data) {
        setNotFound(true);
        return;
      }
      setVideo(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSave = async () => {
    setSaveState("busy");
    setSaveError(null);
    const res = await saveSharedVideoToLibrary(token);
    if (!res.ok) {
      setSaveState("idle");
      setSaveError(res.error ?? "Could not save the video.");
      return;
    }
    setSaveState(res.data?.saved ? "saved" : "duplicate");
  };

  return (
    <div className="min-h-screen bg-base px-4 py-10 text-primary">
      <div className="mx-auto w-full max-w-2xl">
        <Logo />

        {loading || authLoading ? (
          <div className="mt-16 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-strong border-t-accent" />
          </div>
        ) : notFound || !video ? (
          <div className="mt-16 text-center">
            <h1 className="font-display text-2xl font-bold">Link not available</h1>
            <p className="mt-2 text-sm text-secondary">
              This shared link is invalid or has been removed by its owner.
            </p>
            <Link to="/" className="mt-6 inline-block">
              <Button variant="secondary">Go to homepage</Button>
            </Link>
          </div>
        ) : (
          <article className="mt-6 overflow-hidden rounded-xl border border-border bg-elevated">
            <div className="aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${video.youtube_video_id}`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
                loading="lazy"
              />
            </div>

            <div className="space-y-4 p-5 sm:p-6">
              <div>
                <h1 className="font-display text-xl font-bold leading-snug">{video.title}</h1>
                <p className="mt-1 text-[13px] text-muted">
                  {[video.channel_name, video.duration && formatDuration(video.duration), formatPublishedAt(video.published_at)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>

              {(video.sharer || video.note) && (
                <p className="text-[13px] text-secondary">
                  Shared{video.sharer ? <> by <span className="font-medium text-primary">{video.sharer}</span></> : null}
                  {!video.sharer ? " with you" : ""}
                </p>
              )}

              {video.note && (
                <blockquote className="rounded-lg border-l-2 border-accent/60 bg-sunken px-4 py-3 text-sm leading-relaxed text-secondary">
                  {video.note}
                </blockquote>
              )}

              <div className="rounded-lg border border-border bg-base p-4">
                {user === null && !authLoading ? (
                  <div className="text-center">
                    <p className="text-sm font-medium text-primary">
                      Want to keep this video?
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-secondary">
                      Create a free account to save it to your own library.
                    </p>
                    <div className="mt-4 flex flex-col items-center justify-center gap-2 sm:flex-row">
                      <Link to="/signup">
                        <Button variant="primary" size="md" className="w-full sm:w-auto">
                          <UserPlus className="h-4 w-4" />
                          Create free account
                        </Button>
                      </Link>
                      <Link to={`/login?next=${encodeURIComponent(`/share/${token}`)}`}>
                        <Button variant="secondary" size="md" className="w-full sm:w-auto">
                          <LogIn className="h-4 w-4" />
                          Sign in
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    {saveState === "saved" ? (
                      <p className="inline-flex items-center gap-2 text-sm font-medium text-success">
                        <BookmarkCheck className="h-4 w-4" />
                        Saved to your library
                      </p>
                    ) : saveState === "duplicate" ? (
                      <p className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                        <BookmarkCheck className="h-4 w-4" />
                        This video is already in your library
                      </p>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-primary">
                          Add this video to your library
                        </p>
                        <p className="mt-1 text-[13px] text-secondary">
                          It will be saved to your Reelist account.
                        </p>
                      </>
                    )}
                    {(saveState === "idle" || saveState === "busy") && (
                      <>
                        <Button
                          variant="primary"
                          size="md"
                          className="mx-auto mt-4"
                          loading={saveState === "busy"}
                          onClick={handleSave}
                        >
                          <BookmarkPlus className="h-4 w-4" />
                          Save to my library
                        </Button>
                        {saveError && (
                          <p className="mt-3 text-[13px] text-danger">{saveError}</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
