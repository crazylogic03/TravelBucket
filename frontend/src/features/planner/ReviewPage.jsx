import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button.jsx';
import { MapPanel } from '@/components/MapPanel.jsx';
import {
  getTrip,
  finalizeTrip,
  optimizeTrip,
  getWeather,
  getDirections,
} from '@/features/trips/tripApi.js';
import { useWizardStore } from './wizardStore.js';

export default function ReviewPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tripId = params.get('tripId');
  const { setTrip } = useWizardStore();

  const [trip, setLocalTrip] = useState(null);
  const [weather, setWeather] = useState(null);
  const [routeGeometry, setRouteGeometry] = useState(null);
  const [saving, setSaving] = useState(false);
  const [regen, setRegen] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    const { trip: t } = await getTrip(tripId);
    setLocalTrip(t);
    setTrip(t);
    try {
      const w = await getWeather(t.destinationLatitude, t.destinationLongitude);
      setWeather(w.weather);
    } catch {
      setWeather(null);
    }
    try {
      const dir = await getDirections(
        t.startLongitude,
        t.startLatitude,
        t.destinationLongitude,
        t.destinationLatitude,
      );
      setRouteGeometry(dir.route?.geometry || null);
    } catch {
      setRouteGeometry(null);
    }
  };

  useEffect(() => {
    if (!tripId) {
      navigate('/trips/new/basics');
      return;
    }
    setLocalTrip(null);
    setWeather(null);
    setRouteGeometry(null);
    setError(null);
    load().catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const handleAccept = async () => {
    setSaving(true);
    setError(null);
    try {
      const { trip: finalized } = await finalizeTrip(tripId);
      setTrip(finalized);
      navigate(`/trips/${tripId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    setRegen(true);
    setError(null);
    try {
      await optimizeTrip(tripId);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setRegen(false);
    }
  };

  if (!trip) {
    return <p className="text-[var(--text-secondary)]">{error || 'Loading itinerary…'}</p>;
  }

  const markers = [
    {
      latitude: trip.startLatitude,
      longitude: trip.startLongitude,
      label: trip.startLocationName,
      color: '#2ECC71',
    },
    {
      latitude: trip.destinationLatitude,
      longitude: trip.destinationLongitude,
      label: trip.destinationName,
      color: '#FF9966',
    },
    ...(trip.destinations || [])
      .filter((d) => d.selected)
      .map((d) => ({
        latitude: d.latitude,
        longitude: d.longitude,
        label: d.name,
        color: '#4A90E2',
      })),
  ];

  return (
    <div>
      <h1 className="text-3xl font-display font-semibold text-[var(--text-primary)]">{trip.title}</h1>
      <p className="mt-2 text-[var(--text-secondary)]">
        {trip.startLocationName} → {trip.destinationName}
      </p>
      <p className="text-sm text-[var(--text-muted)] mt-1">
        {trip.startDate} – {trip.endDate} · {trip.travelerCount} travelers · {trip.currency}{' '}
        {Number(trip.budgetAmount).toLocaleString()}
      </p>

      <div className="mt-6">
        <MapPanel
          key={`${trip.id}-${routeGeometry ? 'route' : 'noroute'}-${markers.length}`}
          className="h-72 w-full rounded-2xl overflow-hidden shadow-card"
          center={{
            latitude: trip.destinationLatitude,
            longitude: trip.destinationLongitude,
          }}
          markers={markers}
          routeGeometry={routeGeometry}
        />
      </div>

      <div className="mt-4 rounded-xl bg-[var(--surface-elevated)] shadow-card px-4 py-3 text-sm text-[var(--text-secondary)]">
        {weather ? (
          <span>
            Destination weather: {weather.temp}°C · {weather.description}
            {weather.humidity != null ? ` · ${weather.humidity}% humidity` : ''}
          </span>
        ) : (
          <span>Weather unavailable.</span>
        )}
      </div>

      <div className="mt-8 space-y-6">
        {(trip.itineraryDays || []).map((day) => (
          <section key={day.id} className="rounded-2xl bg-[var(--surface-elevated)] shadow-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display font-semibold text-lg text-[var(--text-primary)]">
                DAY {day.dayNumber}
                {day.title ? ` · ${day.title}` : ''}
              </h2>
              {day.estimatedCost != null && (
                <p className="text-sm text-[var(--text-muted)]">
                  est. {trip.currency} {Number(day.estimatedCost).toLocaleString()}
                </p>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1">{day.date}</p>
            <ol className="mt-4 space-y-3">
              {(day.items || []).map((item) => (
                <li key={item.id} className="flex gap-3 text-sm">
                  <div className="w-24 shrink-0 text-[var(--text-muted)]">
                    {item.startTime || '—'}
                    {item.endTime ? `–${item.endTime}` : ''}
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      {item.title}{' '}
                      <span className="text-xs font-normal text-[var(--text-muted)]">{item.type}</span>
                    </p>
                    {item.description && (
                      <p className="text-[var(--text-secondary)] mt-0.5">{item.description}</p>
                    )}
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {item.durationMinutes ? `${item.durationMinutes} min · ` : ''}
                      {item.estimatedCost != null
                        ? `est. ${Number(item.estimatedCost).toLocaleString()}`
                        : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
        {!trip.itineraryDays?.length && (
          <p className="text-[var(--text-secondary)]">No itinerary yet. Run optimization first.</p>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8 flex flex-wrap gap-3">
        <SecondaryButton onClick={() => navigate(`/trips/${tripId}/edit`)}>
          Edit Trip
        </SecondaryButton>
        <SecondaryButton disabled={regen} onClick={handleRegenerate}>
          {regen ? 'Regenerating…' : 'Regenerate'}
        </SecondaryButton>
        <PrimaryButton disabled={saving || !trip.itineraryDays?.length} onClick={handleAccept}>
          {saving ? 'Saving…' : 'Accept & Save Trip'}
        </PrimaryButton>
      </div>
    </div>
  );
}
