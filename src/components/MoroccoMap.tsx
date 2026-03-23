'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, X } from 'lucide-react';
import {
  MOROCCAN_CITIES,
  MOROCCO_BOUNDS,
  MOROCCO_CENTER,
  MOROCCO_DEFAULT_ZOOM,
  MoroccanCity,
  haversineDistance,
} from '@/lib/moroccan-cities';

export interface MapSelection {
  departure: MoroccanCity | null;
  destination: MoroccanCity | null;
  distanceKm: number | null;
}

interface MoroccoMapProps {
  onSelectionChange?: (selection: MapSelection) => void;
  initialDeparture?: string;
  initialDestination?: string;
  readonly?: boolean;
}

// Lazy-load Leaflet only on client
let L: typeof import('leaflet') | null = null;

export default function MoroccoMap({
  onSelectionChange,
  initialDeparture,
  initialDestination,
  readonly = false,
}: MoroccoMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<{ dep: any; dest: any; line: any }>({ dep: null, dest: null, line: null });

  const [departure, setDeparture] = useState<MoroccanCity | null>(null);
  const [destination, setDestination] = useState<MoroccanCity | null>(null);
  const [step, setStep] = useState<'departure' | 'destination'>('departure');
  const [mapReady, setMapReady] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  // ── Bootstrap Leaflet ────────────────────────────────────────────────────
  useEffect(() => {
    // Track whether this effect invocation is still "live" (not cleaned up)
    let cancelled = false;

    if (!mapContainerRef.current) return;

    // Destroy any previous Leaflet instance on the container before re-init
    // (handles React StrictMode double-invoke)
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    import('leaflet').then((leafletModule) => {
      // If the effect was cleaned up while the import was in-flight, bail out
      if (cancelled || !mapContainerRef.current) return;

      L = leafletModule.default ?? leafletModule;

      // Fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Clear any stale Leaflet state left on the DOM node
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (mapContainerRef.current as any)._leaflet_id;

      const map = L.map(mapContainerRef.current, {
        center: MOROCCO_CENTER,
        zoom: MOROCCO_DEFAULT_ZOOM,
        maxBounds: MOROCCO_BOUNDS,
        maxBoundsViscosity: 0.9,
        minZoom: 4,
        maxZoom: 13,
      });

      L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        { attribution: '© OpenStreetMap contributors' },
      ).addTo(map);

      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapReady(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Apply initial values ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady) return;
    if (initialDeparture) {
      const city = MOROCCAN_CITIES.find(
        (c) => c.name.toLowerCase() === initialDeparture.toLowerCase(),
      );
      if (city) setDeparture(city);
    }
    if (initialDestination) {
      const city = MOROCCAN_CITIES.find(
        (c) => c.name.toLowerCase() === initialDestination.toLowerCase(),
      );
      if (city) setDestination(city);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady]);

  // ── Draw / update markers & polyline ─────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || !L) return;
    const map = mapRef.current;
    const refs = markersRef.current;

    // Remove old layers
    if (refs.dep)  { map.removeLayer(refs.dep);  refs.dep  = null; }
    if (refs.dest) { map.removeLayer(refs.dest); refs.dest = null; }
    if (refs.line) { map.removeLayer(refs.line); refs.line = null; }

    const depIcon = L.divIcon({
      className: '',
      html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-lg text-white text-xs font-bold">A</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const destIcon = L.divIcon({
      className: '',
      html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-red-500 border-2 border-white shadow-lg text-white text-xs font-bold">B</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (departure) {
      refs.dep = L.marker([departure.lat, departure.lng], { icon: depIcon })
        .addTo(map)
        .bindTooltip(`<b>Départ:</b> ${departure.name}`, { permanent: false });
    }

    if (destination) {
      refs.dest = L.marker([destination.lat, destination.lng], { icon: destIcon })
        .addTo(map)
        .bindTooltip(`<b>Destination:</b> ${destination.name}`, { permanent: false });
    }

    if (departure && destination) {
      const dist = haversineDistance(
        departure.lat, departure.lng,
        destination.lat, destination.lng,
      );
      setDistanceKm(Math.round(dist));

      refs.line = L.polyline(
        [[departure.lat, departure.lng], [destination.lat, destination.lng]],
        { color: '#2563eb', weight: 3, dashArray: '8 6', opacity: 0.8 },
      ).addTo(map);

      // Fit bounds with padding
      const bounds = L.latLngBounds(
        [departure.lat, departure.lng],
        [destination.lat, destination.lng],
      );
      map.fitBounds(bounds, { padding: [60, 60] });

      onSelectionChange?.({
        departure,
        destination,
        distanceKm: Math.round(dist),
      });
    } else {
      setDistanceKm(null);
      onSelectionChange?.({ departure, destination, distanceKm: null });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departure, destination, mapReady]);

  // ── City click handler ───────────────────────────────────────────────────
  const handleCityClick = (city: MoroccanCity) => {
    if (readonly) return;
    if (step === 'departure') {
      setDeparture(city);
      setStep('destination');
    } else {
      if (city.name === departure?.name) return; // same city
      setDestination(city);
      setStep('departure');
    }
  };

  const reset = () => {
    setDeparture(null);
    setDestination(null);
    setStep('departure');
    setDistanceKm(null);
    if (mapRef.current) {
      mapRef.current.setView(MOROCCO_CENTER, MOROCCO_DEFAULT_ZOOM);
    }
    onSelectionChange?.({ departure: null, destination: null, distanceKm: null });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* ── Instructions / status bar ── */}
      {!readonly && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            {/* Departure pill */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all
              ${step === 'departure' && !departure
                ? 'bg-blue-50 border-blue-400 text-blue-700 ring-2 ring-blue-300'
                : departure
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white text-blue-600 text-xs flex items-center justify-center font-bold">A</span>
              {departure ? departure.name : 'Departure'}
            </div>

            <span className="text-gray-300">→</span>

            {/* Destination pill */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all
              ${step === 'destination' && !destination
                ? 'bg-red-50 border-red-400 text-red-700 ring-2 ring-red-300'
                : destination
                ? 'bg-red-500 border-red-500 text-white'
                : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white text-red-500 text-xs flex items-center justify-center font-bold">B</span>
              {destination ? destination.name : 'Destination'}
            </div>

            {distanceKm !== null && (
              <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
                <Navigation className="h-3 w-3" />
                {distanceKm} km
              </span>
            )}
          </div>

          {(departure || destination) && (
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
      )}

      {/* ── Instruction hint ── */}
      {!readonly && !(departure && destination) && (
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5 text-brand-500" />
          {!departure
            ? 'Click a city on the map or use the list below to set departure'
            : 'Now click your destination city'}
        </p>
      )}      {/* ── Map container ── */}
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
           style={{ height: 'clamp(260px, 45vw, 400px)' }}>
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* City dot overlays rendered via SVG or HTML on top of the Leaflet map */}
        {mapReady && (
          <CityDotOverlay
            map={mapRef.current}
            cities={MOROCCAN_CITIES}
            departure={departure}
            destination={destination}
            onCityClick={handleCityClick}
            readonly={readonly}
          />
        )}
      </div>

      {/* ── City quick-pick list ── */}      {!readonly && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
            Major Moroccan Cities
          </p>
          {/* Scrollable row on mobile, wrapping on larger screens */}
          <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible scrollbar-hide">
            {MOROCCAN_CITIES.filter((c) =>
              [
                'Casablanca','Rabat','Marrakech','Fès','Tanger','Agadir',
                'Meknès','Oujda','Kenitra','Tétouan','El Jadida','Safi',
                'Béni Mellal','Ouarzazate','Essaouira','Errachidia',
              ].includes(c.name),
            ).map((city) => {
              const isDep  = departure?.name  === city.name;
              const isDest = destination?.name === city.name;
              return (
                <button
                  key={city.name}
                  type="button"
                  onClick={() => handleCityClick(city)}
                  disabled={isDep && step === 'departure'}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium border transition-all
                    ${isDep  ? 'bg-blue-600 text-white border-blue-600'  : ''}
                    ${isDest ? 'bg-red-500  text-white border-red-500'   : ''}
                    ${!isDep && !isDest
                      ? 'bg-white text-gray-600 border-gray-200 hover:border-brand-400 hover:text-brand-700'
                      : ''}
                  `}
                >
                  {city.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── City dot overlay (React portals into Leaflet markers) ────────────────────
interface CityDotOverlayProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any;
  cities: MoroccanCity[];
  departure: MoroccanCity | null;
  destination: MoroccanCity | null;
  onCityClick: (city: MoroccanCity) => void;
  readonly: boolean;
}

function CityDotOverlay({ map, cities, departure, destination, onCityClick, readonly }: CityDotOverlayProps) {
  // We use Leaflet DivIcon markers for city dots — rendered within the Leaflet layer system
  // This component triggers re-creation of circle markers on state change
  const dotMarkersRef = useRef<Record<string, unknown>>({});

  useEffect(() => {
    if (!map || !L) return;

    // Remove previous dot markers
    Object.values(dotMarkersRef.current).forEach((m) => map.removeLayer(m));
    dotMarkersRef.current = {};

    cities.forEach((city) => {
      const isDep  = departure?.name  === city.name;
      const isDest = destination?.name === city.name;

      const color = isDep ? '#2563eb' : isDest ? '#ef4444' : '#6b7280';
      const size  = isDep || isDest ? 12 : 8;
      const ring  = isDep || isDest ? `box-shadow:0 0 0 3px ${isDep ? '#93c5fd' : '#fca5a5'};` : '';

      const icon = L!.divIcon({
        className: '',
        html: `<div title="${city.name}" style="
          width:${size}px;height:${size}px;
          border-radius:50%;
          background:${color};
          border:2px solid white;
          ${ring}
          cursor:${readonly ? 'default' : 'pointer'};
          transition:transform 0.15s;
        " onmouseenter="this.style.transform='scale(1.5)'" onmouseleave="this.style.transform='scale(1)'"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L!.marker([city.lat, city.lng], { icon, interactive: !readonly })
        .addTo(map)
        .bindTooltip(city.name, { direction: 'top', offset: [0, -6] });

      if (!readonly) {
        marker.on('click', () => onCityClick(city));
      }

      dotMarkersRef.current[city.name] = marker;
    });

    return () => {
      Object.values(dotMarkersRef.current).forEach((m) => map.removeLayer(m as never));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, departure, destination]);

  return null;
}
