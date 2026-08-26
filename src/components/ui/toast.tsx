"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
  /** True while the slide-out animation plays, before removal. */
  exiting?: boolean;
}

interface ToastContextValue {
  toast: (title: string, options?: { description?: string; variant?: ToastVariant }) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let counter = 0;

const EXIT_MS = 200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    // Mark as exiting (idempotent) so the slide-out animation can play,
    // then remove after it completes.
    setToasts((prev) =>
      prev.some((t) => t.id === id && t.exiting)
        ? prev
        : prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    );
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_MS);
  }, []);

  const toast = useCallback<ToastContextValue["toast"]>(
    (title, options) => {
      const id = ++counter;
      const item: Toast = {
        id,
        title,
        description: options?.description,
        variant: options?.variant ?? "success",
      };
      setToasts((prev) => [...prev.slice(-4), item]);
      window.setTimeout(() => dismiss(id), options?.variant === "error" ? 6000 : 3800);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[90] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const Icon =
    toast.variant === "success" ? CheckCircle2 : toast.variant === "error" ? AlertCircle : Info;
  const iconClass =
    toast.variant === "success" ? "text-success" : toast.variant === "error" ? "text-danger" : "text-info";

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-lg border border-border-strong bg-elevated/95 p-3.5 shadow-pop backdrop-blur",
        toast.exiting ? "animate-slide-out-right" : "animate-slide-in-right",
      )}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", iconClass)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-primary">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-ui leading-snug text-secondary">{toast.description}</p>}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="rounded p-0.5 text-muted transition-colors hover:text-primary"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
