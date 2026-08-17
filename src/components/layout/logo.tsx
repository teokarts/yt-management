import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn("h-8 w-8", className)}
    >
      <rect x="1" y="1" width="30" height="30" rx="8" className="fill-accent" />
      <rect x="7.5" y="7.5" width="17" height="17" rx="4" className="fill-accent-contrast opacity-20" />
      <path
        d="M12 11.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5v-9z"
        className="fill-accent-contrast"
      />
      <circle cx="16" cy="16" r="3.2" className="fill-accent" />
      <rect x="5" y="7" width="3" height="18" rx="1.5" className="fill-accent-contrast opacity-90" />
      <rect x="24" y="7" width="3" height="18" rx="1.5" className="fill-accent-contrast opacity-90" />
    </svg>
  );
}

export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="h-7 w-7" />
      {showWordmark && (
        <span className="font-display text-lg font-bold tracking-tight text-primary">
          {APP_NAME}
        </span>
      )}
    </span>
  );
}