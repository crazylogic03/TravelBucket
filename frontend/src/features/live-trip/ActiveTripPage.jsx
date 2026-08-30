import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MapPanel } from '@/components/MapPanel.jsx';
import { CompactRouteMap } from '@/components/dashboard/CompactRouteMap.jsx';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button.jsx';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { Modal } from '@/components/ui/Modal.jsx';
import {
  getLiveTrip,
  visitDestination,
  skipDestination,
  getDirections,
  getWeather,
} from '@/features/trips/tripApi.js';
import { previewReplan, applyReplan } from '@/features/copilot/copilotApi.js';
import { cn } from '@/lib/cn.js';

function useGeolocation() {
  const watchIdRef = useRef(null);
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [watching, setWatching] = useState(false);

  const clearWatch = useCallback(() => {
    if (watchIdRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }
    clearWatch();
    setError(null);
    setWatching(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        setError(
          err.code === 1
            ? 'Location permission denied. Live map continues without your position — enable location for ETA and tracking.'
            : 'Unable to read location. Continuing without live GPS.',
        );
        setWatching(false);
      },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 },
    );
  }, [clearWatch]);

  useEffect(() => {
    start();
    return clearWatch;
  }, [start, clearWatch]);

  return { position, error, watching, retry: start };
}

export default function ActiveTripPage({ mapOnly = false }) {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { position, error: geoError, retry } = useGeolocation();

  const [live, setLive] = useState(null);
  const [trip, setTrip] = useState(null);
  const [eta, setEta] = useState(null);
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [routeMeta, setRouteMeta] = useState(null);
  const [weather, setWeather] = useState(null);
  const [selected, setSelected] = useState(null);
  const [skipOpen, setSkipOpen] = useState(false);
  const [replanOpen, setReplanOpen] = useState(false);
  const [replanPreview, setReplanPreview] = useState(null);
  const [replanning, setReplanning] = useState(false);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    const data = await getLiveTrip(tripId);
    setTrip(data.trip);
    setLive(data.live);
    return data;
  }, [tripId]);

  useEffect(() => {
    setTrip(null);
    setLive(null);
    setError(null);
    reload().catch((err) => setError(err.message));
  }, [reload]);

  const focus = live?.current || live?.next;

  useEffect(() => {
    if (!position || !focus) {
      setEta(null);
      setRouteMeta(null);
      return undefined;
    }
    let cancelled = false;
    getDirections(position.longitude, position.latitude, focus.longitude, focus.latitude)
      .then((d) => {
        if (!cancelled) {
          setEta(d.route);
          setRouteMeta(d.route);
          setRouteGeometry(d.route?.geometry || null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRouteMeta(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [position, focus]);

  useEffect(() => {
    if (!selected) {
      setWeather(null);
      return;
    }
    getWeather(selected.latitude, selected.longitude)
      .then((d) => setWeather(d.weather))
      .catch(() => setWeather(null));
  }, [selected]);

  const markers = useMemo(() => {
    if (!trip) return [];
    const list = [];
    if (position) {
      list.push({
        latitude: position.latitude,
        longitude: position.longitude,
        label: 'You',
        color: '#0D213D',
      });
    }
    for (const d of trip.destinations || []) {
      if (!d.selected && d.status === 'PLANNED') continue;
      const color =
        d.status === 'VISITED'
          ? '#2ECC71'
          : d.status === 'CURRENT'
            ? '#FF9966'
            : d.status === 'SKIPPED'
              ? '#B9C5D5'
              : '#4A90E2';
      list.push({
        latitude: d.latitude,
        longitude: d.longitude,
        label: d.name,
        color,
      });
    }
    return list;
  }, [trip, position]);

  const handleVisit = async (dest) => {
    setError(null);
    try {
      await visitDestination(tripId, dest.id);
      setSelected(null);
      await reload();
    } catch (err) {
      setError(err.message || 'Could not mark visit');
    }
  };

  const handleSkip = async () => {
    if (!selected) return;
    setError(null);
    const skippedName = selected.name;
    try {
      const result = await skipDestination(tripId, selected.id, 'Skipped during live trip');
      setSkipOpen(false);
      setSelected(null);
      await reload();
      if (result.suggestReplan) {
        try {
          const preview = await previewReplan(tripId, `Skipped ${skippedName}`);
          setReplanPreview(preview.diff);
          setReplanOpen(true);
        } catch {
          /* replan preview optional */
        }
      }
    } catch (err) {
      setError(err.message || 'Could not skip stop');
      setSkipOpen(false);
    }
  };

  const handleApplyReplan = async () => {
    setReplanning(true);
    try {
      await applyReplan(tripId, 'Applied from live trip');
      setReplanOpen(false);
      setReplanPreview(null);
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setReplanning(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
        <p className="text-[var(--error)]">{error}</p>
      </div>
    );
  }

  if (!trip || !live) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--text-muted)] bg-[var(--background)]">
        Loading live trip…
      </div>
    );
  }

  const progress = live.progressPercentage ?? trip.progressPercentage ?? 0;
  const mapMarkers = markers;
  const activeRouteGeometry = routeGeometry || eta?.geometry || null;
  const activeRouteMeta = routeMeta || eta;

  if (mapOnly) {
    return (
      <div className="min-h-screen bg-[var(--live-bg)] text-[var(--live-text)] flex flex-col">
        <div className="relative flex-1 min-h-[70vh]">
          <MapPanel
            key={trip.id}
            className="h-[min(100vh,900px)] w-full"
            center={
              position ||
              (focus
                ? { latitude: focus.latitude, longitude: focus.longitude }
                : {
                    latitude: trip.destinationLatitude,
                    longitude: trip.destinationLongitude,
                  })
            }
            markers={mapMarkers}
            currentLocation={
              position ? { ...position, label: 'You', color: '#0EA5E9' } : null
            }
            selectedId={focus?.id}
            routeGeometry={activeRouteGeometry}
          />
          <Link
            to={`/trips/${tripId}/active`}
            className="absolute top-4 left-4 z-10 rounded-full text-sm font-semibold px-4 py-2 border border-[var(--border)]"
            style={{ background: 'var(--live-floating)', color: 'var(--live-text)' }}
          >
            ← Live trip
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--live-bg)] text-[var(--live-text)]">
      <div className="max-w-2xl mx-auto w-full px-4 py-5 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--live-text-muted)]">Live trip</p>
            <h1 className="font-display font-semibold text-xl mt-1">{trip.title}</h1>
          </div>
          <Link
            to={`/trips/${tripId}`}
            className="text-xs font-semibold text-[var(--brand-primary)] shrink-0"
          >
            Trip overview →
          </Link>
        </div>

        <div className="h-2 rounded-full bg-[var(--live-chip)] overflow-hidden">
          <div className="h-full yolo-btn-primary" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-[var(--live-text-muted)]">{progress}% complete</p>

        <CompactRouteMap
          trip={trip}
          markers={mapMarkers}
          routeGeometry={activeRouteGeometry}
          routeMeta={activeRouteMeta}
          fullMapHref={`/trips/${tripId}/active/map`}
          mapHeight="h-[180px]"
        />

        {geoError && (
          <div className="rounded-xl px-4 py-3 text-sm yolo-error-state">
            {geoError}
            <button type="button" className="block mt-2 underline" onClick={retry}>
              Enable Location
            </button>
          </div>
        )}

        <div className="yolo-widget p-4 space-y-3 bg-[var(--live-panel)] border-[var(--live-border)]">
          <InfoRow label="Current location" value={position ? 'Live GPS active' : 'Waiting for GPS'} />
          <InfoRow label="Next destination" value={live.current?.name || live.next?.name || '—'} />
          <InfoRow
            label="ETA"
            value={
              eta
                ? `${Math.round(eta.durationSeconds / 60)} min · ${(eta.distanceMeters / 1000).toFixed(1)} km`
                : '—'
            }
          />
          <InfoRow
            label="Visited / Skipped"
            value={`${live.visited.length} visited · ${live.skipped.length} skipped`}
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase text-[var(--live-text-muted)]">Destinations</p>
          {(trip.destinations || [])
            .filter((d) => d.selected || d.status === 'SKIPPED')
            .map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelected(d)}
                className="w-full text-left rounded-xl bg-[var(--live-panel)] border border-[var(--live-border)] hover:bg-[var(--live-chip-hover)] px-3 py-2.5 flex items-center justify-between gap-2"
              >
                <span className="truncate text-sm">{d.name}</span>
                <StatusBadge status={d.status} />
              </button>
            ))}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2">
          <NavBtn active={false} onClick={() => navigate(`/trips/${tripId}/active/map`)}>
            Full map
          </NavBtn>
          <NavBtn active onClick={() => navigate(`/trips/${tripId}/active`)}>
            Trip
          </NavBtn>
          <NavBtn onClick={() => navigate(`/trips/${tripId}/expenses`)}>Expenses</NavBtn>
        </div>
        <SecondaryButton
          className="w-full"
          onClick={() => navigate(`/trips/${tripId}/active/copilot`)}
        >
          AI Copilot
        </SecondaryButton>
      </div>

      {selected && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 md:left-auto md:right-0 md:w-[380px] border-t border-[var(--live-border)] p-5 rounded-t-2xl"
          style={{ background: 'var(--live-panel)', boxShadow: 'var(--shadow-lg)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display font-semibold text-lg">{selected.name}</h3>
              <StatusBadge status={selected.status} className="mt-2" />
            </div>
            <button
              type="button"
              className="text-[var(--live-text-muted)]"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
          <p className="mt-3 text-sm text-[var(--live-text-muted)]">
            {selected.recommendationReason || selected.description}
          </p>
          <p className="mt-2 text-xs text-[var(--live-text-muted)]">
            Visit ~{selected.recommendedDurationMinutes} min
          </p>
          <p className="mt-2 text-xs text-[var(--live-text-muted)]">
            {weather
              ? `Weather: ${weather.temp}°C · ${weather.description}`
              : 'Weather unavailable.'}
          </p>
          <div className="mt-4 flex gap-2">
            {selected.status !== 'VISITED' && (
              <PrimaryButton onClick={() => handleVisit(selected)}>Mark Visited</PrimaryButton>
            )}
            {selected.status !== 'SKIPPED' && selected.status !== 'VISITED' && (
              <SecondaryButton onClick={() => setSkipOpen(true)}>Skip</SecondaryButton>
            )}
          </div>
        </div>
      )}

      <Modal
        open={skipOpen}
        title="Skip this destination?"
        confirmLabel="Skip"
        onClose={() => setSkipOpen(false)}
        onConfirm={handleSkip}
      >
        Skipped stops are tracked separately and never counted as visited. YOLO may suggest a
        replan afterward.
      </Modal>

      <Modal
        open={replanOpen}
        title="Replan suggested"
        confirmLabel={replanning ? 'Applying…' : 'Apply replan'}
        onClose={() => setReplanOpen(false)}
        onConfirm={handleApplyReplan}
      >
        {replanPreview ? (
          <div className="space-y-2 text-sm text-[var(--text-secondary)]">
            <p>{replanPreview.summary}</p>
            {replanPreview.removed?.length > 0 && (
              <p>Removed: {replanPreview.removed.join(', ')}</p>
            )}
            {replanPreview.moved?.length > 0 && (
              <p>Moved: {replanPreview.moved.map((m) => m.name).join(', ')}</p>
            )}
          </div>
        ) : (
          <p>Your itinerary can be adjusted for remaining stops.</p>
        )}
      </Modal>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-[var(--live-text-muted)]">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}

function NavBtn({ children, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl py-2 text-xs font-semibold',
        active
          ? 'yolo-btn-primary text-[var(--text-inverse)]'
          : 'bg-[var(--live-chip)] text-[var(--live-text-muted)] hover:bg-[var(--live-chip-hover)]',
      )}
    >
      {children}
    </button>
  );
}
