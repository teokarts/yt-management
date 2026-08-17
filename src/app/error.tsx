"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h1 className="mt-6 font-display text-2xl font-bold text-primary">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-secondary">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <Button variant="primary" className="mt-6" onClick={reset}>
        <RefreshCw className="h-4 w-4" /> Try again
      </Button>
    </div>
  );
}