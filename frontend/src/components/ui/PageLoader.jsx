export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center px-6">
        <p className="font-display text-2xl font-bold bg-gradient-to-r from-[var(--brand-strong)] to-[var(--brand-primary)] bg-clip-text text-transparent">
          YOLO
        </p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Loading your journey…</p>
      </div>
    </div>
  );
}
