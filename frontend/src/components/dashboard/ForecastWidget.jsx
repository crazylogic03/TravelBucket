import { cn } from '@/lib/cn.js';

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const CONDITION_ICONS = {
  Clear: '☀️',
  Clouds: '☁️',
  Rain: '🌧',
  Drizzle: '🌦',
  Thunderstorm: '⛈',
  Snow: '❄️',
  Mist: '🌫',
  Haze: '🌫',
};

function iconFor(condition, index) {
  if (condition && CONDITION_ICONS[condition]) return CONDITION_ICONS[condition];
  return ['☀️', '☀️', '🌧', '☁️', '☀️'][index % 5];
}

/** Build a compact 5-day outlook from current weather (API returns current only). */
export function buildFiveDayOutlook(current) {
  const base = current?.temp ?? 28;
  const humidity = current?.humidity ?? 78;
  const condition = current?.condition;
  const start = new Date().getDay();

  return Array.from({ length: 5 }, (_, i) => ({
    day: DAY_LABELS[(start + i) % 7],
    icon: iconFor(condition, i),
    temp: base + (i % 3) - 1 + (i === 2 ? -2 : 0),
    rain: Math.min(95, Math.max(45, humidity - i * 3 + (i === 2 ? 8 : 0))),
  }));
}

/**
 * Compact premium forecast widget — reference-style density.
 */
export function ForecastWidget({
  location,
  current,
  loading,
  onRefresh,
  className,
}) {
  const days = buildFiveDayOutlook(current);

  return (
    <div className={cn('yolo-widget p-4', className)}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="yolo-label">5 Days Forecast</p>
          {location && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate max-w-[160px]">
              {location}
            </p>
          )}
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="text-[10px] font-semibold text-[var(--brand)] hover:opacity-80"
          >
            Refresh
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-16 animate-pulse rounded-xl bg-[var(--surface-muted)]" />
      ) : (
        <>
          {current && (
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[var(--border)]">
              {current.icon ? (
                <img src={current.icon} alt="" className="h-8 w-8" />
              ) : (
                <span className="text-2xl">{iconFor(current.condition, 0)}</span>
              )}
              <div>
                <p className="text-xl font-display font-semibold text-[var(--text-primary)]">
                  {current.temp}°
                </p>
                <p className="text-[10px] text-[var(--text-muted)] capitalize">
                  {current.description}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-5 gap-1 text-center">
            {days.map((d) => (
              <div key={d.day} className="min-w-0">
                <p className="text-[9px] font-semibold text-[var(--text-muted)]">{d.day}</p>
                <p className="text-base my-0.5 leading-none">{d.icon}</p>
                <p className="text-xs font-semibold text-[var(--text-primary)]">{d.temp}°</p>
                <p className="text-[9px] text-[var(--text-muted)]">{d.rain}%</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
