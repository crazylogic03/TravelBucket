import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getMapToken } from '@/features/trips/tripApi.js';

/**
 * Mapbox map panel with markers, optional route, and graceful missing-token UX.
 * Token is fetched from the backend — never hardcode secrets in the frontend.
 */
export function MapPanel({
  className = 'h-64 w-full rounded-2xl overflow-hidden',
  center,
  markers = [],
  routeGeometry,
  currentLocation,
  selectedId,
  showUserLocation = false,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);
  const [geoDenied, setGeoDenied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let map;
    let watchId;

    (async () => {
      try {
        const data = await getMapToken();
        const token = data?.token;
        if (!token) {
          if (!cancelled) {
            setError(
              data?.message ||
                'Map unavailable — Mapbox is not configured. Add MAPBOX_ACCESS_TOKEN on the server.',
            );
          }
          return;
        }
        if (cancelled || !containerRef.current) return;

        mapboxgl.accessToken = token;
        map = new mapboxgl.Map({
          container: containerRef.current,
          style: 'mapbox://styles/mapbox/outdoors-v12',
          center: center ? [center.longitude, center.latitude] : [77.2, 28.6],
          zoom: center ? 6 : 4,
        });
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
        mapRef.current = map;

        map.on('load', () => {
          if (cancelled) return;
          setReady(true);
          renderOverlays(map);
        });

        if (showUserLocation && navigator.geolocation) {
          watchId = navigator.geolocation.watchPosition(
            (pos) => {
              if (!mapRef.current) return;
              const { latitude, longitude } = pos.coords;
              const existing = markersRef.current.find((m) => m._yoloUser);
              if (existing) {
                existing.setLngLat([longitude, latitude]);
              } else {
                const el = document.createElement('div');
                el.className = 'h-3.5 w-3.5 rounded-full bg-sky-500 border-2 border-white shadow-lg';
                const marker = new mapboxgl.Marker(el)
                  .setLngLat([longitude, latitude])
                  .setPopup(new mapboxgl.Popup({ offset: 12 }).setText('You are here'))
                  .addTo(mapRef.current);
                marker._yoloUser = true;
                markersRef.current.push(marker);
              }
            },
            () => setGeoDenied(true),
            { enableHighAccuracy: true, maximumAge: 10_000 },
          );
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Map unavailable');
      }
    })();

    return () => {
      cancelled = true;
      if (watchId != null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    renderOverlays(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, markers, routeGeometry, currentLocation, selectedId, center]);

  function renderOverlays(map) {
    markersRef.current.forEach((m) => {
      if (!m._yoloUser) m.remove();
    });
    markersRef.current = markersRef.current.filter((m) => m._yoloUser);

    const allMarkers = [...markers];
    if (currentLocation?.latitude != null) {
      allMarkers.push({
        ...currentLocation,
        label: currentLocation.label || 'Current',
        color: '#0EA5E9',
      });
    }

    for (const m of allMarkers) {
      if (m.latitude == null || m.longitude == null) continue;
      const el = document.createElement('div');
      const highlighted = selectedId && m.id === selectedId;
      el.className = highlighted
        ? 'h-4 w-4 rounded-full border-2 border-white shadow-lg ring-2 ring-accent-400'
        : 'h-3 w-3 rounded-full border-2 border-white shadow';
      el.style.background = m.color || '#4A90E2';
      const marker = new mapboxgl.Marker(el)
        .setLngLat([m.longitude, m.latitude])
        .setPopup(m.label ? new mapboxgl.Popup({ offset: 12 }).setText(m.label) : undefined)
        .addTo(map);
      markersRef.current.push(marker);
    }

    if (map.getLayer('route-line')) map.removeLayer('route-line');
    if (map.getSource('route')) map.removeSource('route');

    if (routeGeometry?.coordinates?.length) {
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: routeGeometry },
      });
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': '#4A90E2',
          'line-width': 4,
          'line-opacity': 0.85,
        },
      });
      const bounds = new mapboxgl.LngLatBounds();
      routeGeometry.coordinates.forEach((c) => bounds.extend(c));
      for (const m of allMarkers) {
        if (m.latitude != null) bounds.extend([m.longitude, m.latitude]);
      }
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 56, maxZoom: 8, duration: 600 });
      }
    } else if (allMarkers.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      allMarkers.forEach((m) => {
        if (m.latitude != null) bounds.extend([m.longitude, m.latitude]);
      });
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 48, maxZoom: 9 });
    } else if (center) {
      map.flyTo({ center: [center.longitude, center.latitude], zoom: 7 });
    }
  }

  if (error) {
    return (
      <div
        className={`${className} bg-[var(--surface-muted)] border border-[var(--border)] flex flex-col items-center justify-center text-sm text-[var(--text-secondary)] px-6 text-center gap-2`}
      >
        <p className="font-medium text-[var(--text-primary)]">Map unavailable</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={containerRef} className="absolute inset-0" />
      {geoDenied && (
        <div className="absolute bottom-3 left-3 right-3 z-10 rounded-xl bg-white/95 border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-secondary)] shadow">
          Location permission denied. The map still works — live position tracking is disabled.
        </div>
      )}
    </div>
  );
}
