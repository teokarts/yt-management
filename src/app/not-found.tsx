import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base px-4 text-center">
      <Logo />
      <h1 className="mt-8 font-display text-3xl font-bold text-primary">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-secondary">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link href="/app" className="mt-6 inline-block">
        <Button variant="primary">Back to library</Button>
      </Link>
    </div>
  );
}