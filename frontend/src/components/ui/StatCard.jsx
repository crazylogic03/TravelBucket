export function StatCard({ label, value, hint, accent }) {
  const accentStyle = {
    teal: { background: 'var(--brand-soft)', borderColor: 'color-mix(in srgb, var(--brand-primary) 25%, transparent)' },
    coral: { background: 'color-mix(in srgb, var(--travel-coral) 12%, transparent)' },
    ocean: { background: 'color-mix(in srgb, var(--brand-secondary) 12%, transparent)' },
    purple: { background: 'var(--ai-accent-soft)' },
  };
  const style = accent ? accentStyle[accent] || accentStyle.teal : { background: 'var(--surface-muted)' };

  return (
    <div
      className="rounded-3xl border border-[var(--border-subtle)] p-5"
      style={{ ...style, boxShadow: 'var(--shadow-soft)' }}
    >
      <p className="text-sm text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-display font-semibold text-[var(--text-primary)]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
}
