import { cn } from '@/lib/cn.js';
import { DestinationDiscoveryCard } from '@/components/ui/DestinationDiscoveryCard.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';

/**
 * Popular places — horizontal rail on desktop, grid fallback on small screens.
 */
export function PopularDestinationsSection({
  destinations = [],
  loading,
  error,
  onRetry,
  onExplore,
  title = 'Discover your next destination',
  subtitle = 'Popular Places',
  className,
  layout = 'rail',
}) {
  return (
    <section className={cn('w-full', className)}>
      <div className="mb-4 md:mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="yolo-label text-[var(--brand)]">{subtitle}</p>
          <h2 className="mt-1 text-xl md:text-2xl font-display font-bold text-[var(--text-primary)]">
            {title}
          </h2>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl yolo-error-state px-4 py-3 text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          {onRetry && (
            <button type="button" className="font-semibold underline shrink-0" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div
          className={cn(
            layout === 'grid'
              ? 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4'
              : 'flex gap-3 md:gap-4 overflow-hidden',
          )}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              className={cn(
                'rounded-2xl shrink-0',
                layout === 'grid' ? 'h-[220px]' : 'w-[220px] h-[220px]',
              )}
            />
          ))}
        </div>
      ) : (
        <div
          className={cn(
            layout === 'grid'
              ? 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4'
              : 'flex gap-3 md:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide',
          )}
        >
          {destinations.map((d) => (
            <DestinationDiscoveryCard
              key={d.id}
              destination={d}
              onClick={() => onExplore?.(d)}
              className={cn(layout === 'rail' && 'snap-start shrink-0 w-[200px] sm:w-[220px] md:w-[240px]')}
            />
          ))}
        </div>
      )}
    </section>
  );
}
