import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button.jsx';
import { getTrip, updateTripTransport } from '@/features/trips/tripApi.js';
import { useWizardStore } from './wizardStore.js';
import { TRANSPORT_ICONS } from '@/lib/travelImagery.js';
import { cn } from '@/lib/cn.js';

const MODES = [
  {
    id: 'FLIGHT',
    title: 'Flight',
    tag: 'Fastest',
    description: 'Best for long distances. Continues to booking providers.',
    suitability: '800km+',
    durationHint: '1h 45m',
    costHint: 'From ₹4,500',
  },
  {
    id: 'TRAIN',
    title: 'Train',
    tag: 'Comfortable',
    description: 'Scenic travel with reliable schedules.',
    suitability: 'City corridors',
    durationHint: '10h 30m',
    costHint: 'From ₹800',
  },
  {
    id: 'BUS',
    title: 'Bus',
    tag: 'Affordable',
    description: 'Budget-friendly public transport across regions.',
    suitability: 'Short hops',
    durationHint: '12h',
    costHint: 'From ₹600',
  },
  {
    id: 'CAR',
    title: 'Car',
    tag: 'Flexible',
    description: 'Road trip with full control of stops.',
    suitability: 'Scenic routes',
    durationHint: 'Varies',
    costHint: 'Fuel + tolls',
  },
  {
    id: 'BIKE',
    title: 'Bike Trip',
    tag: 'Adventure',
    description: 'Two-wheeler journey for thrill seekers.',
    suitability: 'Open roads',
    durationHint: 'Varies',
    costHint: 'Fuel only',
  },
];

export default function TransportPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tripId = params.get('tripId');
  const { setTrip, vehicleDetails, setVehicleDetails } = useWizardStore();

  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tripId) {
      navigate('/trips/new/basics');
      return;
    }
    getTrip(tripId)
      .then(({ trip }) => {
        setTrip(trip);
        if (trip.transportMode) setMode(trip.transportMode);
      })
      .catch(() => navigate('/trips/new/basics'));
  }, [tripId, navigate, setTrip]);

  const handleContinue = async () => {
    if (!mode || !tripId) return;
    setLoading(true);
    setError(null);
    try {
      const { trip } = await updateTripTransport(tripId, {
        transportMode: mode,
        vehicleDetails: ['CAR', 'BIKE'].includes(mode) ? vehicleDetails : undefined,
      });
      setTrip(trip);
      navigate(`/trips/new/booking?tripId=${tripId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-primary)] font-semibold">
        Step 2
      </p>
      <h1 className="mt-2 text-3xl font-display font-semibold text-[var(--text-primary)]">
        How do you want to get there?
      </h1>
      <p className="mt-2 text-[var(--text-secondary)]">
        Travel is a separate leg — your destination days stay focused on exploring.
      </p>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODES.map((m, i) => (
          <motion.button
            key={m.id}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setMode(m.id)}
            className={cn(
              'text-left rounded-3xl border p-5 transition-all yolo-card-hover',
              mode === m.id
                ? 'border-[var(--brand-primary)] bg-[var(--brand-soft)] ring-2 ring-[color-mix(in_srgb,var(--brand-primary)_30%,transparent)]'
                : 'border-[var(--border-subtle)] bg-[var(--surface-raised)] hover:border-[var(--border-strong)]',
            )}
            style={{ boxShadow: mode === m.id ? 'var(--shadow-glow-teal)' : 'var(--shadow-soft)' }}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-3xl">{TRANSPORT_ICONS[m.id]}</span>
              {mode === m.id && (
                <span className="yolo-chip bg-teal-500 text-white text-[10px]">Selected</span>
              )}
            </div>
            <h3 className="mt-3 font-display font-semibold text-lg text-[var(--text-primary)]">
              {m.title}
            </h3>
                <p className="text-xs font-semibold text-[var(--brand-primary)] mt-0.5">{m.tag}</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{m.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="yolo-chip bg-[var(--surface-muted)] text-[var(--text-secondary)]">
                {m.durationHint}
              </span>
              <span className="yolo-chip bg-[var(--surface-muted)] text-[var(--text-secondary)]">
                {m.costHint}
              </span>
            </div>
            <p className="mt-3 text-xs font-medium text-[var(--text-muted)]">{m.suitability}</p>
          </motion.button>
        ))}
      </div>

      {mode === 'CAR' && (
        <div className="mt-6 yolo-surface p-5 grid sm:grid-cols-3 gap-4">
          <Field
            label="Vehicle"
            value={vehicleDetails.vehicle || ''}
            onChange={(v) => setVehicleDetails({ ...vehicleDetails, vehicle: v })}
            placeholder="e.g. SUV"
          />
          <Field
            label="Fuel type"
            value={vehicleDetails.fuelType || ''}
            onChange={(v) => setVehicleDetails({ ...vehicleDetails, fuelType: v })}
            placeholder="Petrol / Diesel / EV"
          />
          <Field
            label="Mileage (km/l)"
            type="number"
            value={vehicleDetails.mileage || ''}
            onChange={(v) => setVehicleDetails({ ...vehicleDetails, mileage: Number(v) })}
          />
        </div>
      )}

      {mode === 'BIKE' && (
        <div className="mt-6 yolo-surface p-5 grid sm:grid-cols-2 gap-4">
          <Field
            label="Bike details"
            value={vehicleDetails.bikeDetails || ''}
            onChange={(v) => setVehicleDetails({ ...vehicleDetails, bikeDetails: v })}
            placeholder="e.g. Royal Enfield 350"
          />
          <Field
            label="Expected mileage"
            type="number"
            value={vehicleDetails.expectedMileage || ''}
            onChange={(v) =>
              setVehicleDetails({ ...vehicleDetails, expectedMileage: Number(v) })
            }
          />
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <SecondaryButton onClick={() => navigate(`/trips/new/basics?tripId=${tripId}`)}>
          Back
        </SecondaryButton>
        <PrimaryButton disabled={!mode || loading} onClick={handleContinue}>
          {loading ? 'Saving…' : 'Continue'}
        </PrimaryButton>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="yolo-input"
      />
    </div>
  );
}
