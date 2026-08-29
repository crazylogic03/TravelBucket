import { TravelImage } from '@/components/common/TravelImage.jsx';
import { SecondaryButton } from '@/components/ui/Button.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { cn } from '@/lib/cn.js';

/**
 * Along-your-route stop suggestions during basics planning.
 */
export function RouteSuggestions({
  suggestions,
  loading,
  error,
  decisions,
  onDecision,
  onRetry,
  className,
}) {
  if (!loading && !error && (!suggestions || suggestions.length === 0)) {
    return null;
  }

  return (
    <section className={cn('rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 md:p-5', className)}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="yolo-label text-[var(--ai-accent)]">✦ Along your route</p>
          <h3 className="mt-1 font-display font-semibold text-[var(--text-primary)]">
            Places worth adding along your route
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Add stops you want — YOLO will optimize the order when building your itinerary.
          </p>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      )}

      {error && (
        <div className="rounded-xl yolo-error-state px-4 py-3 text-sm flex items-center justify-between gap-3">
          <span>{error}</span>
          {onRetry && (
            <button type="button" className="font-semibold underline shrink-0" onClick={onRetry}>
              Retry
            </button>
          )}
        </div>
      )}

      {!loading && !error && (
        <ul className="space-y-3">
          {suggestions.map((place) => {
            const decision = decisions[place.id] || 'pending';
            return (
              <li
                key={place.id}
                className={cn(
                  'flex gap-3 rounded-xl border p-3 transition-colors',
                  decision === 'added' && 'border-[var(--brand)]/40 bg-[var(--brand-soft)]',
                  decision === 'skipped' && 'border-[var(--border-subtle)] opacity-60',
                  decision === 'pending' && 'border-[var(--border-subtle)] bg-[var(--surface-muted)]/40',
                )}
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                  <TravelImage
                    src={place.imageUrl}
                    label={place.name}
                    alt={place.name}
                    className="h-full w-full"
                    imgClassName="h-full w-full"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--text-primary)]">{place.name}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {place.detourLabel || place.distanceFromRouteKm != null
                      ? `~${place.distanceFromRouteKm} km off route`
                      : 'On route corridor'}
                    {place.reason ? ` · ${place.reason}` : ''}
                  </p>
                  {place.description && (
                    <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                      {place.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {decision !== 'added' && (
                      <button
                        type="button"
                        onClick={() => onDecision(place.id, 'added')}
                        className="rounded-full px-3 py-1 text-xs font-semibold yolo-btn-primary text-[var(--text-inverse)]"
                      >
                        Add
                      </button>
                    )}
                    {decision === 'added' && (
                      <span className="text-xs font-semibold text-[var(--brand)]">Added ✓</span>
                    )}
                    {decision === 'pending' && (
                      <SecondaryButton
                        className="!px-3 !py-1 !text-xs"
                        onClick={() => onDecision(place.id, 'skipped')}
                      >
                        Skip
                      </SecondaryButton>
                    )}
                    {decision === 'skipped' && (
                      <button
                        type="button"
                        className="text-xs font-semibold text-[var(--text-muted)] underline"
                        onClick={() => onDecision(place.id, 'pending')}
                      >
                        Undo skip
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
