import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPanel } from '@/components/MapPanel.jsx';
import { Modal } from '@/components/ui/Modal.jsx';
import { SecondaryButton } from '@/components/ui/Button.jsx';
import { cn } from '@/lib/cn.js';

function formatRouteMeta(route) {
  if (!route) return null;
  const km = route.distanceMeters ? `${Math.round(route.distanceMeters / 1000)} km` : null;
  const hours = route.durationSeconds
    ? `${Math.floor(route.durationSeconds / 3600)}h ${Math.round((route.durationSeconds % 3600) / 60)}m`
    : null;
  if (km && hours) return `${km} · ${hours}`;
  return km || hours;
}

/**
 * Bounded route map for dashboard / trip overview / live trip.
 */
export function CompactRouteMap({
  trip,
  markers = [],
  routeGeometry,
  routeMeta,
  fullMapHref,
  className,
  mapHeight = 'h-[180px] md:h-[200px]',
}) {
  const [open, setOpen] = useState(false);

  const stops = [
    trip?.startLocationName,
    ...(trip?.destinations || [])
      .filter((d) => d.selected)
      .slice(0, 4)
      .map((d) => d.name),
    trip?.destinationName,
  ].filter(Boolean);

  const uniqueStops = [...new Set(stops)];

  return (
    <>
      <div className={cn('yolo-widget overflow-hidden p-0', className)}>
        <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-3">
          <div>
            <p className="yolo-label">Route</p>
            {uniqueStops.length > 1 && (
              <p className="mt-1 text-xs text-[var(--text-secondary)] truncate max-w-[280px]">
                {uniqueStops.join(' → ')}
              </p>
            )}
          </div>
          {routeMeta && (
            <p className="text-xs font-semibold text-[var(--brand)] shrink-0">
              {formatRouteMeta(routeMeta)}
            </p>
          )}
        </div>
        <MapPanel
          className={cn('w-full rounded-none', mapHeight)}
          center={{
            latitude: trip?.destinationLatitude,
            longitude: trip?.destinationLongitude,
          }}
          markers={markers}
          routeGeometry={routeGeometry}
        />
        <div className="px-4 py-3 border-t border-[var(--border-subtle)] flex flex-wrap gap-2">
          <SecondaryButton className="!px-4 !py-2 !text-xs" onClick={() => setOpen(true)}>
            Open full map
          </SecondaryButton>
          {fullMapHref && (
            <Link
              to={fullMapHref}
              className="inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold text-[var(--brand)] hover:opacity-80"
            >
              Live map view →
            </Link>
          )}
        </div>
      </div>

      <Modal open={open} title="Route map" onClose={() => setOpen(false)} hideConfirm hideCancel>
        <div className="space-y-3">
          <MapPanel
            className="h-[min(60vh,420px)] w-full rounded-2xl overflow-hidden"
            center={{
              latitude: trip?.destinationLatitude,
              longitude: trip?.destinationLongitude,
            }}
            markers={markers}
            routeGeometry={routeGeometry}
          />
          {fullMapHref && (
            <Link to={fullMapHref} className="text-sm font-semibold text-[var(--brand)]">
              Open live map experience →
            </Link>
          )}
        </div>
      </Modal>
    </>
  );
}
