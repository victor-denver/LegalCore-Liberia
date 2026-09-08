/**
 * LegalCore — Jurisdiction Registry
 * Own AI WebEngine trains ONE index per jurisdiction ("respect area country").
 * Liberia (LR) is LIVE. Other ECOWAS states are queued and unlock by legal
 * tradition: Anglophone → Francophone → Lusophone + ECOWAS Community layer.
 */

export type LegalTradition = 'common-law' | 'civil-law-fr' | 'civil-law-pt' | 'treaty-law';
export type JurisdictionStatus = 'active' | 'next' | 'queued';
export type EngineLanguage = 'en' | 'fr' | 'pt';

export interface Jurisdiction {
  /** ISO-2 + ECOWAS pseudo-code. ECOWAS = community layer. */
  code: string;
  name: string;
  capital: string;
  language: EngineLanguage;
  languageLabel: string;
  tradition: LegalTradition;
  traditionLabel: string;
  status: JurisdictionStatus;
  /** Flag CDN code (lowercase ISO). */
  flag: string;
  /** Phase in West-Africa plan. */
  phase: string;
  /** Boost applied when query explicitly names this jurisdiction. */
  jurisdictionBoost: number;
  /** Local synonyms the engine expands for this area (language-aware). */
  localSynonyms: Record<string, string[]>;
  /** Greeting / attitude line used by the answer builder. */
  voiceNote: string;
}

