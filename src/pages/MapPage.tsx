import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type L from 'leaflet';
import { MapPin, Search, Building2, Scale, GraduationCap, Landmark, Globe2 } from 'lucide-react';
import { courtLocations, type CourtLocation } from '../data/legalData';
import { useJurisdiction } from '../hooks/useJurisdiction';
import { CountryCoverageHeatmap } from '../components/ui/heatmap-chart';
import 'leaflet/dist/leaflet.css';
import './MapPage.css';

const EcowasMap = lazy(() => import('../components/EcowasMap'));

type T = CourtLocation['type'] | 'all';
const labels: Record<CourtLocation['type'], string> = {
  'supreme-court': 'Supreme Court',
  'circuit-court': 'Circuit Court',
  'magistrate-court': 'Magistrate Court',
  'government': 'Government',
  'law-school': 'Law School',
};
const icons: Record<CourtLocation['type'], any> = {
  'supreme-court': Scale,
  'circuit-court': Landmark,
  'magistrate-court': Building2,
  'government': Building2,
  'law-school': GraduationCap,
};

function CourtsView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInst = useRef<L.Map | null>(null);
  const markers = useRef<L.Marker[]>([]);
  const [filter, setFilter] = useState<T>('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<CourtLocation | null>(null);

  const filtered = courtLocations.filter((l) => {
    if (filter !== 'all' && l.type !== filter) return false;
    if (q.trim() && !`${l.name} ${l.county} ${l.address}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const L = await import('leaflet');
      if (cancelled || !mapRef.current) return;
      if (!mapInst.current) {
        mapInst.current = L.map(mapRef.current, { zoomControl: false }).setView([6.35, -10.0], 7);
        L.control.zoom({ position: 'bottomright' }).addTo(mapInst.current);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 18 }).addTo(mapInst.current);
      }
      markers.current.forEach((m) => m.remove());
      markers.current = [];
      filtered.forEach((loc) => {
        const m = L.marker([loc.lat, loc.lng], {
          icon: L.divIcon({ className: `map-marker map-marker--${loc.type}`, html: `<div class="map-dot"></div>`, iconSize: [20, 20], iconAnchor: [10, 10] }),
        }).addTo(mapInst.current!).on('click', () => setSelected(loc));
        m.bindTooltip(loc.name, { direction: 'top', offset: [0, -10] });
        markers.current.push(m);
      });
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [filtered]);

  return (
    <div className="map-page">
      <div className="map-sidebar">
        <div className="map-sidebar__header">
          <h1><MapPin size={16} /> Liberia court map</h1>
          <p>All {courtLocations.length} sites across 15 counties. Tap a court to see its address.</p>
          <div className="map-search">
            <Search size={14} /><input placeholder="Search — e.g. Monrovia, Supreme Court" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="map-filters">
            {(['all', 'supreme-court', 'circuit-court', 'magistrate-court', 'government', 'law-school'] as T[]).map((t) => (
              <button key={t} className={`map-chip ${filter === t ? 'map-chip--active' : ''}`} onClick={() => { setFilter(t); setSelected(null); }}>{t === 'all' ? 'All' : labels[t as CourtLocation['type']]}</button>
            ))}
          </div>
          <p className="map-count">{filtered.length} of {courtLocations.length} shown</p>
        </div>

        <div className="map-list">
          {filtered.map((loc) => {
            const Icon = icons[loc.type];
            const active = selected?.id === loc.id;
            return (
              <button key={loc.id} className={`map-item ${active ? 'map-item--active' : ''}`} onClick={() => { setSelected(loc); mapInst.current?.setView([loc.lat, loc.lng], 13, { animate: true }); }}>
                <span className={`map-item__icon map-item__icon--${loc.type}`}><Icon size={14} /></span>
                <span className="map-item__info"><strong>{loc.name}</strong><span>{loc.county} • {labels[loc.type]}</span></span>
              </button>
            );
          })}
          {filtered.length === 0 && <div className="map-empty">No courts found. Clear the filter.</div>}
        </div>

        {selected && (
          <div className="map-detail">
            <div className="map-detail__top">
              <span className={`map-badge map-badge--${selected.type}`}>{labels[selected.type]}</span>
              <button className="map-detail__close" onClick={() => setSelected(null)}>×</button>
            </div>
            <h3>{selected.name}</h3>
            <p className="map-detail__addr"><MapPin size={12} />{selected.address} • {selected.county}</p>
            <p className="map-detail__desc">{selected.description}</p>
            <p className="map-detail__coords">{selected.lat.toFixed(4)}°, {Math.abs(selected.lng).toFixed(4)}°W</p>
          </div>
        )}
      </div>

      <div className="map-wrap">
        <div ref={mapRef} className="map" />
        <span className="map-pill">{filtered.length} locations • Tap a red/blue dot</span>
      </div>
    </div>
  );
}

/* ── Page: ECOWAS first, Liberia courts second ── */
export default function MapPage() {
  const [tab, setTab] = useState<'ecowas' | 'courts'>('ecowas');
  const { code, active, setCode } = useJurisdiction();

  return (
    <div className="map-tabs-page">
      <div className="map-tabs" role="tablist" aria-label="Map views">
        <button role="tab" aria-selected={tab === 'ecowas'} className={tab === 'ecowas' ? 'on' : ''} onClick={() => setTab('ecowas')}>
          <Globe2 size={14} /> ECOWAS • 12 states
        </button>
        <button role="tab" aria-selected={tab === 'courts'} className={tab === 'courts' ? 'on' : ''} onClick={() => setTab('courts')}>
          <Scale size={14} /> Liberia courts • {courtLocations.length}
        </button>
      </div>

      {tab === 'ecowas' ? (
        <div className="map-eco">
          <div className="map-eco__head">
            <span className="map-eco__kicker">12 ECOWAS states</span>
            <h1>West Africa, one map</h1>
            <p>
              Gold is Liberia — the live library. Green states are queued; they still get ECOWAS community law.
              Tap a country on the map. Viewing <strong>{active.name}</strong>.
            </p>
          </div>
          <div className="map-eco__stage">
            <Suspense fallback={<div className="map-eco__fallback">Loading live map…</div>}>
              <EcowasMap />
            </Suspense>
          </div>

          <div className="map-eco__heat">
            <CountryCoverageHeatmap activeCode={code} onSelectCountry={setCode} />
          </div>
          <p className="map-eco__note">Liberia&apos;s {courtLocations.length} court sites live under the <strong>Liberia courts</strong> tab.</p>
        </div>
      ) : (
        <CourtsView />
      )}
    </div>
  );
}
