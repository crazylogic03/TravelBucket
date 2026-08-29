import { cn } from '@/lib/cn.js';

/**
 * Today's schedule — compact timeline widget.
 */
export function ScheduleWidget({ title = "Today's Schedule", items = [], className }) {
  return (
    <div className={cn('yolo-widget p-4 flex flex-col min-h-[200px]', className)}>
      <p className="yolo-label">{title}</p>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--text-muted)] flex-1">
          No activities scheduled yet. Open your trip to view the itinerary.
        </p>
      ) : (
        <ul className="mt-3 space-y-2 flex-1 overflow-y-auto max-h-[220px]">
          {items.map((item, i) => (
            <li
              key={item.id || i}
              className="flex gap-3 rounded-xl px-2 py-2 hover:bg-[var(--surface-muted)] transition-colors"
            >
              <span className="text-xs font-semibold text-[var(--brand)] tabular-nums shrink-0 w-12">
                {item.time}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {item.title}
                </p>
                {item.meta && (
                  <p className="text-[10px] text-[var(--text-muted)] truncate">{item.meta}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Extract today's activities from itinerary days for dashboard. */
export function scheduleFromItinerary(itineraryDays, trip) {
  if (!itineraryDays?.length) return [];

  const destDays = itineraryDays.filter((d) => d.dayNumber > 0);
  const todayIndex = Math.min(
    Math.max(0, (trip?.progressPercentage ? Math.ceil((trip.progressPercentage / 100) * destDays.length) : 1) - 1),
    destDays.length - 1,
  );
  const day = destDays[todayIndex] || destDays[0];
  if (!day?.activities?.length) return [];

  return day.activities.slice(0, 6).map((a, i) => ({
    id: a.id || i,
    time: a.startTime || `${9 + i * 2}:00`,
    title: a.title || a.name || 'Activity',
    meta: [a.durationMinutes && `${a.durationMinutes}m`, a.locationName].filter(Boolean).join(' · '),
  }));
}
