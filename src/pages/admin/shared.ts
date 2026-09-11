import { documents } from '../../data/legalData';
import { ecowasCommunityDocs } from '../../data/ecowasCommunity';
import { getJurisdiction } from '../../data/jurisdictions';

export const titleById = new Map([...documents, ...ecowasCommunityDocs].map((d) => [d.id, d.title]));
export const countryName = (code: string | null | undefined) => (code && code !== '?' ? getJurisdiction(code).name : 'Unknown');
export const fmtDate = (s: string) => new Date(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
export const fmtDateTime = (s: string) => new Date(s).toLocaleString();

export interface Who { email: string | null; full_name: string | null }
export const whoLabel = (p?: Who | null) => p?.full_name || p?.email || 'anonymous';
