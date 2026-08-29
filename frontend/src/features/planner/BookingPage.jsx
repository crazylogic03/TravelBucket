import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button.jsx';
import { getTrip, confirmBooking } from '@/features/trips/tripApi.js';
import { useWizardStore } from './wizardStore.js';

const PROVIDERS = {
  FLIGHT: [
    {
      name: 'Google Flights',
      url: 'https://www.google.com/travel/flights',
      note: 'Search and compare flight options',
    },
    {
      name: 'MakeMyTrip',
      url: 'https://www.makemytrip.com/flights/',
      note: 'Popular India flight booking',
    },
  ],
  TRAIN: [
    {
      name: 'IRCTC',
      url: 'https://www.irctc.co.in/',
      note: 'Official Indian Railways booking',
    },
    {
      name: 'ConfirmTkt',
      url: 'https://www.confirmtkt.com/',
      note: 'Train search and PNR tools',
    },
  ],
  BUS: [
    {
      name: 'redBus',
      url: 'https://www.redbus.in/',
      note: 'Bus tickets across India',
    },
  ],
  CAR: [
    {
      name: 'Self-drive',
      url: null,
      note: 'You are driving — no ticket booking required',
    },
  ],
  BIKE: [
    {
      name: 'Self-ride',
      url: null,
      note: 'Bike trip — no ticket booking required',
    },
  ],
};

export default function BookingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tripId = params.get('tripId');
  const { trip, setTrip } = useWizardStore();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tripId) {
      navigate('/trips/new/basics');
      return;
    }
    if (!trip || trip.id !== tripId) {
      getTrip(tripId)
        .then(({ trip: t }) => setTrip(t))
        .catch(() => navigate('/trips/new/basics'));
    }
  }, [tripId, trip, setTrip, navigate]);

  const mode = trip?.transportMode || 'CAR';
  const isPublic = ['FLIGHT', 'TRAIN', 'BUS'].includes(mode);
  const providers = PROVIDERS[mode] || PROVIDERS.CAR;

  const searchHint = useMemo(() => {
    if (!trip) return '';
    return `${trip.startLocationName} → ${trip.destinationName}`;
  }, [trip]);

  const handleBooked = async (provider) => {
    if (!tripId || !isPublic) {
      navigate(`/trips/new/stay?tripId=${tripId}`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await confirmBooking(tripId, {
        type: mode,
        provider: provider.name,
        title: `${mode} — ${searchHint}`,
        departureLocation: trip.startLocationName,
        arrivalLocation: trip.destinationName,
        status: 'CONFIRMED',
        bookingUrl: provider.url,
      });
      setMessage('Booking recorded. YOLO never claims a booking unless you confirm it.');
      const { trip: refreshed } = await getTrip(tripId);
      setTrip(refreshed);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!trip) return <p className="text-[var(--text-secondary)]">Loading…</p>;

  return (
    <div>
      <h1 className="text-3xl font-display font-semibold text-[var(--text-primary)]">Booking hub</h1>
      <p className="mt-2 text-[var(--text-secondary)]">
        Open a legitimate provider, complete booking externally, then confirm here.
      </p>

      <div className="mt-6 rounded-2xl border border-primary-100 bg-primary-50/80 px-5 py-4 text-sm text-[var(--text-primary)]">
        <p className="font-semibold text-[var(--text-primary)]">Why is booking shown here?</p>
        <p className="mt-2 leading-relaxed">
          YOLO helps organize booking flows for transport tickets and related travel purchases.
          External providers handle the actual reservation. Confirming here only records that you
          completed booking outside YOLO — it does not purchase a ticket for you.
        </p>
      </div>

      <div className="mt-6 rounded-2xl bg-[var(--surface-elevated)] shadow-card p-5">
        <p className="text-sm text-[var(--text-muted)]">Journey</p>
        <p className="font-display font-semibold text-xl text-[var(--text-primary)] mt-1">{searchHint}</p>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {trip.startDate} → {trip.endDate} · {mode}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {providers.map((p) => (
          <div
            key={p.name}
            className="rounded-2xl bg-[var(--surface-elevated)] shadow-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div>
              <h3 className="font-semibold text-[var(--text-primary)]">{p.name}</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{p.note}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {p.url && (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full bg-[var(--live-bg)] text-white text-sm font-semibold px-4 py-2"
                >
                  Book / View Options
                </a>
              )}
              {isPublic && (
                <SecondaryButton disabled={saving} onClick={() => handleBooked(p)}>
                  I&apos;ve booked this
                </SecondaryButton>
              )}
            </div>
          </div>
        ))}
      </div>

      {message && (
        <p className="mt-4 text-sm text-secondary-700 bg-secondary-50 border border-secondary-100 rounded-xl px-4 py-3">
          {message}
        </p>
      )}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8 flex gap-3">
        <SecondaryButton onClick={() => navigate(`/trips/new/transport?tripId=${tripId}`)}>
          Back
        </SecondaryButton>
        <PrimaryButton onClick={() => navigate(`/trips/new/stay?tripId=${tripId}`)}>
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
}
