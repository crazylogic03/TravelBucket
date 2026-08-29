import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button.jsx';
import {
  listDestinations,
  updateDestination,
  reorderDestinations,
  getTrip,
} from '@/features/trips/tripApi.js';
import { useWizardStore } from './wizardStore.js';

export default function SelectPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tripId = params.get('tripId');
  const { setTrip } = useWizardStore();
  const [selected, setSelected] = useState([]);
  const [skipped, setSkipped] = useState([]);
  const [error, setError] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    const { destinations } = await listDestinations(tripId);
    setSelected(destinations.filter((d) => d.selected));
    setSkipped(destinations.filter((d) => !d.selected));
  };

  useEffect(() => {
    if (!tripId) {
      navigate('/trips/new/basics');
      return;
    }
    setSelected([]);
    setSkipped([]);
    setError(null);
    getTrip(tripId).then(({ trip }) => setTrip(trip));
    load().catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const removeSelected = async (dest) => {
    setBusyId(dest.id);
    setError(null);
    try {
      await updateDestination(tripId, dest.id, { selected: false });
      await load();
    } catch (err) {
      setError(err.message || 'Could not remove destination');
    } finally {
      setBusyId(null);
    }
  };

  const addBack = async (dest) => {
    setBusyId(dest.id);
    setError(null);
    try {
      await updateDestination(tripId, dest.id, { selected: true });
      await load();
    } catch (err) {
      setError(err.message || 'Could not add destination');
    } finally {
      setBusyId(null);
    }
  };

  const onDrop = async (toIndex) => {
    if (dragIndex == null || dragIndex === toIndex) {
      setDragIndex(null);
      return;
    }
    const prev = selected;
    const next = [...selected];
    const [item] = next.splice(dragIndex, 1);
    next.splice(toIndex, 0, item);
    setSelected(next);
    setDragIndex(null);
    setError(null);
    try {
      await reorderDestinations(
        tripId,
        next.map((d) => d.id),
      );
    } catch (err) {
      setSelected(prev);
      setError(err.message || 'Could not reorder destinations');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-display font-semibold text-[var(--text-primary)]">
        Destination selection
      </h1>
      <p className="mt-2 text-[var(--text-secondary)]">
        Reorder your stops. Remove any that no longer fit.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <section className="mt-8">
        <h2 className="font-display font-semibold text-lg mb-3">
          Selected Destinations ({selected.length})
        </h2>
        <div className="space-y-3">
          {selected.map((dest, index) => (
            <div
              key={dest.id}
              draggable
              onDragStart={() => setDragIndex(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(index)}
              className="rounded-2xl bg-[var(--surface-elevated)] shadow-card p-4 flex gap-4 cursor-grab active:cursor-grabbing"
            >
              <div className="h-20 w-28 rounded-xl overflow-hidden bg-[var(--surface-muted)] shrink-0">
                {dest.imageUrl && (
                  <img src={dest.imageUrl} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-[var(--text-primary)]">{dest.name}</h3>
                <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                  {dest.recommendationReason || dest.description}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {dest.recommendedDurationMinutes} min · est.{' '}
                  {dest.estimatedCost != null ? Number(dest.estimatedCost).toLocaleString() : '—'}
                </p>
              </div>
              <SecondaryButton
                className="!px-3 !py-2 text-sm self-start"
                onClick={() => removeSelected(dest)}
                disabled={busyId === dest.id}
              >
                Remove
              </SecondaryButton>
            </div>
          ))}
          {!selected.length && (
            <p className="text-sm text-[var(--text-muted)]">No destinations selected yet.</p>
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display font-semibold text-lg mb-3">
          Skipped / Not Selected ({skipped.length})
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {skipped.map((dest) => (
            <div
              key={dest.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-[var(--text-primary)] truncate">{dest.name}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{dest.status}</p>
              </div>
              <SecondaryButton
                className="!px-3 !py-1.5 text-xs shrink-0"
                onClick={() => addBack(dest)}
                disabled={busyId === dest.id}
              >
                Add back
              </SecondaryButton>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 flex gap-3">
        <SecondaryButton onClick={() => navigate(`/trips/new/discover?tripId=${tripId}`)}>
          Back
        </SecondaryButton>
        <PrimaryButton
          disabled={!selected.length}
          onClick={() => navigate(`/trips/new/optimize?tripId=${tripId}`)}
        >
          Optimize My Trip
        </PrimaryButton>
      </div>
    </div>
  );
}
