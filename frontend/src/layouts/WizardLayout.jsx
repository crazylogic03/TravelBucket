import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from './AppShell.jsx';
import { cn } from '@/lib/cn.js';

/** Conceptual groups over the 8 wizard routes */
const PHASES = [
  { key: 'where', label: 'Where', steps: ['basics'] },
  { key: 'travel', label: 'Travel', steps: ['transport', 'booking'] },
  { key: 'experience', label: 'Experience', steps: ['stay', 'discover', 'select'] },
  { key: 'itinerary', label: 'Itinerary', steps: ['optimize'] },
  { key: 'review', label: 'Review', steps: ['review'] },
];

const STEPS = [
  { key: 'basics', label: 'Where', path: '/trips/new/basics', phase: 'where' },
  { key: 'transport', label: 'Transport', path: '/trips/new/transport', phase: 'travel' },
  { key: 'booking', label: 'Booking', path: '/trips/new/booking', phase: 'travel' },
  { key: 'stay', label: 'Stay', path: '/trips/new/stay', phase: 'experience' },
  { key: 'discover', label: 'Discover', path: '/trips/new/discover', phase: 'experience' },
  { key: 'select', label: 'Select', path: '/trips/new/select', phase: 'experience' },
  { key: 'optimize', label: 'Itinerary', path: '/trips/new/optimize', phase: 'itinerary' },
  { key: 'review', label: 'Review', path: '/trips/new/review', phase: 'review' },
];

export function WizardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tripId = params.get('tripId');
  const activeIndex = STEPS.findIndex((s) => location.pathname.endsWith(s.key));
  const activeStep = STEPS[activeIndex];
  const activePhaseIndex = PHASES.findIndex((p) => p.key === activeStep?.phase);

  return (
    <AppShell title="Plan Your Journey" subtitle="Guided trip planning" hidePackCta>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-primary)]">
              Plan Your Journey
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl font-display font-semibold text-[var(--text-primary)]">
              {activeStep ? activeStep.label : 'Getting started'}
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-xl">
              Tell us where you&apos;re going, how you&apos;re traveling, and how you want to
              experience the trip.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] self-start"
          >
            Cancel & return to dashboard
          </button>
        </div>

        <ol className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {PHASES.map((phase, index) => {
            const done = index < activePhaseIndex;
            const current = index === activePhaseIndex;
            const firstStep = STEPS.find((s) => s.phase === phase.key);
            const qs = tripId ? `?tripId=${tripId}` : '';
            const canLink = tripId || phase.key === 'where';
            const content = (
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-semibold border whitespace-nowrap transition-colors',
                  current &&
                    'yolo-btn-primary text-[var(--text-inverse)] border-transparent shadow-md',
                  done && 'bg-[var(--brand-soft)] text-[var(--brand-primary)] border-[color-mix(in_srgb,var(--brand-primary)_25%,transparent)]',
                  !current &&
                    !done &&
                    'bg-[var(--surface-raised)] text-[var(--text-muted)] border-[var(--border-subtle)]',
                )}
              >
                <span className="opacity-70">{index + 1}</span>
                {phase.label}
              </span>
            );
            return (
              <li key={phase.key}>
                {canLink && (done || current) && firstStep ? (
                  <Link to={`${firstStep.path}${qs}`}>{content}</Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ol>

        {activePhaseIndex >= 0 && PHASES[activePhaseIndex].steps.length > 1 && (
          <p className="mb-6 text-xs text-[var(--text-muted)]">
            Step within {PHASES[activePhaseIndex].label}:{' '}
            <span className="font-semibold text-[var(--text-secondary)] capitalize">
              {activeStep?.key}
            </span>
          </p>
        )}

        <Outlet />
      </div>
    </AppShell>
  );
}
