import { cn } from '@/lib/cn.js';

const CATEGORY_COLORS = {
  FOOD: 'var(--travel-coral)',
  TRANSPORT: 'var(--travel-sky)',
  STAY: 'var(--brand)',
  ACTIVITIES: 'var(--ai-accent)',
  OTHER: 'var(--text-muted)',
};

/**
 * Compact expense breakdown widget for dashboard command center.
 */
export function ExpenseSummaryWidget({
  spent = 0,
  budget = 0,
  currency = 'INR',
  byCategory = {},
  insight,
  loading,
  className,
  onOpen,
}) {
  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  const categories = [
    { key: 'FOOD', label: 'Food' },
    { key: 'TRANSPORT', label: 'Transport' },
    { key: 'STAY', label: 'Stay' },
    { key: 'ACTIVITIES', label: 'Activities' },
  ].filter((c) => byCategory[c.key] != null);

  return (
    <div className={cn('yolo-widget p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="yolo-label">Trip Spending</p>
          {loading ? (
            <div className="mt-2 h-8 w-32 animate-pulse rounded-lg bg-[var(--surface-muted)]" />
          ) : (
            <>
              <p className="mt-1 text-2xl font-display font-bold text-[var(--text-primary)]">
                {currency} {Number(spent).toLocaleString()}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                of {currency} {Number(budget).toLocaleString()}
              </p>
            </>
          )}
        </div>
        {!loading && (
          <div className="text-right">
            <p className="text-2xl font-display font-bold text-[var(--brand)]">{pct}%</p>
            <p className="text-[10px] text-[var(--text-muted)]">used</p>
          </div>
        )}
      </div>

      {!loading && (
        <>
          <div className="mt-4 h-1.5 rounded-full bg-[var(--surface-muted)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, var(--brand), var(--travel-coral))',
              }}
            />
          </div>

          {categories.length > 0 && (
            <ul className="mt-4 space-y-2">
              {categories.map((c) => (
                <li key={c.key} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-[var(--text-secondary)]">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ background: CATEGORY_COLORS[c.key] }}
                    />
                    {c.label}
                  </span>
                  <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                    {currency} {Number(byCategory[c.key]).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {insight && (
            <div
              className="mt-4 rounded-xl px-3 py-2.5 text-xs leading-relaxed"
              style={{
                background: 'var(--ai-accent-soft)',
                color: 'var(--text-secondary)',
              }}
            >
              <span className="font-semibold text-[var(--ai-accent)]">✨ YOLO Insight</span>
              <p className="mt-1">{insight}</p>
            </div>
          )}

          {onOpen && (
            <button
              type="button"
              onClick={onOpen}
              className="mt-3 text-xs font-semibold text-[var(--brand)] hover:opacity-80"
            >
              View all expenses →
            </button>
          )}
        </>
      )}
    </div>
  );
}
