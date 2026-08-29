import { useEffect, useState } from 'react';
import { geocode } from '@/features/trips/tripApi.js';
import { cn } from '@/lib/cn.js';

/**
 * Location autocomplete backed by Mapbox geocoding (server proxy).
 */
export function LocationAutocomplete({
  label,
  value,
  onChange,
  placeholder = 'Search a place…',
}) {
  const [query, setQuery] = useState(value?.name || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setQuery(value?.name || '');
  }, [value?.name]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return undefined;
    }

    // Don't re-search when the query matches the selected value
    if (value?.name && query.trim() === value.name.trim()) {
      setResults([]);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await geocode(query.trim());
        if (!cancelled) {
          setResults(data.results || []);
          setOpen(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Location search unavailable');
          setResults([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, value?.name]);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{label}</label>
      <input
        type="text"
        value={query}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        className="yolo-input"
      />
      {loading && <p className="mt-1 text-xs text-[var(--text-muted)]">Searching…</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {open && results.length > 0 && (
        <ul
          className="absolute z-20 mt-1 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] overflow-hidden"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className={cn(
                  'w-full text-left px-4 py-3 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-muted)]',
                )}
                onClick={() => {
                  onChange({
                    name: r.name,
                    latitude: r.latitude,
                    longitude: r.longitude,
                  });
                  setQuery(r.name);
                  setOpen(false);
                  setResults([]);
                }}
              >
                {r.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
