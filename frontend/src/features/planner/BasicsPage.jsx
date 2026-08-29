import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LocationAutocomplete } from './LocationAutocomplete.jsx';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button.jsx';
import { MapPanel } from '@/components/MapPanel.jsx';
import { RouteSuggestions } from '@/components/planner/RouteSuggestions.jsx';
import {
  createTrip,
  updateTripBasics,
  getTrip,
  getDirections,
  getRouteSuggestions,
  addRouteStops,
} from '@/features/trips/tripApi.js';
import { useWizardStore } from './wizardStore.js';
import { cn } from '@/lib/cn.js';

const INTERESTS = [
  'nature',
  'culture',
  'food',
  'adventure',
  'photography',
  'relaxation',
  'shopping',
  'nightlife',
];

const emptyInterests = () => Object.fromEntries(INTERESTS.map((k) => [k, false]));

export default function BasicsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tripIdParam = params.get('tripId');
  const { setTrip } = useWizardStore();

  const [start, setStart] = useState(null);
  const [destination, setDestination] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelerCount, setTravelerCount] = useState(2);
  const [budgetAmount, setBudgetAmount] = useState(30000);
  const [interests, setInterests] = useState(emptyInterests);
  const [routePreview, setRoutePreview] = useState(null);
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [routeSuggestions, setRouteSuggestions] = useState([]);
  const [routeSuggestLoading, setRouteSuggestLoading] = useState(false);
  const [routeSuggestError, setRouteSuggestError] = useState(null);
  const [routeDecisions, setRouteDecisions] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hydrating, setHydrating] = useState(!!tripIdParam);

  useEffect(() => {
    if (!tripIdParam) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const { trip } = await getTrip(tripIdParam);
        if (cancelled) return;
        setTrip(trip);
        setStart({
          name: trip.startLocationName,
          latitude: trip.startLatitude,
          longitude: trip.startLongitude,
        });
        setDestination({
          name: trip.destinationName,
          latitude: trip.destinationLatitude,
          longitude: trip.destinationLongitude,
        });
        setStartDate(trip.startDate);
        setEndDate(trip.endDate);
        setTravelerCount(trip.travelerCount);
        setBudgetAmount(Number(trip.budgetAmount));
        if (trip.preference) {
          setInterests({
            nature: trip.preference.nature,
            culture: trip.preference.culture,
            food: trip.preference.food,
            adventure: trip.preference.adventure,
            photography: trip.preference.photography,
            relaxation: trip.preference.relaxation,
            shopping: trip.preference.shopping,
            nightlife: trip.preference.nightlife,
          });
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tripIdParam, setTrip]);

  useEffect(() => {
    if (!start || !destination) {
      setRoutePreview(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await getDirections(
          start.longitude,
          start.latitude,
          destination.longitude,
          destination.latitude,
        );
        if (!cancelled) setRoutePreview(data.route);
      } catch {
        if (!cancelled) setRoutePreview(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [start, destination]);

  useEffect(() => {
    if (!start || !destination) {
      setRouteSuggestError(null);
      setRouteGeometry(null);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setRouteSuggestLoading(true);
      setRouteSuggestError(null);
      try {
        const data = await getRouteSuggestions({
          start: {
            name: start.name,
            latitude: start.latitude,
            longitude: start.longitude,
          },
          destination: {
            name: destination.name,
            latitude: destination.latitude,
            longitude: destination.longitude,
          },
          interests,
        });
        if (!cancelled) {
          setRouteSuggestions(data.suggestions || []);
          setRouteGeometry(data.route?.geometry || null);
          setRouteDecisions({});
        }
      } catch (err) {
        if (!cancelled) {
          setRouteSuggestError(err.message || 'Could not load route suggestions');
          setRouteSuggestions([]);
          setRouteGeometry(null);
        }
      } finally {
        if (!cancelled) setRouteSuggestLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    start?.name,
    start?.latitude,
    start?.longitude,
    destination?.name,
    destination?.latitude,
    destination?.longitude,
    interests,
  ]);

  const loadRouteSuggestions = async () => {
    if (!start || !destination) return;
    setRouteSuggestLoading(true);
    setRouteSuggestError(null);
    try {
      const data = await getRouteSuggestions({
        start: {
          name: start.name,
          latitude: start.latitude,
          longitude: start.longitude,
        },
        destination: {
          name: destination.name,
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
        interests,
      });
      setRouteSuggestions(data.suggestions || []);
      setRouteGeometry(data.route?.geometry || null);
    } catch (err) {
      setRouteSuggestError(err.message || 'Could not load route suggestions');
    } finally {
      setRouteSuggestLoading(false);
    }
  };

  const activeRouteGeometry = routeGeometry || routePreview?.geometry || null;

  const mapMarkers = useMemo(() => {
    const markers = [];
    if (start?.latitude != null) {
      markers.push({
        id: 'start',
        label: start.name,
        latitude: start.latitude,
        longitude: start.longitude,
        color: '#14B8A6',
      });
    }
    if (destination?.latitude != null) {
      markers.push({
        id: 'destination',
        label: destination.name,
        latitude: destination.latitude,
        longitude: destination.longitude,
        color: '#F97316',
      });
    }
    for (const place of routeSuggestions) {
      if (place.latitude == null) continue;
      const decision = routeDecisions[place.id] || 'pending';
      markers.push({
        id: place.id,
        label: place.name,
        latitude: place.latitude,
        longitude: place.longitude,
        color:
          decision === 'added' ? '#22C55E' : decision === 'skipped' ? '#94A3B8' : '#EAB308',
      });
    }
    return markers;
  }, [start, destination, routeSuggestions, routeDecisions]);

  const canSubmit = useMemo(
    () =>
      start &&
      destination &&
      startDate &&
      endDate &&
      travelerCount >= 1 &&
      budgetAmount > 0 &&
      endDate >= startDate,
    [start, destination, startDate, endDate, travelerCount, budgetAmount],
  );

  const handleContinue = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    const payload = {
      startLocationName: start.name,
      startLatitude: start.latitude,
      startLongitude: start.longitude,
      destinationName: destination.name,
      destinationLatitude: destination.latitude,
      destinationLongitude: destination.longitude,
      startDate,
      endDate,
      travelerCount: Number(travelerCount),
      budgetAmount: Number(budgetAmount),
      currency: 'INR',
      interests,
    };
    try {
      const data = tripIdParam
        ? await updateTripBasics(tripIdParam, payload)
        : await createTrip(payload);
      setTrip(data.trip);

      const accepted = routeSuggestions.filter((s) => routeDecisions[s.id] === 'added');
      if (accepted.length) {
        await addRouteStops(data.trip.id, accepted);
      }

      navigate(`/trips/new/transport?tripId=${data.trip.id}`);
    } catch (err) {
      setError(err.message || 'Could not save trip');
    } finally {
      setLoading(false);
    }
  };

  const bumpTravelers = (delta) => {
    setTravelerCount((prev) => Math.min(50, Math.max(1, Number(prev) + delta)));
  };

  if (hydrating) {
    return <p className="text-[var(--text-secondary)]">Loading draft…</p>;
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-0 lg:-mx-8 lg:-my-8 min-h-[calc(100vh-8rem)]">
      {/* Left — live route map */}
      <div className="relative hidden lg:flex lg:flex-col lg:sticky lg:top-0 lg:h-[calc(100vh-8rem)] lg:max-h-[720px] overflow-hidden bg-[var(--surface-muted)]">
        <MapPanel
          className="flex-1 w-full h-full min-h-[400px] rounded-none"
          routeGeometry={activeRouteGeometry}
          markers={mapMarkers}
        />
        <div className="absolute bottom-0 left-0 right-0 z-10 p-5 bg-gradient-to-t from-[var(--surface-elevated)] via-[var(--surface-elevated)]/95 to-transparent border-t border-[var(--border-subtle)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand)]">Your route</p>
          <h2 className="mt-1 text-lg font-display font-semibold text-[var(--text-primary)]">
            {start && destination
              ? `${start.name} → ${destination.name}`
              : 'Select origin and destination'}
          </h2>
          {routePreview && (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {(routePreview.distanceMeters / 1000).toFixed(0)} km ·{' '}
              {Math.round(routePreview.durationSeconds / 3600)}h{' '}
              {Math.round((routePreview.durationSeconds % 3600) / 60)}m driving
            </p>
          )}
          {routeSuggestions.length > 0 && (
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Yellow markers = suggested stops · Green = added · Gray = skipped
            </p>
          )}
        </div>
      </div>

      {/* Right — form */}
      <div className="lg:p-10 lg:overflow-y-auto">
        <h1 className="text-3xl font-display font-semibold text-[var(--text-primary)]">
          Plan Your Journey
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Where are you starting from, and where do you want to go?
        </p>

        <div className="mt-8 space-y-6 yolo-surface p-6 md:p-8">
          <div className="grid gap-5">
            <FieldBlock icon={<PinIcon />} title="Starting from">
              <LocationAutocomplete label="Starting location" value={start} onChange={setStart} />
            </FieldBlock>
            <FieldBlock icon={<FlagIcon />} title="Destination">
              <LocationAutocomplete label="Destination" value={destination} onChange={setDestination} />
            </FieldBlock>
          </div>

          {routePreview && (
            <div className="rounded-2xl bg-[var(--brand-soft)] border border-[color-mix(in_srgb,var(--brand-primary)_25%,transparent)] px-4 py-3 text-sm text-[var(--brand-primary)] flex items-center gap-2 lg:hidden">
              <RouteIcon />
              Route preview · {(routePreview.distanceMeters / 1000).toFixed(0)} km ·{' '}
              {Math.round(routePreview.durationSeconds / 3600)}h{' '}
              {Math.round((routePreview.durationSeconds % 3600) / 60)}m driving
            </div>
          )}

          {start && destination && (
            <RouteSuggestions
              suggestions={routeSuggestions}
              loading={routeSuggestLoading}
              error={routeSuggestError}
              decisions={routeDecisions}
              onDecision={(id, decision) =>
                setRouteDecisions((prev) => ({ ...prev, [id]: decision }))
              }
              onRetry={loadRouteSuggestions}
            />
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Start date
              </label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="yolo-input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                End date
              </label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="yolo-input" />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/50 p-4">
              <p className="text-sm font-medium text-[var(--text-secondary)] mb-3">Travelers</p>
              <div className="flex items-center gap-4">
                <StepButton aria-label="Fewer travelers" onClick={() => bumpTravelers(-1)}>
                  −
                </StepButton>
                <span className="text-2xl font-display font-semibold text-[var(--text-primary)] tabular-nums min-w-[2ch] text-center">
                  {travelerCount}
                </span>
                <StepButton aria-label="More travelers" onClick={() => bumpTravelers(1)}>
                  +
                </StepButton>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--border-subtle)] p-4 bg-gradient-to-br from-teal-500/5 to-coral-500/5">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Trip budget (INR)
              </label>
              <div className="flex items-baseline gap-1">
                <span className="text-lg text-[var(--text-muted)]">₹</span>
                <input
                  type="number"
                  min={1}
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  className="w-full text-2xl font-display font-semibold text-[var(--text-primary)] bg-transparent border-0 outline-none py-1"
                />
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                ₹{Number(budgetAmount || 0).toLocaleString()} across planning
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">Travel interests</p>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setInterests((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm capitalize transition-colors',
                    interests[key]
                      ? 'bg-gradient-to-r from-teal-600 to-ocean-700 text-white'
                      : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--border-subtle)]',
                  )}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {startDate && endDate && endDate < startDate && (
            <p className="text-sm text-red-500">End date must be on or after the start date.</p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <SecondaryButton onClick={() => navigate('/dashboard')}>Back</SecondaryButton>
            <PrimaryButton disabled={!canSubmit || loading} onClick={handleContinue}>
              {loading ? 'Saving…' : 'Continue'}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldBlock({ icon, title, children }) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-muted)]/40 p-4">
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-[var(--text-primary)]">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function StepButton({ children, ...props }) {
  return (
    <button
      type="button"
      className="h-10 w-10 rounded-full border border-[var(--border-strong)] text-lg font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-colors"
      {...props}
    >
      {children}
    </button>
  );
}

function PinIcon() {
  return (
    <svg className="w-4 h-4 text-[var(--brand-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg className="w-4 h-4 text-coral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 21V4m0 0h10l-1.5 3L19 10H5" />
    </svg>
  );
}

function RouteIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M8 6h6a4 4 0 0 1 4 4v2M16 18H10a4 4 0 0 1-4-4v-2" />
    </svg>
  );
}
