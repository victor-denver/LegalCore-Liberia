import { useEffect, useRef, useState } from 'react';
import type L from 'leaflet';
import { MapPin, Building2, Scale, GraduationCap, Landmark, Filter } from 'lucide-react';
import { courtLocations, type CourtLocation } from '../data/legalData';
import 'leaflet/dist/leaflet.css';
import './MapPage.css';

type LocationType = CourtLocation['type'] | 'all';

const typeLabels: Record<CourtLocation['type'], string> = {
  'supreme-court': 'Supreme Court',
  'circuit-court': 'Circuit Court',
  'magistrate-court': 'Magistrate Court',
  'government': 'Government',
  'law-school': 'Law School',
};

const typeIcons: Record<CourtLocation['type'], typeof Scale> = {
  'supreme-court': Scale,
  'circuit-court': Landmark,
  'magistrate-court': Building2,
  'government': Building2,
  'law-school': GraduationCap,
};

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [filter, setFilter] = useState<LocationType>('all');
  const [selectedLocation, setSelectedLocation] = useState<CourtLocation | null>(null);

  const filtered = filter === 'all' ? courtLocations : courtLocations.filter((l) => l.type === filter);

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      const L = await import('leaflet');

      if (cancelled || !mapRef.current) return;

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapRef.current).setView([6.35, -10.0], 7);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        }).addTo(mapInstanceRef.current);
      }

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      filtered.forEach((loc) => {
        const marker = L.marker([loc.lat, loc.lng], {
          icon: L.divIcon({
            className: `map-marker map-marker--${loc.type}`,
            html: `<div class="map-marker__dot"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
        })
          .addTo(mapInstanceRef.current!)
          .on('click', () => setSelectedLocation(loc));

        marker.bindTooltip(loc.name, { direction: 'top', offset: [0, -12] });
        markersRef.current.push(marker);
      });
    }

    initMap();

    return () => { cancelled = true; };
  }, [filter]);

  return (
    <div className="map-page">
      <div className="map-page__sidebar">
        <div className="map-sidebar__header">
          <h1 className="map-sidebar__title">
            <MapPin size={20} />
            Legal Map of Liberia
          </h1>
          <p className="map-sidebar__subtitle">
            Courts, government buildings, and legal institutions
          </p>
        </div>

        <div className="map-sidebar__filters">
          <div className="map-filter-label">
            <Filter size={13} />
            Filter by type
          </div>
          <div className="map-filter-chips">
            {(['all', 'supreme-court', 'circuit-court', 'magistrate-court', 'government', 'law-school'] as LocationType[]).map((t) => (
              <button
                key={t}
                className={`map-filter-chip ${filter === t ? 'map-filter-chip--active' : ''}`}
                onClick={() => { setFilter(t); setSelectedLocation(null); }}
              >
                {t === 'all' ? 'All' : typeLabels[t as CourtLocation['type']]}
              </button>
            ))}
          </div>
        </div>

        <div className="map-sidebar__list">
          {filtered.map((loc) => {
            const Icon = typeIcons[loc.type];
            return (
              <button
                key={loc.id}
                className={`map-location-card ${selectedLocation?.id === loc.id ? 'map-location-card--active' : ''}`}
                onClick={() => {
                  setSelectedLocation(loc);
                  mapInstanceRef.current?.setView([loc.lat, loc.lng], 14, { animate: true });
                }}
              >
                <div className={`map-location-card__icon map-location-card__icon--${loc.type}`}>
                  <Icon size={16} />
                </div>
                <div className="map-location-card__info">
                  <h3>{loc.name}</h3>
                  <span>{loc.county} County</span>
                </div>
              </button>
            );
          })}
        </div>

        {selectedLocation && (
          <div className="map-sidebar__detail animate-in">
            <h3>{selectedLocation.name}</h3>
            <p className="map-detail__type">{typeLabels[selectedLocation.type]}</p>
            <p className="map-detail__address">{selectedLocation.address}</p>
            <p className="map-detail__desc">{selectedLocation.description}</p>
            <p className="map-detail__coords">
              {selectedLocation.lat.toFixed(4)}°N, {Math.abs(selectedLocation.lng).toFixed(4)}°W
            </p>
          </div>
        )}
      </div>

      <div className="map-page__map" ref={mapRef} />
    </div>
  );
}
