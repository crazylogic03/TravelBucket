import { Link, useSearchParams } from 'react-router-dom';
import { PrimaryButton } from '@/components/ui/Button.jsx';

/**
 * Placeholder for wizard steps beyond Milestone 5.
 */
export default function ComingSoonStep({ title, description }) {
  const [params] = useSearchParams();
  const tripId = params.get('tripId');

  return (
    <div className="rounded-2xl bg-[var(--surface-elevated)] shadow-card p-8 text-center">
      <h1 className="text-2xl font-display font-semibold text-[var(--text-primary)]">{title}</h1>
      <p className="mt-2 text-[var(--text-secondary)] max-w-lg mx-auto">{description}</p>
      <div className="mt-6 flex justify-center gap-3">
        {tripId && (
          <Link to={`/trips/${tripId}`}>
            <PrimaryButton>View trip</PrimaryButton>
          </Link>
        )}
        <Link to="/dashboard" className="text-sm font-semibold text-primary-600 self-center">
          Dashboard
        </Link>
      </div>
    </div>
  );
}

export function DiscoverComingSoon() {
  return (
    <ComingSoonStep
      title="AI Discovery"
      description="Milestone 8 will generate up to 30 route-aware destination candidates here."
    />
  );
}

export function SelectComingSoon() {
  return (
    <ComingSoonStep
      title="Destination selection"
      description="Milestone 8–9 will let you reorder and finalize selected destinations."
    />
  );
}

export function OptimizeComingSoon() {
  return (
    <ComingSoonStep
      title="AI Optimization"
      description="Milestone 9 will score and optimize your itinerary here."
    />
  );
}

export function ReviewComingSoon() {
  return (
    <ComingSoonStep
      title="Final review"
      description="Milestone 10 will present the day-by-day itinerary for acceptance."
    />
  );
}
