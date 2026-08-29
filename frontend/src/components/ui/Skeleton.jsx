import { cn } from '@/lib/cn.js';

export function Skeleton({ className }) {
  return (
    <div className={cn('animate-pulse rounded-2xl bg-[var(--surface-muted)]', className)} />
  );
}
