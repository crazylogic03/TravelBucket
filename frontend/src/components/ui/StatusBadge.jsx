import { cn } from '@/lib/cn.js';

const styles = {
  DRAFT: 'bg-[var(--warning-soft)] text-[var(--warning)] ring-1 ring-[color-mix(in_srgb,var(--warning)_30%,transparent)]',
  PLANNED: 'bg-[var(--brand-soft)] text-[var(--brand-primary)] ring-1 ring-[color-mix(in_srgb,var(--brand-primary)_25%,transparent)]',
  ACTIVE: 'bg-[color-mix(in_srgb,var(--travel-coral)_15%,transparent)] text-[var(--travel-coral)] ring-1 ring-[color-mix(in_srgb,var(--travel-coral)_25%,transparent)]',
  COMPLETED: 'bg-[var(--surface-muted)] text-[var(--text-secondary)] ring-1 ring-[var(--border-subtle)]',
  CANCELLED: 'bg-[var(--error-soft)] text-[var(--error)] ring-1 ring-[color-mix(in_srgb,var(--error)_25%,transparent)]',
  PLANNED_DEST: 'bg-[var(--brand-soft)] text-[var(--brand-primary)]',
  CURRENT: 'bg-[color-mix(in_srgb,var(--travel-coral)_15%,transparent)] text-[var(--travel-coral)]',
  VISITED: 'bg-[var(--success-soft)] text-[var(--success)]',
  SKIPPED: 'bg-[var(--surface-muted)] text-[var(--text-muted)]',
};

export function StatusBadge({ status, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles[status] || 'bg-[var(--surface-muted)] text-[var(--text-secondary)]',
        className,
      )}
    >
      {String(status || '').replace(/_/g, ' ')}
    </span>
  );
}
