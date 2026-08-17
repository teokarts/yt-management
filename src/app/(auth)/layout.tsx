import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-base px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(600px 300px at 20% 0%, rgba(230,179,76,0.08), transparent), radial-gradient(700px 400px at 90% 100%, rgba(90,162,216,0.06), transparent)",
        }}
      />
      <div className="relative w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2.5 transition-opacity hover:opacity-90"
          aria-label="YouTube Bookmarker home"
        >
          <Logo />
        </Link>
        <div className="rounded-xl border border-border-strong bg-elevated p-8 shadow-elevated">
          {children}
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          Your private video knowledge library.
        </p>
      </div>
    </div>
  );
}