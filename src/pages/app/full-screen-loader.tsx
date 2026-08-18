export function FullScreenLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-base)]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
    </div>
  );
}