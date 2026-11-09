export default function Loading() {
  return (
    <div className="water-bg flex min-h-screen items-center justify-center" role="status" aria-live="polite">
      <span className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-turquoise-500" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