export const JURISDICTIONS: Jurisdiction[] = [
  {
    code: 'LR', name: 'Liberia', capital: 'Monrovia',
    language: 'en', languageLabel: 'English + Koloqua',
    tradition: 'common-law', traditionLabel: 'Common law (US-influenced)',
    status: 'active', flag: 'lr', phase: 'LIVE',
    jurisdictionBoost: 6,
    localSynonyms: {
      land: ['property', 'customary', 'deeds', 'tenure', 'land rights'],
      business: ['commercial', 'corporation', 'investment', 'concession', 'company'],
      criminal: ['penal', 'offense', 'crime', 'felony', 'misdemeanor'],
      court: ['judiciary', 'supreme court', 'circuit court', 'magistrate', 'temple of justice'],
      marriage: ['family', 'customary marriage', 'divorce', 'custody'],
      tax: ['revenue', 'LRA', 'customs', 'duty', 'GST'],
      health: ['public health', 'ebola', 'quarantine', 'hospital'],
      school: ['education', 'teacher', 'university', 'NCHE', 'WAEC'],
      environment: ['forest', 'mining', 'EPA', 'EIA', 'climate', 'FDA'],
      maritime: ['shipping', 'vessel', 'LiMA', 'port', 'flag state'],
      rights: ['human rights', 'TRC', 'discrimination', 'equality'],
    },
    voiceNote: 'Koloqua ON — Liberian English attitude',
  },
  {
    code: 'SL', name: 'Sierra Leone', capital: 'Freetown',
    language: 'en', languageLabel: 'English + Krio',
    tradition: 'common-law', traditionLabel: 'Common law (English)',
    status: 'next', flag: 'sl', phase: 'Phase 1',
    jurisdictionBoost: 6,
    localSynonyms: {
      land: ['property', 'customary', 'freehold', 'leasehold'],
      business: ['commercial', 'company', 'investment'],
      court: ['judiciary', 'supreme court', 'appeals', 'high court'],
      tax: ['revenue', 'NRA', 'customs', 'GST'],
      mining: ['mines', 'diamonds', 'EPA-SL', 'EIA'],
    },
    voiceNote: 'Krio-aware English',
  },
  {
    code: 'GH', name: 'Ghana', capital: 'Accra',
    language: 'en', languageLabel: 'English + Twi',
    tradition: 'common-law', traditionLabel: 'Common law (English)',
    status: 'queued', flag: 'gh', phase: 'Phase 1',
    jurisdictionBoost: 6,
    localSynonyms: {
      land: ['property', 'stool land', 'customary', 'lands commission'],
      business: ['commercial', 'registrar general', 'investment', 'GIPC'],
      court: ['judiciary', 'supreme court', 'court of appeal', 'high court'],
      tax: ['revenue', 'GRA', 'customs', 'VAT'],
    },
    voiceNote: 'Ghanaian English',
  },
  {
    code: 'GM', name: 'The Gambia', capital: 'Banjul',
    language: 'en', languageLabel: 'English',
    tradition: 'common-law', traditionLabel: 'Common law (English)',
    status: 'queued', flag: 'gm', phase: 'Phase 1',
    jurisdictionBoost: 6,
    localSynonyms: {
      land: ['property', 'customary', 'alkalo'],
      business: ['commercial', 'company', 'investment'],
      court: ['judiciary', 'supreme court', 'high court'],
      tax: ['revenue', 'GRA', 'customs'],
    },
    voiceNote: 'Gambian English',
  },
  {
    code: 'NG', name: 'Nigeria', capital: 'Abuja',
    language: 'en', languageLabel: 'English',
    tradition: 'common-law', traditionLabel: 'Common law — 37 jurisdictions (36 states + FCT)',
    status: 'queued', flag: 'ng', phase: 'Phase 1',
    jurisdictionBoost: 6,
    localSynonyms: {
      land: ['property', 'land use act', 'customary', 'C of O'],
      business: ['commercial', 'CAC', 'company', 'investment'],
      court: ['judiciary', 'supreme court', 'court of appeal', 'federal high court', 'sharia', 'customary'],
      tax: ['revenue', 'FIRS', 'customs', 'VAT'],
    },
    voiceNote: 'Nigerian English',
  },
  {
    code: 'SN', name: 'Senegal', capital: 'Dakar',
    language: 'fr', languageLabel: 'Français',
    tradition: 'civil-law-fr', traditionLabel: 'Civil law (French-derived)',
    status: 'queued', flag: 'sn', phase: 'Phase 2',
    jurisdictionBoost: 6,
    localSynonyms: {
      terre: ['foncier', 'propriété', 'coutumier', 'domaine'],
      entreprise: ['commercial', 'société', 'investissement', 'OHADA'],
      tribunal: ['justice', 'cour suprême', 'cour d’appel'],
      impôt: ['fiscalité', 'douane', 'TVA', 'DGID'],
      terre_property: ['land', 'property'],
    },
    voiceNote: 'Français — droit OHADA',
  },
  {
    code: 'CI', name: "Côte d'Ivoire", capital: 'Yamoussoukro',
    language: 'fr', languageLabel: 'Français',
    tradition: 'civil-law-fr', traditionLabel: 'Civil law (French-derived)',
    status: 'queued', flag: 'ci', phase: 'Phase 2',
    jurisdictionBoost: 6,
    localSynonyms: {
      terre: ['foncier', 'propriété', 'coutumier'],
      entreprise: ['commercial', 'société', 'OHADA', 'CEPICI'],
      tribunal: ['justice', 'cour suprême', 'cour d’appel'],
      impôt: ['fiscalité', 'douane', 'TVA', 'DGI'],
    },
    voiceNote: 'Français — droit OHADA',
  },
  {
    code: 'BJ', name: 'Benin', capital: 'Porto-Novo',
    language: 'fr', languageLabel: 'Français',
    tradition: 'civil-law-fr', traditionLabel: 'Civil law (French-derived)',
    status: 'queued', flag: 'bj', phase: 'Phase 2',
    jurisdictionBoost: 6,
    localSynonyms: {
      terre: ['foncier', 'propriété', 'coutumier'],
      entreprise: ['commercial', 'société', 'OHADA'],
      tribunal: ['justice', 'cour suprême'],
      impôt: ['fiscalité', 'douane', 'TVA'],
    },
    voiceNote: 'Français — droit OHADA',
  },
  {
    code: 'TG', name: 'Togo', capital: 'Lomé',
    language: 'fr', languageLabel: 'Français',
    tradition: 'civil-law-fr', traditionLabel: 'Civil law (French-derived)',
    status: 'queued', flag: 'tg', phase: 'Phase 2',
    jurisdictionBoost: 6,
    localSynonyms: {
      terre: ['foncier', 'propriété', 'coutumier'],
      entreprise: ['commercial', 'société', 'OHADA'],
      tribunal: ['justice', 'cour suprême'],
      impôt: ['fiscalité', 'douane', 'TVA', 'OTR'],
    },
    voiceNote: 'Français — droit OHADA',
  },
  {
    code: 'GN', name: 'Guinea', capital: 'Conakry',
    language: 'fr', languageLabel: 'Français',
    tradition: 'civil-law-fr', traditionLabel: 'Civil law (French-derived)',
    status: 'queued', flag: 'gn', phase: 'Phase 2',
    jurisdictionBoost: 6,
    localSynonyms: {
      terre: ['foncier', 'propriété', 'coutumier', 'mines'],
      entreprise: ['commercial', 'société', 'OHADA'],
      tribunal: ['justice', 'cour suprême'],
      impôt: ['fiscalité', 'douane', 'TVA'],
    },
    voiceNote: 'Français — droit OHADA',
  },
  {
    code: 'CV', name: 'Cabo Verde', capital: 'Praia',
    language: 'pt', languageLabel: 'Português',
    tradition: 'civil-law-pt', traditionLabel: 'Civil law (Portuguese-derived)',
    status: 'queued', flag: 'cv', phase: 'Phase 3',
    jurisdictionBoost: 6,
    localSynonyms: {
      terra: ['propriedade', 'terreno', 'consuetudinário'],
      empresa: ['comercial', 'sociedade', 'investimento'],
      tribunal: ['justiça', 'supremo tribunal'],
      imposto: ['fiscalidade', 'alfândega', 'IVA'],
    },
    voiceNote: 'Português — direito lusófono',
  },
  {
    code: 'GW', name: 'Guinea-Bissau', capital: 'Bissau',
    language: 'pt', languageLabel: 'Português + Crioulo',
    tradition: 'civil-law-pt', traditionLabel: 'Civil law (Portuguese-derived)',
    status: 'queued', flag: 'gw', phase: 'Phase 3',
    jurisdictionBoost: 6,
    localSynonyms: {
      terra: ['propriedade', 'terreno', 'consuetudinário'],
      empresa: ['comercial', 'sociedade', 'OHADA'],
      tribunal: ['justiça', 'supremo tribunal'],
      imposto: ['fiscalidade', 'alfândega', 'IVA'],
    },
    voiceNote: 'Português/Crioulo — direito lusófono',
  },
  {
    code: 'ECOWAS', name: 'ECOWAS Community', capital: 'Abuja',
    language: 'en', languageLabel: 'EN / FR / PT',
    tradition: 'treaty-law', traditionLabel: 'Treaty law (Revised Treaty + Protocols)',
    status: 'active', flag: 'ecowas', phase: 'Phase 3 — Community layer',
    jurisdictionBoost: 4,
    localSynonyms: {
      treaty: ['protocol', 'regulation', 'directive', 'revised treaty'],
      court: ['community court', 'ecowas court', 'justice'],
      trade: ['free movement', 'customs union', 'ETLS', 'common market'],
      business: ['ohada', 'uniform act', 'commercial'],
    },
    voiceNote: 'Trilingual community law',
  },
];

