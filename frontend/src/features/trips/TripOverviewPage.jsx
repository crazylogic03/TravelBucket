import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@/layouts/AppShell.jsx';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button.jsx';
import { StatusBadge } from '@/components/ui/StatusBadge.jsx';
import { ErrorState } from '@/components/ui/EmptyState.jsx';
import { Skeleton } from '@/components/ui/Skeleton.jsx';
import { StatCard } from '@/components/ui/StatCard.jsx';
import { CompactRouteMap } from '@/components/dashboard/CompactRouteMap.jsx';
import { TravelImage } from '@/components/common/TravelImage.jsx';
import { HERO_BACKPACK } from '@/lib/travelImagery.js';
import { Modal } from '@/components/ui/Modal.jsx';
import { getTrip, getDirections, startTrip } from '@/features/trips/tripApi.js';

export default function TripOverviewPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [routeMeta, setRouteMeta] = useState(null);
  const [startOpen, setStartOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setTrip(null);
    setRouteGeometry(null);
    setRouteMeta(null);
    setError(null);
    (async () => {
      try {
        const data = await getTrip(tripId);
        if (cancelled) return;
        setTrip(data.trip);
        try {
          const dir = await getDirections(
            data.trip.startLongitude,
            data.trip.startLatitude,
            data.trip.destinationLongitude,
            data.trip.destinationLatitude,
          );
          if (!cancelled) {
            setRouteGeometry(dir.route?.geometry || null);
            setRouteMeta(dir.route || null);
          }
        } catch {
          if (!cancelled) setRouteGeometry(null);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const selected = (trip?.destinations || []).filter((d) => d.selected);
  const days = useMemo(() => trip?.itineraryDays || [], [trip?.itineraryDays]);
  const travelDay = useMemo(() => days.find((d) => d.dayNumber === 0), [days]);
  const destinationDays = useMemo(
    () => days.filter((d) => d.dayNumber > 0).sort((a, b) => a.dayNumber - b.dayNumber),
    [days],
  );

  const handleStart = async () => {
    setStarting(true);
    try {
      const { trip: updated } = await startTrip(tripId);
      setTrip(updated);
      setStartOpen(false);
      navigate(`/trips/${tripId}/live`);
    } catch (err) {
      setError(err.message);
      setStartOpen(false);
    } finally {
      setStarting(false);
    }
  };

  return (
    <AppShell title="Trip" subtitle={trip?.title}>
      {loading && <Skeleton className="h-72 w-full" />}
      {error && <ErrorState description={error} onRetry={() => navigate(0)} />}
      {trip && (
        <>
          <div className="rounded-3xl overflow-hidden relative h-52 md:h-64 mb-6 bg-[var(--surface-muted)] shadow-card">
            <TravelImage
              src={selected[0]?.imageUrl || HERO_BACKPACK}
              label={trip.destinationName || trip.title}
              alt=""
              className="absolute inset-0 h-full w-full"
              imgClassName="h-full w-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/25 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
              <StatusBadge status={trip.status} />
              <h1 className="mt-3 text-3xl md:text-4xl font-display font-semibold">{trip.title}</h1>
              <p className="text-white/80 mt-2 text-base md:text-lg">
                {trip.startLocationName} → {trip.destinationName}
              </p>
              <p className="text-white/55 text-sm mt-1">
                {trip.startDate} – {trip.endDate} · {trip.travelerCount} travelers · {trip.currency}{' '}
                {Number(trip.budgetAmount).toLocaleString()}
              </p>
              {trip.status === 'PLANNED' && (
                <div className="mt-5">
                  <PrimaryButton
                    className="!px-8 !py-3.5 !text-base shadow-lg"
                    onClick={() => setStartOpen(true)}
                  >
                    Start Trip
                  </PrimaryButton>
                </div>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-5 gap-6 mb-8">
            <div className="lg:col-span-3">
              <CompactRouteMap
                trip={trip}
                routeGeometry={routeGeometry}
                routeMeta={routeMeta}
                markers={[
                  {
                    latitude: trip.startLatitude,
                    longitude: trip.startLongitude,
                    label: 'Start',
                    color: '#2ECC71',
                  },
                  {
                    latitude: trip.destinationLatitude,
                    longitude: trip.destinationLongitude,
                    label: 'Destination',
                    color: '#FF9966',
                  },
                  ...selected.map((d) => ({
                    latitude: d.latitude,
                    longitude: d.longitude,
                    label: d.name,
                    color: '#4A90E2',
                  })),
                ]}
                fullMapHref={
                  trip.status === 'ACTIVE' ? `/trips/${tripId}/active/map` : undefined
                }
              />
            </div>
            <div className="lg:col-span-2 grid gap-4 content-start">
              <StatCard
                label="Budget"
                value={`${trip.currency} ${Number(trip.budgetAmount).toLocaleString()}`}
              />
              <StatCard label="Progress" value={`${Math.round(trip.progressPercentage || 0)}%`} />
              <StatCard
                label="Stops"
                value={String(selected.length)}
                hint={`${destinationDays.length} destination days`}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            {trip.status === 'PLANNED' && (
              <PrimaryButton
                className="!px-8 !py-3.5 !text-base shadow-lg"
                onClick={() => setStartOpen(true)}
              >
                Start Trip
              </PrimaryButton>
            )}
            {trip.status === 'ACTIVE' && (
              <PrimaryButton onClick={() => navigate(`/trips/${trip.id}/live`)}>
                Continue Live Trip
              </PrimaryButton>
            )}
            {trip.status === 'DRAFT' && (
              <SecondaryButton
                onClick={() =>
                  navigate(`/trips/new/${trip.wizardStep || 'basics'}?tripId=${trip.id}`)
                }
              >
                Continue Planning
              </SecondaryButton>
            )}
            <SecondaryButton
              onClick={() => {
                document.getElementById('itinerary')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              View Itinerary
            </SecondaryButton>
            <SecondaryButton onClick={() => navigate(`/trips/${trip.id}/expenses`)}>
              Expenses
            </SecondaryButton>
            <SecondaryButton onClick={() => navigate(`/trips/${trip.id}/copilot`)}>
              AI Copilot
            </SecondaryButton>
            {(trip.status === 'ACTIVE' || trip.status === 'COMPLETED') && (
              <SecondaryButton onClick={() => navigate(`/trips/${trip.id}/summary`)}>
                Trip Summary
              </SecondaryButton>
            )}
            <SecondaryButton onClick={() => navigate(`/trips/${trip.id}/edit`)}>
              Edit Trip
            </SecondaryButton>
          </div>

          <div className="mb-10 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-semibold text-[var(--text-primary)]">Unlock Premium Concierge</p>
              <p className="text-sm text-[var(--text-secondary)]">
                ₹99 Razorpay TEST MODE — no real money charged.
              </p>
            </div>
            <PrimaryButton onClick={() => navigate(`/trips/${trip.id}/concierge`)}>
              Pay ₹99 (TEST)
            </PrimaryButton>
          </div>

          <section className="mb-10">
            <h2 className="font-display font-semibold text-lg mb-3">Selected destinations</h2>
            {selected.length === 0 ? (
              <p className="text-[var(--text-secondary)] text-sm">
                No destinations selected yet.{' '}
                <Link
                  className="text-primary-600 font-medium"
                  to={`/trips/new/discover?tripId=${trip.id}`}
                >
                  Discover places
                </Link>
              </p>
            ) : (
              <ul className="grid sm:grid-cols-2 gap-3">
                {selected.map((d) => (
                  <li
                    key={d.id}
                    className="rounded-3xl bg-[var(--surface-elevated)] shadow-card px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {d.imageUrl && (
                        <img
                          src={d.imageUrl}
                          alt=""
                          className="h-12 w-12 rounded-2xl object-cover shrink-0"
                        />
                      )}
                      <span className="font-medium text-[var(--text-primary)] truncate">{d.name}</span>
                    </div>
                    <StatusBadge status={d.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section id="itinerary" className="mb-6">
            <h2 className="font-display font-semibold text-xl mb-4">Itinerary</h2>
            {!days.length ? (
              <p className="text-sm text-[var(--text-secondary)]">
                No itinerary yet.{' '}
                <Link
                  className="text-primary-600 font-medium"
                  to={`/trips/new/optimize?tripId=${trip.id}`}
                >
                  Optimize trip
                </Link>
              </p>
            ) : (
              <div className="space-y-6">
                {travelDay && (
                  <div className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-6 shadow-card">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                        <TravelIcon />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                          Travel leg
                        </p>
                        <h3 className="mt-1 font-display font-semibold text-lg text-[var(--text-primary)]">
                          {travelDay.title || 'Getting there'}
                        </h3>
                        <p className="mt-1 text-xs text-sky-800/80">
                          Transportation timeline — separate from your destination days.
                        </p>
                        {travelDay.notes && (
                          <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                            {travelDay.notes}
                          </p>
                        )}
                        <ul className="mt-4 space-y-2">
                          {(travelDay.items || []).map((item) => (
                            <ItineraryItem key={item.id} item={item} />
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {destinationDays.length > 0 && (
                  <div className="relative pl-2">
                    <div className="absolute left-[19px] top-3 bottom-3 w-px bg-[var(--surface-muted)]" />
                    <div className="space-y-5">
                      {destinationDays.map((day) => (
                        <div key={day.id} className="relative flex gap-4">
                          <div className="relative z-10 h-10 w-10 rounded-full bg-[var(--live-bg)] text-white text-sm font-semibold flex items-center justify-center shrink-0 shadow-sm">
                            {day.dayNumber}
                          </div>
                          <div className="flex-1 rounded-3xl bg-[var(--surface-elevated)] shadow-card p-5 min-w-0">
                            <h3 className="font-display font-semibold text-[var(--text-primary)]">
                              Day {day.dayNumber}
                              {day.title ? ` · ${day.title}` : ''}
                            </h3>
                            {day.notes && (
                              <p className="mt-1 text-sm text-[var(--text-muted)]">{day.notes}</p>
                            )}
                            <ul className="mt-4 space-y-2.5">
                              {(day.items || []).map((item) => (
                                <ItineraryItem key={item.id} item={item} />
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <Modal
            open={startOpen}
            title="Ready to start your adventure?"
            confirmLabel={starting ? 'Starting…' : 'Start Trip'}
            onClose={() => setStartOpen(false)}
            onConfirm={handleStart}
          >
            This marks the trip as in progress (ACTIVE), opens your live travel workspace with map,
            today&apos;s itinerary, and AI Copilot. Location access improves live tracking but is
            optional — the cockpit still works if you decline.
          </Modal>
        </>
      )}
    </AppShell>
  );
}

function ItineraryItem({ item }) {
  const badge =
    item.type === 'TRANSPORT'
      ? 'bg-sky-100 text-sky-800'
      : item.type === 'ACTIVITY'
        ? 'bg-emerald-50 text-emerald-800'
        : 'bg-[var(--surface-muted)] text-[var(--text-secondary)]';

  return (
    <li className="text-sm text-[var(--text-secondary)] flex gap-3 items-start">
      <span className="w-16 text-[var(--text-muted)] shrink-0 tabular-nums">{item.startTime || '—'}</span>
      <span className="min-w-0">
        <span
          className={`inline-block text-[10px] uppercase tracking-wide font-semibold mr-2 px-1.5 py-0.5 rounded ${badge}`}
        >
          {item.type || 'ITEM'}
        </span>
        {item.title}
      </span>
    </li>
  );
}

function TravelIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12h18M12 3l9 9-9 9" />
    </svg>
  );
}
