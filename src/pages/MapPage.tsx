import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type L from 'leaflet';
import { MapPin, Search, Building2, Scale, GraduationCap, Landmark, Globe2 } from 'lucide-react';
import { courtLocations, type CourtLocation } from '../data/legalData';
import { JURISDICTIONS } from '../data/jurisdictions';
import { useJurisdiction } from '../hooks/useJurisdiction';
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

function statusLabel(code: string, status: string, phase: string) {
  void code;
  if (status === 'active') return 'LIVE';
  if (status === 'next') return 'Next';
  return `Queued ${phase}`;
}

/* ── Liberia courts (Leaflet) — rendered only when its tab is active ── */
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
          {filtered.length === 0 && <div className="map-empty">No courts found. Try clear filter.</div>}
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
  const countries = JURISDICTIONS.filter((j) => j.code !== 'ECOWAS');

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
            <h1>This is ECOWAS — 12 states, one map</h1>
            <p>
              Every capital flies its flag. Tap a flag to make it your area — search, AI and voice follow.
              Viewing <strong>{active.name}</strong>.
            </p>
          </div>
          <Suspense fallback={<div style={{ height: 420, display: 'grid', placeItems: 'center', color: '#6EE7B7', fontSize: 13 }}>Loading live map…</div>}>
            <EcowasMap />
          </Suspense>
          <div className="map-countries">
            {countries.map((c) => (
              <button key={c.code} className={`map-country ${code === c.code ? 'on' : ''}`} onClick={() => setCode(c.code)}>
                <img src={`https://flagcdn.com/w80/${c.flag}.png`} srcSet={`https://flagcdn.com/w160/${c.flag}.png 2x`} alt={`${c.name} flag`} loading="lazy" />
                <span className="map-country__info"><strong>{c.name}</strong><small>{c.capital} • {c.languageLabel}</small></span>
                <em className={`map-country__st map-country__st--${c.status}`}>{statusLabel(c.code, c.status, c.phase)}</em>
              </button>
            ))}
          </div>
          <p className="map-eco__note">Liberia&apos;s {courtLocations.length} court sites live under the <strong>Liberia courts</strong> tab. Other states&apos; court directories open with their corpora.</p>
        </div>
      ) : (
        <CourtsView />
      )}
    </div>
  );
}