export const getJurisdiction = (code: string): Jurisdiction =>
  JURISDICTIONS.find((j) => j.code === code) ?? JURISDICTIONS[0];

export const ACTIVE_JURISDICTIONS = JURISDICTIONS.filter((j) => j.status === 'active');

/** Detect an explicitly named jurisdiction inside a query. */
const ALIASES: Record<string, string> = {
  liberia: 'LR', liberian: 'LR', monrovia: 'LR',
  'sierra leone': 'SL', freetown: 'SL', krio: 'SL',
  ghana: 'GH', accra: 'GH', twi: 'GH',
  gambia: 'GM', banjul: 'GM',
  nigeria: 'NG', abuja: 'NG', lagos: 'NG',
  senegal: 'SN', dakar: 'SN', wolof: 'SN',
  "cote d'ivoire": 'CI', 'cote divoire': 'CI', 'ivory coast': 'CI', abidjan: 'CI',
  benin: 'BJ', 'porto-novo': 'BJ', cotonou: 'BJ',
  togo: 'TG', lome: 'TG', 'lomé': 'TG',
  guinea: 'GN', conakry: 'GN',
  'cabo verde': 'CV', 'cape verde': 'CV', praia: 'CV',
  'guinea-bissau': 'GW', bissau: 'GW',
  ecowas: 'ECOWAS', ohada: 'ECOWAS', 'community court': 'ECOWAS',
};

export function detectJurisdictionInQuery(query: string): string | null {
  const q = ` ${query.toLowerCase().replace(/[^a-z' -]/g, ' ')} `;
  for (const [alias, code] of Object.entries(ALIASES)) {
    if (q.includes(` ${alias} `) || q.includes(` ${alias},`) || q.includes(` ${alias}?`)) return code;
  }
  // "in ghana", "ghana law" style without word-boundary fuss
  for (const [alias, code] of Object.entries(ALIASES)) {
    if (query.toLowerCase().includes(alias)) return code;
  }
  return null;
}

export const JURISDICTION_STORAGE_KEY = 'legalcore-jurisdiction';
