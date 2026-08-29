import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button.jsx';
import { getTrip, confirmBooking, saveStayStep } from '@/features/trips/tripApi.js';
import { useWizardStore } from './wizardStore.js';
import { cn } from '@/lib/cn.js';

const TIERS = [
  { id: 'BUDGET', label: 'Budget', hint: 'Clean & affordable' },
  { id: 'STANDARD', label: 'Standard', hint: 'Comfortable mid-range' },
  { id: 'PREMIUM', label: 'Premium', hint: 'Upscale stays' },
];

const SAMPLE_STAYS = [
  {
    name: 'City Nest Hotel',
    rating: 4.2,
    price: '₹2,400 / night',
    location: 'Near city center',
    amenities: 'Wifi · Breakfast · AC',
    distance: '1.2 km from destination',
    image:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    url: 'https://www.booking.com/',
  },
  {
    name: 'Valley View Stay',
    rating: 4.6,
    price: '₹4,800 / night',
    location: 'Hillside',
    amenities: 'Wifi · Parking · Mountain view',
    distance: '3.5 km from destination',
    image:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    url: 'https://www.airbnb.com/',
  },
  {
    name: 'Heritage Boutique',
    rating: 4.8,
    price: '₹7,500 / night',
    location: 'Historic quarter',
    amenities: 'Spa · Restaurant · Concierge',
    distance: '0.8 km from destination',
    image:
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80',
    url: 'https://www.booking.com/',
  },
];

export default function StayPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tripId = params.get('tripId');
  const { trip, setTrip, stayTier, setStayTier } = useWizardStore();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [note, setNote] = useState(null);

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

  const goDiscover = async (skip = false) => {
    setSaving(true);
    setError(null);
    try {
      await saveStayStep(tripId, { tier: stayTier, skip });
      navigate(`/trips/new/discover?tripId=${tripId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addBooking = async (stay) => {
    setSaving(true);
    setError(null);
    try {
      await confirmBooking(tripId, {
        type: 'HOTEL',
        provider: 'External',
        title: stay.name,
        arrivalLocation: trip?.destinationName,
        status: 'CONFIRMED',
        bookingUrl: stay.url,
      });
      setNote('Stay booking saved after your confirmation.');
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
      <h1 className="text-3xl font-display font-semibold text-[var(--text-primary)]">Accommodation</h1>
      <p className="mt-2 text-[var(--text-secondary)]">
        Choose a preference, open a provider to book, then add the confirmed stay.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {TIERS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setStayTier(t.id)}
            className={cn(
              'rounded-2xl px-4 py-3 text-left border min-w-[140px]',
              stayTier === t.id
                ? 'bg-primary-500 text-white border-primary-500'
                : 'bg-[var(--surface-elevated)] text-[var(--text-primary)] border-[var(--border)]',
            )}
          >
            <p className="font-semibold">{t.label}</p>
            <p className={cn('text-xs mt-0.5', stayTier === t.id ? 'text-white/80' : 'text-[var(--text-muted)]')}>
              {t.hint}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-6 grid md:grid-cols-3 gap-4">
        {SAMPLE_STAYS.map((stay) => (
          <article key={stay.name} className="rounded-2xl overflow-hidden bg-[var(--surface-elevated)] shadow-card">
            <img src={stay.image} alt="" className="h-40 w-full object-cover" />
            <div className="p-4">
              <h3 className="font-semibold text-[var(--text-primary)]">{stay.name}</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                ★ {stay.rating} · {stay.price}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-2">{stay.location}</p>
              <p className="text-xs text-[var(--text-muted)]">{stay.amenities}</p>
              <p className="text-xs text-[var(--text-muted)]">{stay.distance}</p>
              <div className="mt-4 flex flex-col gap-2">
                <a
                  href={stay.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center rounded-full bg-[var(--live-bg)] text-white text-sm font-semibold px-4 py-2"
                >
                  View / Book
                </a>
                <SecondaryButton disabled={saving} onClick={() => addBooking(stay)}>
                  Add Booking
                </SecondaryButton>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-4 text-xs text-[var(--text-muted)]">
        Sample listings for preference browsing. Booking confirmation is only stored after you
        explicitly add it.
      </p>

      {note && (
        <p className="mt-4 text-sm text-secondary-700 bg-secondary-50 border border-secondary-100 rounded-xl px-4 py-3">
          {note}
        </p>
      )}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-8 flex flex-wrap gap-3">
        <SecondaryButton onClick={() => navigate(`/trips/new/booking?tripId=${tripId}`)}>
          Back
        </SecondaryButton>
        <SecondaryButton disabled={saving} onClick={() => goDiscover(true)}>
          Skip for now
        </SecondaryButton>
        <PrimaryButton disabled={saving} onClick={() => goDiscover(false)}>
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
}
