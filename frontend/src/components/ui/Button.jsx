import { cn } from '@/lib/cn.js';

export function PrimaryButton({ children, className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'yolo-btn-primary inline-flex items-center justify-center rounded-full font-semibold px-6 py-3',
        'text-[var(--text-inverse)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold px-6 py-3',
        'border border-[var(--border-strong)] bg-[var(--button-secondary)]',
        'text-[var(--text-primary)] hover:bg-[var(--button-secondary-hover)]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold px-5 py-2.5',
        'text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
