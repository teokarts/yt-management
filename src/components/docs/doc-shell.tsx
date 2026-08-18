import { useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

export interface DocSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

export function DocShell({
  backHref,
  backLabel,
  title,
  description,
  sections,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  description: string;
  sections: DocSection[];
}) {
  // HashRouter owns the URL hash, so a plain href="#id" would be parsed as a
  // route and land on the 404 page. Scroll to the heading ourselves instead.
  const scrollToSection = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="min-h-screen bg-base text-primary">
      <header className="sticky top-0 z-40 border-b border-border bg-base/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link to="/" aria-label="Home">
            <Logo />
          </Link>
          <nav className="flex items-center gap-1.5 text-[13px]">
            <Link
              to="/help"
              className="rounded-md px-2.5 py-1.5 text-secondary transition-colors hover:bg-hover hover:text-primary"
            >
              Οδηγίες χρήσης
            </Link>
            <Link to="/login">
              <Button variant="primary" size="sm">
                Σύνδεση
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl px-5 py-10 md:py-14">
        <Link
          to={backHref}
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>

        <header className="mb-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-[12px] font-medium text-accent-strong">
            <BookOpen className="h-3.5 w-3.5" /> Εγχειρίδιο
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-balance md:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-secondary md:text-base">{description}</p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          <aside className="hidden self-start lg:sticky lg:top-24 lg:block">
            <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              Περιεχόμενα
            </p>
            <ul className="space-y-1 border-l border-border">
              {sections.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(s.id)}
                    className="-ml-px block w-full border-l border-transparent py-1 pl-3 text-left text-[13px] text-secondary transition-colors hover:border-accent hover:text-accent-strong"
                  >
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div className="min-w-0 space-y-12">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="mb-3 flex items-center gap-2 border-b border-border pb-3 font-display text-xl font-bold tracking-tight text-primary">
                  {s.title}
                </h2>
                <div className="prose-doc space-y-4 text-[14.5px] leading-relaxed text-secondary">
                  {s.body}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-5 py-6 sm:flex-row">
          <Logo showWordmark={false} />
          <p className="text-xs text-muted">
            <Link to="/" className="transition-colors hover:text-primary">Αρχική</Link>
            {" · "}
            <Link to="/help" className="transition-colors hover:text-primary">Οδηγίες</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

export function DocCode({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-lg border border-border bg-sunken p-4 font-mono text-[13px] leading-relaxed text-primary">
      {children}
    </pre>
  );
}

export function DocNote({
  tone = "info",
  children,
}: {
  tone?: "info" | "warn";
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        tone === "warn"
          ? "rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-[13.5px] leading-relaxed text-secondary"
          : "rounded-lg border border-info/30 bg-info-soft px-4 py-3 text-[13.5px] leading-relaxed text-secondary"
      }
    >
      {children}
    </div>
  );
}

export function DocKbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border-strong bg-elevated px-1.5 py-0.5 font-mono text-[12px] text-primary">
      {children}
    </kbd>
  );
}

export function DocH3({ children }: { children: React.ReactNode }) {
  return <h3 className="font-display text-[15px] font-semibold text-primary">{children}</h3>;
}

export function DocOl({ children }: { children: React.ReactNode }) {
  return (
    <ol className="list-decimal space-y-2 pl-5 marker:font-medium marker:text-accent">
      {children}
    </ol>
  );
}

export function DocUl({ children }: { children: React.ReactNode }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 marker:text-accent">
      {children}
    </ul>
  );
}