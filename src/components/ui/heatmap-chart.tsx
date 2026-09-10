import { documents } from '../../data/legalData';
import { ecowasCommunityDocs } from '../../data/ecowasCommunity';
import { JURISDICTIONS } from '../../data/jurisdictions';

function docJurisdiction(doc: { jurisdiction?: string }): string {
  return doc.jurisdiction ?? 'LR';
}

export function nationalLawCount(code: string): number {
  if (code === 'ECOWAS') return ecowasCommunityDocs.length;
  return documents.filter((d) => docJurisdiction(d as { jurisdiction?: string }) === code).length;
}

export function visibleLawCount(code: string): number {
  return nationalLawCount(code) + ecowasCommunityDocs.length;
}

const COUNTRIES = JURISDICTIONS.filter((j) => j.code !== 'ECOWAS');

export function CountryCoverageHeatmap({
  activeCode,
  onSelectCountry,
}: {
  activeCode?: string;
  onSelectCountry?: (code: string) => void;
}) {
  const max = Math.max(1, ...COUNTRIES.map((c) => visibleLawCount(c.code)));

  return (
    <div className="map-coverage">
      <div className="map-coverage__head">
        <h2>Laws on this site</h2>
        <p>Liberia is live. Other states currently share the ECOWAS community corpus until their national libraries open.</p>
      </div>
      <ul className="map-coverage__list">
        {COUNTRIES.map((c) => {
          const national = nationalLawCount(c.code);
          const visible = visibleLawCount(c.code);
          const pct = Math.max(2, (visible / max) * 100);
          const on = activeCode === c.code;
          return (
            <li key={c.code}>
              <button type="button" className={`map-coverage__row ${on ? 'on' : ''}`} onClick={() => onSelectCountry?.(c.code)}>
                <img src={`https://flagcdn.com/w80/${c.flag}.png`} alt="" />
                <span className="map-coverage__name">
                  <strong>{c.name}</strong>
                  <small>{c.status === 'active' ? 'Live library' : c.status === 'next' ? 'Next' : 'Queued'}</small>
                </span>
                <span className="map-coverage__bar" aria-hidden="true">
                  <i style={{ width: `${pct}%` }} />
                </span>
                <span className="map-coverage__n">
                  {national > 0 ? national.toLocaleString() : visible}
                  <small>{national > 0 ? 'national' : 'ECOWAS'}</small>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** @deprecated kept so existing heatmap imports still typecheck if referenced */
export const HeatmapChart = CountryCoverageHeatmap;
