import { documents, courtLocations, categories } from './src/data/legalData.ts';
import { ecowasCommunityDocs } from './src/data/ecowasCommunity.ts';
import { getProvenance } from './src/data/provenance.ts';
import { JURISDICTIONS } from './src/data/jurisdictions.ts';
import { writeFileSync } from 'node:fs';

const all = [...documents, ...ecowasCommunityDocs];
const byCategory: Record<string, number> = {};
for (const d of all) byCategory[d.category] = (byCategory[d.category] ?? 0) + 1;
const tiers: Record<string, number> = { certified: 0, verified: 0, reference: 0 };
for (const d of all) tiers[getProvenance(d).tier]++;
const byCounty: Record<string, number> = {};
for (const c of courtLocations) byCounty[c.county] = (byCounty[c.county] ?? 0) + 1;
const stats = {
  total: all.length,
  liberia: documents.length,
  ecowas: ecowasCommunityDocs.length,
  byCategory,
  categoryLabels: Object.fromEntries(categories.map((c) => [c.id, c.label])),
  tiers,
  courts: courtLocations.length,
  byCounty,
  jurisdictions: JURISDICTIONS.filter((j) => j.code !== 'ECOWAS').length,
};
writeFileSync('report-stats.json', JSON.stringify(stats, null, 2));
console.log(JSON.stringify(stats));
