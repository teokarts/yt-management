import { Link } from "react-router-dom";
import {
  ArrowRight,
  Play,
  Clock,
  Heart,
  Search,
  Hash,
  FolderOpen,
  Layers,
  Film,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { APP_NAME } from "@/lib/constants";

const previewCards = [
  { title: "Rendering RSC on the server", channel: "Web Dev Academy", time: "22:14", hue: "from-amber-500/60 to-rose-600/60" },
  { title: "Supabase RLS deep dive", channel: "BuildThings", time: "18:02", hue: "from-emerald-500/60 to-teal-700/60" },
  { title: "Designing dark UIs that feel premium", channel: "Pixel & Type", time: "31:47", hue: "from-sky-500/60 to-indigo-700/60" },
  { title: "Ollama + local LLMs for your stack", channel: "AI at Home", time: "12:55", hue: "from-orange-500/60 to-rose-700/60" },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-base text-primary">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-base/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <nav className="flex items-center gap-2">
            <Link
              to="/help"
              className="hidden rounded-md px-3 py-2 text-[13px] text-secondary transition-colors hover:bg-hover hover:text-primary sm:inline-flex"
            >
              Οδηγίες
            </Link>
            <Link to="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(800px 400px at 50% -10%, rgba(230,179,76,0.12), transparent), radial-gradient(600px 300px at 90% 20%, rgba(90,162,216,0.07), transparent)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 md:pt-24">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-[12px] font-medium text-accent-strong">
                <Film className="h-3.5 w-3.5" /> A private video knowledge library
              </span>
              <h1 className="mt-5 font-display text-4xl font-bold leading-[1.1] tracking-tight text-balance md:text-6xl">
                Every video worth keeping,{" "}
                <span className="text-accent-strong">finally organized.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-secondary md:text-lg">
                Save YouTube videos into your own library, sort them into categories, tag what
                matters, take notes — and watch everything without leaving the app.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link to="/signup">
                  <Button variant="primary" size="lg" className="w-56">
                    Start saving videos <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" size="lg" className="w-56">
                    Sign in
                  </Button>
                </Link>
              </div>
              <p className="mt-4 text-xs text-muted">
                Free to get started · No credit card · Your data stays yours
              </p>
            </div>

            {/* Product preview */}
            <div className="relative mx-auto mt-16 max-w-4xl">
              <div
                className="absolute -inset-x-8 -top-8 bottom-8 rounded-3xl bg-accent/5 blur-2xl"
                aria-hidden="true"
              />
              <div className="relative overflow-hidden rounded-2xl border border-border-strong bg-elevated shadow-pop">
                {/* Fake app chrome */}
                <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                  <span className="h-3 w-3 rounded-full bg-danger/70" />
                  <span className="h-3 w-3 rounded-full bg-accent/70" />
                  <span className="h-3 w-3 rounded-full bg-success/70" />
                  <div className="ml-4 hidden items-center gap-2 rounded-md border border-border bg-sunken px-3 py-1.5 sm:flex">
                    <Search className="h-3.5 w-3.5 text-muted" />
                    <span className="text-xs text-muted">Search your library…</span>
                  </div>
                </div>
                <div className="flex">
                  {/* Fake sidebar */}
                  <div className="hidden w-48 shrink-0 border-r border-border p-3 md:block">
                    <p className="px-2 font-mono text-[9px] uppercase tracking-widest text-muted">Library</p>
                    <p className="mt-2 flex items-center gap-2 rounded-md bg-selected px-2 py-1.5 text-[11.5px] text-primary">
                      <Layers className="h-3 w-3 text-accent" /> All videos <span className="ml-auto text-muted">128</span>
                    </p>
                    <p className="mt-1 flex items-center gap-2 px-2 py-1.5 text-[11.5px] text-secondary">
                      <Heart className="h-3 w-3" /> Favorites
                    </p>
                    <p className="mt-1 flex items-center gap-2 px-2 py-1.5 text-[11.5px] text-secondary">
                      <Clock className="h-3 w-3" /> Watch later
                    </p>
                    <p className="mt-5 px-2 font-mono text-[9px] uppercase tracking-widest text-muted">Categories</p>
                    {[
                      ["AI", "#5aa2d8"],
                      ["Development", "#4fb477"],
                      ["Design", "#e6b34c"],
                      ["Documentaries", "#8b7bd8"],
                    ].map(([name, color]) => (
                      <p key={name} className="mt-1 flex items-center gap-2 px-2 py-1.5 text-[11.5px] text-secondary">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} /> {name}
                      </p>
                    ))}
                    <p className="mt-5 px-2 font-mono text-[9px] uppercase tracking-widest text-muted">Pinned tags</p>
                    <p className="mt-1 flex items-center gap-2 px-2 py-1.5 text-[11.5px] text-secondary">
                      <Hash className="h-3 w-3" /> tutorial
                    </p>
                  </div>
                  {/* Fake grid */}
                  <div className="grid flex-1 grid-cols-2 gap-3 p-4">
                    {previewCards.map((card) => (
                      <div
                        key={card.title}
                        className="group overflow-hidden rounded-lg border border-border bg-sunken"
                      >
                        <div
                          className={`relative flex aspect-video items-center justify-center bg-gradient-to-br ${card.hue}`}
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-transform group-hover:scale-110">
                            <Play className="ml-0.5 h-4 w-4 fill-current" />
                          </span>
                          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white">
                            {card.time}
                          </span>
                        </div>
                        <div className="p-2.5">
                          <p className="line-clamp-1 text-[11.5px] font-semibold text-primary">{card.title}</p>
                          <p className="mt-0.5 text-[10.5px] text-muted">{card.channel}</p>
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full border border-border px-1.5 py-0.5 text-[9px] text-secondary">
                              <FolderOpen className="h-2.5 w-2.5" /> AI
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-border px-1.5 py-0.5 text-[9px] text-secondary">
                              <FolderOpen className="h-2.5 w-2.5" /> Dev
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border bg-sidebar/40">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
            <h2 className="text-center font-display text-2xl font-bold tracking-tight md:text-3xl">
              Your YouTube history, <span className="text-accent-strong">made searchable.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-secondary">
              Stop bookmarking tabs and juggling playlists. YouTube Bookmarker turns the videos you save into a
              curated, personal library you can actually navigate.
            </p>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: <Film className="h-5 w-5" />,
                  title: "Save in one click",
                  desc: "Paste a YouTube link. Thumbnail, channel, duration and description are fetched automatically.",
                },
                {
                  icon: <Layers className="h-5 w-5" />,
                  title: "Flexible organization",
                  desc: "One video can live in several categories and carry as many tags as it needs.",
                },
                {
                  icon: <Search className="h-5 w-5" />,
                  title: "Search everything",
                  desc: "Full-text search across titles, channels, descriptions and your own notes.",
                },
                {
                  icon: <Play className="h-5 w-5" />,
                  title: "Watch in place",
                  desc: "The built-in player keeps the video, its notes and its organization together.",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl border border-border bg-elevated p-5 transition-colors hover:border-border-strong"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
                    {f.icon}
                  </div>
                  <h3 className="mt-4 font-display text-[15px] font-semibold text-primary">{f.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-secondary">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-5 py-16 text-center md:py-20">
            <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              Start your library today
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-secondary">
              {APP_NAME} keeps the videos you care about one search away. Set up takes less than a
              minute.
            </p>
            <Link to="/signup" className="mt-7 inline-block">
              <Button variant="primary" size="lg">
                Create free account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 sm:flex-row">
          <Logo showWordmark={false} />
          <p className="text-xs text-muted">
            {APP_NAME} · Your private video knowledge library
          </p>
          <div className="flex items-center gap-4 text-xs text-muted">
            <Link to="/help" className="transition-colors hover:text-primary">Οδηγίες χρήσης</Link>
            <Link to="/login" className="transition-colors hover:text-primary">Sign in</Link>
            <Link to="/signup" className="transition-colors hover:text-primary">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}