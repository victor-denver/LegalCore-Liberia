/**
 * Typo-tolerant query parser for search + the on-device AI engine.
 * Splits phrases, drops filler words, and maps misspellings ("liber", "crimnal")
 * onto real legal / country terms.
 */

const STOP = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'by',
  'from', 'as', 'at', 'is', 'are', 'was', 'were', 'be', 'that', 'this', 'it',
  'its', 'what', 'whats', 'when', 'where', 'which', 'who', 'how', 'why',
  'do', 'does', 'did', 'can', 'could', 'should', 'would', 'will', 'please',
  'tell', 'explain', 'give', 'show', 'find', 'about', 'me', 'my', 'i',
  'want', 'need', 'know', 'just', 'any', 'some',
]);

/** Common misspellings and short forms → canonical term. */
const CORRECTIONS: Record<string, string> = {
  liber: 'liberia',
  libria: 'liberia',
  liberai: 'liberia',
  liberiaa: 'liberia',
  liberian: 'liberia',
  monrova: 'monrovia',
  monrovia: 'monrovia',
  crimnal: 'criminal',
  criminl: 'criminal',
  criminial: 'criminal',
  crime: 'criminal',
  penal: 'penal',
  pena: 'penal',
  constituion: 'constitution',
  consitution: 'constitution',
  constution: 'constitution',
  marraige: 'marriage',
  marrige: 'marriage',
  customery: 'customary',
  customry: 'customary',
  buisness: 'business',
  bussiness: 'business',
  registation: 'registration',
  ohadda: 'ohada',
  ecowa: 'ecowas',
  ecowas: 'ecowas',
  gahna: 'ghana',
  gana: 'ghana',
  nigeira: 'nigeria',
  nigerai: 'nigeria',
  ivroy: 'ivoire',
  divoire: 'ivoire',
};

const VOCAB = [
  'criminal', 'crime', 'penal', 'constitution', 'liberia', 'liberian', 'monrovia',
  'land', 'rights', 'customary', 'maritime', 'marriage', 'family', 'tax', 'court',
  'ohada', 'ecowas', 'procedure', 'murder', 'theft', 'assault', 'rape', 'domestic',
  'violence', 'business', 'company', 'concession', 'article', 'process', 'property',
  'commercial', 'labor', 'environment', 'education', 'health', 'trafficking',
  'sentencing', 'bail', 'juvenile', 'cybercrime', 'corruption', 'ghana', 'nigeria',
  'senegal', 'ivoire', 'gambia', 'sierra', 'leone', 'guinea', 'benin', 'togo',
];

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) row[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let prev = i - 1;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
      prev = tmp;
    }
  }
  return row[b.length];
}

export function correctToken(token: string): string {
  const t = token.toLowerCase();
  if (CORRECTIONS[t]) return CORRECTIONS[t];
  if (VOCAB.includes(t)) return t;
  let best = t;
  let bestD = 99;
  for (const v of VOCAB) {
    if (t.length >= 4 && (v.startsWith(t) || t.startsWith(v))) return v;
    if (t.length < 4 || Math.abs(v.length - t.length) > 2) continue;
    if (v[0] !== t[0]) continue;
    const d = levenshtein(t, v);
    const max = t.length >= 7 ? 2 : 1;
    if (d <= max && d < bestD) {
      bestD = d;
      best = v;
    }
  }
  return best;
}

export function queryTokens(raw: string): string[] {
  const words = normalizeText(raw).split(' ').filter((w) => w.length > 1 && !STOP.has(w));
  const out: string[] = [];
  const seen = new Set<string>();
  for (const w of words) {
    const c = correctToken(w);
    if (!seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
    if (c !== w && !seen.has(w)) {
      seen.add(w);
      out.push(w);
    }
  }
  return out;
}

function fuzzyIncludes(hay: string, token: string): boolean {
  if (hay.includes(token)) return true;
  if (token.length < 4) return false;
  const parts = hay.split(' ');
  for (const p of parts) {
    if (p.length < 4) continue;
    if (p.startsWith(token) || token.startsWith(p)) return true;
    if (Math.abs(p.length - token.length) <= 2 && p[0] === token[0] && levenshtein(p, token) <= 1) return true;
  }
  return false;
}

export interface SearchableDoc {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  body?: string;
  category?: string;
  type?: string;
  year?: number;
  jurisdiction?: string;
}

const WEAK = new Set(['law', 'act', 'code', 'legal', 'laws']);

/** Higher score = better match. 0 = no match. */
export function scoreDocument(doc: SearchableDoc, tokens: string[]): number {
  if (!tokens.length) return 0;
  const title = normalizeText(doc.title);
  const tags = normalizeText(doc.tags.join(' '));
  const summary = normalizeText(doc.summary);
  const category = normalizeText(`${doc.category ?? ''} ${doc.type ?? ''}`);
  const body = normalizeText((doc.body ?? '').slice(0, 2500));
  const hay = `${title} ${tags} ${summary} ${category} ${body}`;

  const strong = tokens.filter((t) => !WEAK.has(t));
  const required = strong.length ? strong : tokens;

  let score = 0;
  let hits = 0;
  for (const t of required) {
    let hit = false;
    if (title.includes(t)) { score += 8; hit = true; }
    else if (tags.includes(t) || category.includes(t)) { score += 6; hit = true; }
    else if (summary.includes(t)) { score += 4; hit = true; }
    else if (fuzzyIncludes(hay, t)) { score += 2; hit = true; }
    if (hit) hits++;
  }
  for (const t of tokens) {
    if (!WEAK.has(t)) continue;
    if (title.includes(t)) score += 1;
  }
  if (hits === 0) return 0;
  const need = required.length <= 2 ? required.length : Math.max(2, Math.ceil(required.length * 0.6));
  if (hits < need) return 0;
  let total = score + hits * 2;
  if (tokens.some((t) => t === 'criminal' || t === 'crime' || t === 'penal') && (title.includes('penal law') || title.includes('penal code'))) total += 16;
  if (tokens.some((t) => t === 'land' || t === 'customary') && title.includes('land rights')) total += 12;
  if (tokens.some((t) => t === 'constitution') && (title.includes('constitution of the republic') || doc.id === 'const-1986')) total += 12;
  if (doc.id.startsWith('gen-')) total *= 0.22;
  return total;
}

export function rankDocuments<T extends SearchableDoc>(docs: T[], rawQuery: string): T[] {
  const tokens = queryTokens(rawQuery);
  if (!tokens.length) return docs;
  return docs
    .map((d) => ({ d, s: scoreDocument(d, tokens) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.d);
}
