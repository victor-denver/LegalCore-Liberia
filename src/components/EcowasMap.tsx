import { useState } from 'react';
import { JURISDICTIONS } from '../data/jurisdictions';
import { useJurisdiction } from '../hooks/useJurisdiction';
import { nationalLawCount } from './ui/heatmap-chart';
import { ECOWAS_VIEW, ECOWAS_PATHS, ECOWAS_PINS } from '../data/ecowasSvg';
import './EcowasMap.css';

const FLAG = { w: 36, h: 24 };

export default function EcowasMap() {
  const { code: activeCode, active, setCode } = useJurisdiction();
  const [hover, setHover] = useState<string | null>(null);
  const countries = JURISDICTIONS.filter((j) => j.code !== 'ECOWAS' && ECOWAS_PINS[j.code]);
  const hoverJ = hover ? countries.find((c) => c.code === hover) : null;

  return (
    <div className="ecowas-map">
      <svg
        className="ecowas-map__svg"
        viewBox={`0 0 ${ECOWAS_VIEW.w} ${ECOWAS_VIEW.h}`}
        role="img"
        aria-label="ECOWAS member states. Gold is Liberia, the live library. Green states are queued."
      >
        <defs>
          <clipPath id="ecowas-flag-clip" clipPathUnits="objectBoundingBox">
            <rect x="0" y="0" width="1" height="1" rx="0.12" ry="0.16" />
          </clipPath>
          <filter id="ecowas-flag-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000" floodOpacity="0.45" />
          </filter>
        </defs>
        <rect className="ecowas-map__ocean" width={ECOWAS_VIEW.w} height={ECOWAS_VIEW.h} />
        {ECOWAS_PATHS.map((c) => {
          const on = c.iso === activeCode;
          const live = c.iso === 'LR';
          return (
            <path
              key={c.iso}
              d={c.d}
              fillRule="evenodd"
              className={`ecowas-map__land ${live ? 'is-live' : 'is-queued'} ${on ? 'is-on' : ''}`}
              onClick={() => setCode(c.iso)}
              onMouseEnter={() => setHover(c.iso)}
              onMouseLeave={() => setHover(null)}
            >
              <title>{c.name}</title>
            </path>
          );
        })}
        {countries.map((c) => {
          const pos = ECOWAS_PINS[c.code];
          const isActive = activeCode === c.code;
          const label = `${c.name}${nationalLawCount(c.code) > 0 ? ` — ${nationalLawCount(c.code)} laws live` : ' — queued'}`;
          return (
            <g
              key={c.code}
              className={`ecowas-map__flag ${isActive ? 'is-on' : ''} ${c.status === 'active' ? 'is-live' : ''}`}
              transform={`translate(${pos.x} ${pos.y})`}
              filter="url(#ecowas-flag-shadow)"
              role="button"
              tabIndex={0}
              aria-label={label}
              style={{ cursor: 'pointer' }}
              onClick={() => setCode(c.code)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setCode(c.code); } }}
              onMouseEnter={() => setHover(c.code)}
              onMouseLeave={() => setHover(null)}
            >
              <title>{label}</title>
              <rect
                className="ecowas-map__flag-frame"
                x={-FLAG.w / 2 - 1.4}
                y={-FLAG.h / 2 - 1.4}
                width={FLAG.w + 2.8}
                height={FLAG.h + 2.8}
                rx="4.5"
              />
              <image
                href={`https://flagcdn.com/w80/${c.flag}.png`}
                x={-FLAG.w / 2}
                y={-FLAG.h / 2}
                width={FLAG.w}
                height={FLAG.h}
                clipPath="url(#ecowas-flag-clip)"
                preserveAspectRatio="xMidYMid slice"
              />
              {c.status === 'active' && (
                <circle className="ecowas-map__flag-dot" cx={FLAG.w / 2 - 1} cy={-FLAG.h / 2 + 1} r="4.2" />
              )}
            </g>
          );
        })}
      </svg>

      {hoverJ && (
        <div className="ecowas-map__tip" role="status">
          <strong>{hoverJ.name}</strong>
          {nationalLawCount(hoverJ.code) > 0
            ? ` · ${nationalLawCount(hoverJ.code).toLocaleString()} laws live`
            : ' · queued · ECOWAS layer only'}
        </div>
      )}

      <div className="ecowas-map__legend" aria-hidden="true">
        <span><i className="ecowas-map__swatch is-live" /> Live</span>
        <span><i className="ecowas-map__swatch is-queued" /> Queued</span>
      </div>

      <div className="ecowas-map__chip" aria-live="polite">
        <img src={`https://flagcdn.com/w40/${active.flag}.png`} alt="" />
        <span>
          <strong>{active.name}</strong>
          {nationalLawCount(active.code) > 0
            ? ` · ${nationalLawCount(active.code).toLocaleString()} laws live`
            : ' · national library not open yet'}
        </span>
      </div>
    </div>
  );
}
