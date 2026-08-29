import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button.jsx';
import { optimizeTrip, getTrip } from '@/features/trips/tripApi.js';
import { useWizardStore } from './wizardStore.js';

const STAGES = [
  'Checking route',
  'Checking travel times',
  'Checking weather',
  'Balancing destinations',
  'Checking budget',
  'Optimizing schedule',
];

export default function OptimizePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tripId = params.get('tripId');
  const { setTrip } = useWizardStore();

  const [stageIndex, setStageIndex] = useState(0);
  const [running, setRunning] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tripId) {
      navigate('/trips/new/basics');
      return;
    }

    setRunning(true);
    setResult(null);
    setError(null);
    setStageIndex(0);

    let cancelled = false;
    const interval = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, STAGES.length - 1));
    }, 900);

    (async () => {
      try {
        await getTrip(tripId);
        const data = await optimizeTrip(tripId);
        if (cancelled) return;
        setResult(data);
        setTrip(data.trip);
        setRunning(false);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Optimization failed');
          setRunning(false);
        }
      } finally {
        clearInterval(interval);
      }
    })();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [tripId, navigate, setTrip]);

  return (
    <div>
      <h1 className="text-3xl font-display font-semibold text-[var(--text-primary)]">
        Optimizing your trip
      </h1>
      <p className="mt-2 text-[var(--text-secondary)]">
        Balancing route, weather, budget, and rest into a feasible plan.
      </p>

      <AnimatePresence mode="wait">
        {running && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 rounded-2xl bg-[var(--surface-elevated)] shadow-card p-8"
          >
            <ul className="space-y-3 max-w-md mx-auto">
              {STAGES.map((label, i) => (
                <li
                  key={label}
                  className={`flex items-center gap-3 text-sm ${
                    i <= stageIndex ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-muted)]'
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      i < stageIndex
                        ? 'bg-secondary-500'
                        : i === stageIndex
                          ? 'bg-primary-500 animate-pulse'
                          : 'bg-[var(--surface-muted)]'
                    }`}
                  />
                  {label}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
          <div className="mt-3 flex flex-wrap gap-2">
            <SecondaryButton
              onClick={() => {
                setError(null);
                setRunning(true);
                setResult(null);
                setStageIndex(0);
                optimizeTrip(tripId)
                  .then((data) => {
                    setResult(data);
                    setTrip(data.trip);
                  })
                  .catch((err) => setError(err.message || 'Optimization failed'))
                  .finally(() => setRunning(false));
              }}
            >
              Retry
            </SecondaryButton>
            <SecondaryButton onClick={() => navigate(`/trips/new/select?tripId=${tripId}`)}>
              Back to selection
            </SecondaryButton>
          </div>
        </div>
      )}

      {!running && result && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 rounded-2xl bg-[var(--surface-elevated)] shadow-card p-8 text-center"
        >
          <p className="text-secondary-600 font-semibold uppercase tracking-wide text-sm">
            Your trip is ready.
          </p>
          <p className="mt-3 text-5xl font-display font-bold text-[var(--text-primary)]">{result.score}</p>
          <p className="text-sm text-[var(--text-muted)]">overall trip score</p>
          <div className="mt-6 text-left rounded-xl bg-primary-50 border border-primary-100 px-5 py-4">
            <p className="font-semibold text-[var(--text-primary)]">Why this plan?</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{result.whyThisPlan}</p>
            {result.meta?.fallback && (
              <p className="mt-2 text-xs text-amber-700">
                Used deterministic fallback planner (AI unavailable or invalid output).
              </p>
            )}
          </div>
          <PrimaryButton
            className="mt-8"
            onClick={() => navigate(`/trips/new/review?tripId=${tripId}`)}
          >
            Review Trip
          </PrimaryButton>
        </motion.div>
      )}
    </div>
  );
}
