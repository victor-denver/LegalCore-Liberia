import { useEffect } from 'react';
import * as MapLibreGL from 'maplibre-gl';
import { Map, MapMarker, MarkerContent, MarkerTooltip, MarkerLabel, useMap } from './MapLibre';
import { JURISDICTIONS } from '../data/jurisdictions';
import { useJurisdiction } from '../hooks/useJurisdiction';
import './EcowasMap.css';

/** Capital coordinates [lng, lat] per jurisdiction. */
const CAPITALS: Record<string, { lng: number; lat: number }> = {
  LR: { lng: -10.8047, lat: 6.3106 },
  SL: { lng: -13.2344, lat: 8.4844 },
  GH: { lng: -0.187, lat: 5.6037 },
  GM: { lng: -16.579, lat: 13.4549 },
  NG: { lng: 7.4951, lat: 9.0579 },
  SN: { lng: -17.4677, lat: 14.7167 },
  CI: { lng: -5.2893, lat: 6.8276 },
  BJ: { lng: 2.6289, lat: 6.4969 },
  TG: { lng: 1.2123, lat: 6.1375 },
  GN: { lng: -13.6785, lat: 9.537 },
  CV: { lng: -23.5092, lat: 14.9177 },
  GW: { lng: -15.1804, lat: 11.8037 },
};

/** Frame all 12 capitals on any screen size. */
function FitECOWAS() {
  const { map, isLoaded } = useMap();
  useEffect(() => {
    if (!map || !isLoaded) return;
    map.fitBounds(
      [
        [-26, 3.2],
        [10.5, 16.8],
      ],
      { padding: 36, duration: 800 },
    );
  }, [map, isLoaded]);
  return null;
}

/** Zoom buttons that respect the app theme. */
function MapControls() {
  const { map, isLoaded } = useMap();
  useEffect(() => {
    if (!map || !isLoaded) return;
    const nav = new MapLibreGL.NavigationControl({ showCompass: false, visualizePitch: false });
    map.addControl(nav, 'top-right');
    return () => {
      try {
        map.removeControl(nav);
      } catch {
        /* already removed */
      }
    };
  }, [map, isLoaded]);
  return null;
}

export default function EcowasMap() {
  const { code: activeCode, active, setCode } = useJurisdiction();
  const countries = JURISDICTIONS.filter((j) => j.code !== 'ECOWAS' && CAPITALS[j.code]);

  return (
    <div className="ecowas-map">
      <Map
        center={[-7.5, 10]}
        zoom={3.5}
        minZoom={2.5}
        maxZoom={12}
        scrollZoom={false}
      >
        <FitECOWAS />
        <MapControls />
        {countries.map((c) => {
          const pos = CAPITALS[c.code];
          const isActive = activeCode === c.code;
          return (
            <MapMarker
              key={c.code}
              longitude={pos.lng}
              latitude={pos.lat}
              onClick={() => setCode(c.code)}
            >
              <MarkerContent>
                <button
                  className={`flag-pin ${isActive ? 'flag-pin--active' : ''} ${c.status === 'active' ? 'flag-pin--live' : ''}`}
                  title={`${c.name} — tap to make it your area`}
                  aria-label={`${c.name} flag marker`}
                >
                  <img
                    src={`https://flagcdn.com/w80/${c.flag}.png`}
                    srcSet={`https://flagcdn.com/w160/${c.flag}.png 2x`}
                    alt={`${c.name} flag`}
                    loading="lazy"
                    draggable={false}
                  />
                  {c.status === 'active' && <span className="flag-pin__dot" />}
                </button>
              </MarkerContent>
              <MarkerTooltip>
                <strong>{c.name}</strong> • {c.capital} — {c.status === 'active' ? 'LIVE' : c.status === 'next' ? 'Next' : 'Queued'}
              </MarkerTooltip>
              {isActive && <MarkerLabel>{c.name}</MarkerLabel>}
            </MapMarker>
          );
        })}
      </Map>
      <div className="ecowas-map__chip" aria-live="polite">
        <img src={`https://flagcdn.com/w40/${active.flag}.png`} alt="" />
        <span>
          Viewing <strong>{active.name}</strong> — tap any flag to switch areas
        </span>
      </div>
    </div>
  );
}
