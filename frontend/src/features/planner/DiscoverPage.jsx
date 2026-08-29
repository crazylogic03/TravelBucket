import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button.jsx';
import {
  discoverDestinations,
  getTrip,
  updateDestination,
  listDestinations,
} from '@/features/trips/tripApi.js';
import { useWizardStore } from './wizardStore.js';

const STAGE_LABELS = {
  mapping_route: 'Mapping your route...',
  finding_stops: 'Finding worthwhile stops...',
  checking_feasibility: 'Checking travel feasibility...',
  ranking_experiences: 'Ranking experiences...',
  saving_candidates: 'Saving your discoveries...',
  complete: 'Ready',
};

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tripId = params.get('tripId');
  const { trip, setTrip } = useWizardStore();

  const [stage, setStage] = useState('mapping_route');
  const [running, setRunning] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState(null);
  const [actionBusy, setActionBusy] = useState(null);

  useEffect(() => {
    if (!tripId) {
      navigate('/trips/new/basics');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { trip: t } = await getTrip(tripId);
        if (cancelled) return;
        setTrip(t);
        const existing = await listDestinations(tripId);
        if (cancelled) return;
        if (existing.destinations?.length) {
          setCandidates(existing.destinations);
          setSummary(`Your AI found ${existing.destinations.length} places worth considering.`);
          setStage('complete');
        } else {
          await runDiscovery();
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  async function runDiscovery() {
    setRunning(true);
    setError(null);
    setStage('mapping_route');
    // Reflect pipeline stages while waiting — backend runs them sequentially
    const timers = [
      setTimeout(() => setStage('finding_stops'), 800),
      setTimeout(() => setStage('checking_feasibility'), 2200),
      setTimeout(() => setStage('ranking_experiences'), 4000),
    ];
    try {
      const result = await discoverDestinations(tripId);
      timers.forEach(clearTimeout);
      if (result.stages?.length) {
        setStage(result.stages[result.stages.length - 1] || 'complete');
      }
      setStage('complete');
      setCandidates(result.candidates || []);
      setSummary(result.summary || `Your AI found ${(result.candidates || []).length} places worth considering.`);
    } catch (err) {
      timers.forEach(clearTimeout);
      setError(err.message || 'Discovery failed');
      setStage('complete');
    } finally {
      setRunning(false);
    }
  }

  const toggleAdd = async (dest) => {
    setActionBusy(dest.id);
    setError(null);
    try {
      const selected = !dest.selected;
      const { destination } = await updateDestination(tripId, dest.id, { selected });
      setCandidates((prev) => prev.map((d) => (d.id === dest.id ? destination : d)));
    } catch (err) {
      setError(err.message || 'Could not update destination');
    } finally {
      setActionBusy(null);
    }
  };

  const skip = async (dest) => {
    setActionBusy(dest.id);
    setError(null);
    try {
      const { destination } = await updateDestination(tripId, dest.id, { skip: true });
      setCandidates((prev) => prev.map((d) => (d.id === dest.id ? destination : d)));
    } catch (err) {
      setError(err.message || 'Could not skip destination');
    } finally {
      setActionBusy(null);
    }
  };

  if (!tripId) return null;

  return (
    <div>
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--brand-primary)] font-semibold">
        AI Discovery
      </p>
      <h1 className="mt-2 text-3xl font-display font-semibold text-[var(--text-primary)]">
        YOLO found some places you&apos;ll love.
      </h1>
      {trip && (
        <p className="mt-2 text-[var(--text-secondary)]">
          Based on your route, travel style, time and budget · {trip.startLocationName} →{' '}
          {trip.destinationName}
        </p>
      )}

      <AnimatePresence mode="wait">
        {running && (
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 yolo-surface p-8 text-center yolo-ai-glow"
          >
            <div className="mx-auto h-10 w-10 rounded-full border-2 border-teal-500 border-t-transparent animate-spin" />
            <p className="mt-4 font-medium text-[var(--text-primary)]">
              {STAGE_LABELS[stage] || 'Working...'}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Live pipeline stages — not simulated progress.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}{' '}
          <button type="button" className="underline font-semibold" onClick={runDiscovery}>
            Retry
          </button>
        </div>
      )}

      {!running && candidates.length > 0 && (
        <>
          <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-lg font-display font-semibold text-[var(--text-primary)]">{summary}</h2>
            <div className="flex gap-2">
              <SecondaryButton onClick={runDiscovery}>Discover again</SecondaryButton>
              <PrimaryButton onClick={() => navigate(`/trips/new/select?tripId=${tripId}`)}>
                Review My Choices
              </PrimaryButton>
            </div>
          </div>

          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {candidates.map((dest) => (
              <article
                key={dest.id}
                className={`rounded-3xl overflow-hidden border yolo-card-hover ${
                  dest.selected
                    ? 'border-teal-500 ring-2 ring-teal-500/20'
                    : dest.status === 'SKIPPED'
                      ? 'border-[var(--border-subtle)] opacity-60'
                      : 'border-[var(--border-subtle)] bg-[var(--surface-raised)]'
                }`}
                style={{ boxShadow: 'var(--shadow-soft)' }}
              >
                <div className="relative h-44 bg-[var(--surface-muted)] overflow-hidden">
                  {dest.imageUrl ? (
                    <img
                      src={dest.imageUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  {dest.rating != null && (
                    <span className="absolute top-3 right-3 yolo-chip bg-black/40 text-white">
                      ★ {dest.rating}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-display font-semibold text-lg text-[var(--text-primary)]">
                    {dest.name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--text-secondary)] line-clamp-2">
                    {dest.description}
                  </p>
                  {dest.recommendationReason && (
                    <p className="mt-3 text-xs text-[var(--brand-primary)] bg-[var(--brand-soft)] rounded-xl px-3 py-2">
                      ✨ {dest.recommendationReason}
                    </p>
                  )}
                  <p className="mt-3 text-xs text-[var(--text-muted)]">
                    Stay ~{dest.recommendedDurationMinutes} min · est.{' '}
                    {dest.estimatedCost != null
                      ? `${trip?.currency || 'INR'} ${Number(dest.estimatedCost).toLocaleString()}`
                      : '—'}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <PrimaryButton
                      className="!px-3 !py-2 text-sm"
                      onClick={() => toggleAdd(dest)}
                      disabled={dest.status === 'SKIPPED' || actionBusy === dest.id}
                    >
                      {dest.selected ? 'Added ✓' : 'Add to Journey'}
                    </PrimaryButton>
                    <SecondaryButton
                      className="!px-3 !py-2 text-sm"
                      onClick={() => skip(dest)}
                      disabled={dest.selected || actionBusy === dest.id}
                    >
                      Skip
                    </SecondaryButton>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {!running && !error && candidates.length === 0 && stage === 'complete' && (
        <div className="mt-8 text-center">
          <p className="text-[var(--text-secondary)]">No candidates yet.</p>
          <PrimaryButton className="mt-4" onClick={runDiscovery}>
            Start discovery
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
