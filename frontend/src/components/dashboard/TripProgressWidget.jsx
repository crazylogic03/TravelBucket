import { motion } from 'framer-motion';
import { cn } from '@/lib/cn.js';

export function TripProgressWidget({
  currentDay = 1,
  totalDays = 5,
  progress = 0,
  visited = 0,
  remaining = 0,
  className,
}) {
  const pct = Math.min(100, Math.max(0, progress));

  return (
    <div className={cn('yolo-widget p-4', className)}>
      <p className="yolo-label">Your Journey</p>
      <p className="mt-1 text-sm font-display font-semibold text-[var(--text-primary)]">
        Day {currentDay} of {totalDays}
      </p>

      <div className="mt-3 h-2 rounded-full bg-[var(--surface-muted)] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, var(--brand), var(--travel-coral))',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <p className="mt-1.5 text-right text-xs font-semibold text-[var(--brand)]">{pct}%</p>

      <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-1 text-xs text-[var(--text-secondary)]">
        <p>
          <span className="font-semibold text-[var(--text-primary)]">{visited}</span> destinations
          visited
        </p>
        <p>
          <span className="font-semibold text-[var(--text-primary)]">{remaining}</span> remaining
        </p>
      </div>
    </div>
  );
}
