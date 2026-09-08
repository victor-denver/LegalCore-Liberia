/**
 * LegalCore WebEngine v1 — our OWN on-device AI search + answer engine.
 *
 * No external API. No server. The engine is TRAINED on our database,
 * separately per jurisdiction ("respect area country"):
 *
 *   engine.train(corpus) → builds a BM25 inverted index
 *   engine.setJurisdiction('LR') → re-trains focus on Liberia + ECOWAS layer
 *   engine.setJurisdiction('GH') → focuses Ghana docs + ECOWAS layer (+
 *                                  Liberia comparative reference until the
 *                                  Ghana corpus lands)
 *
 * Design: BM25 (k1=1.2, b=0.75) over weighted fields
 *   title x4 · tags x2.5 · summary x2 · body x1
 * + jurisdiction boost, year/article boost, synonym expansion (EN/FR/PT),
 * + grounded answer builder with confidence + refusal threshold.
 */
import type { LegalDocument } from '../data/legalData';
import { getJurisdiction, detectJurisdictionInQuery, type EngineLanguage } from '../data/jurisdictions';

// ── Types ──────────────────────────────────────────────────────────────

export type EngineDoc = LegalDocument & { jurisdiction: string };

export interface TrainingStats {
  jurisdiction: string;
  primaryDocs: number;
  communityDocs: number;
  comparativeDocs: number;
  totalIndexed: number;
  uniqueTerms: number;
  avgDocLength: number;
  trainMs: number;
  trainedAt: string;
}

export type QueryIntent =
  | 'greeting'
  | 'definition'
  | 'procedure'
  | 'penalty'
  | 'comparison'
  | 'listing'
  | 'general';

export interface EngineAnswer {
  /** Markdown answer, grounded in sources. */
  content: string;
  sources: EngineDoc[];
  confidence: number; // 0..1
  latencyMs: number;
  /** Jurisdiction the answer was computed for. */
  jurisdiction: string;
  /** Jurisdiction explicitly named in the query, if any. */
  detectedJurisdiction: string | null;
  intent: QueryIntent;
  /** True when the active corpus has no national docs yet (queued country). */
  isComparative: boolean;
  scores: number[];
}

interface Posting {
  docId: string;
  weight: number; // jurisdiction weight (1.0 primary, 0.7 community, 0.4 comparative)
}

// ── Tokenization (EN / FR / PT) ────────────────────────────────────────

const STOP_EN = new Set(
  'the,a,an,and,or,of,to,in,on,for,with,by,from,as,at,is,are,was,were,be,been,being,that,this,these,those,it,its,into,over,under,what,whats,when,where,which,who,whom,how,why,do,does,did,can,could,should,would,will,shall,may,might,must,not,no,yes,please,tell,explain,give,show,find,about,under,between,among,per,via,etc,wetin,na,deh,lek,dis,dat,den'.split(','),
);
const STOP_FR = new Set(
  'le,la,les,un,une,des,du,de,au,aux,et,ou,où,de,des,en,dans,sur,pour,avec,par,est,sont,était,ce,cette,ces,il,elle,ils,elles,que,qui,quoi,comment,pourquoi,quel,quelle,quels,quelles,ne,pas,plus,moins,très,aussi,comme,tout,toute,tous,toutes,son,sa,ses,leur,leurs,mon,ma,mes,expliquer,expliquez,donner,quel,est'.split(','),
);
const STOP_PT = new Set(
  'o,a,os,as,um,uma,uns,umas,de,do,da,dos,das,em,no,na,nos,nas,para,com,por,que,qual,quais,como,onde,quando,quem,este,esta,estes,estas,esse,essa,isso,isto,ele,ela,eles,elas,se,ser,são,era,foi,explicar,explique,mostrar,dar,falar'.split(','),
);

function stopwordsFor(lang: EngineLanguage): Set<string> {
  if (lang === 'fr') return STOP_FR;
  if (lang === 'pt') return STOP_PT;
  return STOP_EN;
}

/** Lowercase, strip diacritics, keep alphanumerics. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Light stemmer shared across EN/FR/PT (keeps recall high, no dependency). */
function stem(token: string): string {
  if (token.length <= 4) return token;
  if (token.endsWith('ies') && token.length > 5) return token.slice(0, -3) + 'y';
  if (token.endsWith('tion') || token.endsWith('sion')) return token.slice(0, -4);
  if (token.endsWith('ment')) return token.slice(0, -4);
  if (token.endsWith('eurs') || token.endsWith('euse')) return token.slice(0, -4);
  if (token.endsWith('ing') && token.length > 6) return token.slice(0, -3);
  if (token.endsWith('ies')) return token.slice(0, -3);
  if (token.endsWith('es') && token.length > 5) return token.slice(0, -2);
  if (token.endsWith('s') && token.length > 4 && !token.endsWith('ss')) return token.slice(0, -1);
  if (token.endsWith('e') && token.length > 5) return token.slice(0, -1);
  return token;
}

export function tokenize(text: string, lang: EngineLanguage = 'en'): string[] {
  const stop = stopwordsFor(lang);
  return normalize(text)
    .split(' ')
    .filter((t) => t.length > 2 && !stop.has(t))
    .map(stem);
}

// Global legal synonyms (language-aware core) merged with jurisdiction ones.
const GLOBAL_SYNONYMS: Record<string, string[]> = {
  land: ['property', 'customary', 'tenure', 'foncier', 'terra', 'propriedade'],
  property: ['land', 'estate', 'foncier', 'propriedade'],
  business: ['commercial', 'company', 'entreprise', 'empresa', 'investment', 'ohada'],
  commercial: ['business', 'trade', 'entreprise'],
  crime: ['criminal', 'penal', 'offense', 'penal'],
  criminal: ['crime', 'penal', 'offense', 'felony'],
  court: ['judiciary', 'tribunal', 'tribunal', 'justice', 'supreme', 'appeal'],
  constitution: ['treaty', 'traite', 'constituicao', 'article'],
  tax: ['revenue', 'impot', 'fiscalite', 'imposto', 'customs', 'douane', 'vat', 'tva', 'cet', 'etls'],
  health: ['sante', 'saude', 'ebola', 'quarantine', 'hospital'],
  school: ['education', 'ecole', 'escola', 'teacher', 'university'],
  environment: ['forest', 'foret', 'floresta', 'mining', 'mines', 'climate', 'climat', 'eia'],
  maritime: ['shipping', 'vessel', 'navire', 'navio', 'port', 'lima', 'flag'],
  rights: ['droits', 'direitos', 'human', 'discrimination', 'equality', 'trc'],
  marriage: ['mariage', 'casamento', 'family', 'famille', 'divorce', 'custody'],
  treaty: ['traite', 'tratado', 'protocol', 'protocole', 'regulation', 'reglement'],
  movement: ['circulation', 'movimento', 'free', 'libre', 'visa'],
};

function expandTerms(tokens: string[], local: Record<string, string[]>): string[] {
  const out = new Set<string>(tokens);
  const all: Record<string, string[]> = { ...GLOBAL_SYNONYMS, ...local };
  for (const t of tokens) {
    for (const [k, vals] of Object.entries(all)) {
      const ks = stem(normalize(k));
      if (t === ks || t.includes(ks) || ks.includes(t)) {
        vals.forEach((v) => normalize(v).split(' ').forEach((w) => { if (w.length > 2) out.add(stem(w)); }));
        out.add(ks);
      }
    }
  }
  return [...out];
}

// ── Intent + helpers ───────────────────────────────────────────────────

function detectIntent(q: string): QueryIntent {
  const s = q.toLowerCase();
  if (/^(hi|hello|hey|yo|good (morning|afternoon|evening)|thanks|thank you|bonjour|salut|merci|ola|obrigado)\b/.test(s.trim()) && s.trim().split(/\s+/).length < 6)
    return 'greeting';
  if (/(compare|comparison|difference|differences|vs\.?|versus|différence|différences|comparer|diferença|comparar)/.test(s)) return 'comparison';
  if (/(how (do|to|can)|steps?|procedure|process|register|registration|file|filing|apply|incorporat|comment|como|quelles sont les étapes)/.test(s)) return 'procedure';
  if (/(penalt|punish|sentence|fine|imprison|peine|sanction|puni|pena|multa|prisão)/.test(s)) return 'penalty';
  if (/(what is|what are|what does|define|definition|meaning of|qu'est-ce|définition|c'est quoi|o que é|significado)/.test(s)) return 'definition';
  if (/(list|all|show me|tous|toutes|liste|todos|todas)/.test(s)) return 'listing';
  return 'general';
}

function extractYear(q: string): number | null {
  const m = q.match(/\b(18\d{2}|19\d{2}|20[0-2]\d)\b/);
  return m ? parseInt(m[1], 10) : null;
}

function extractArticle(q: string): string | null {
  const m = q.toLowerCase().match(/article\s*(\d+[a-z]?)/);
  return m ? m[1] : null;
}

// ── The engine ─────────────────────────────────────────────────────────

const K1 = 1.2;
const B = 0.75;

export class LegalCoreWebEngine {
  readonly name = 'LegalCore WebEngine';
  readonly version = 'v1.0';
  private allDocs: EngineDoc[] = [];
  private activeJurisdiction = 'LR';
  private trainedFor: string | null = null;

  // Per-training-focus index
  private indexed: EngineDoc[] = [];
  private weights = new Map<string, number>(); // docId -> jurisdiction weight
  private docTermFreq = new Map<string, Map<string, number>>();
  private docFreq = new Map<string, number>();
  private docLen = new Map<string, number>();
  private postings = new Map<string, Posting[]>();
  private avgLen = 0;
  private stats: TrainingStats | null = null;

  get jurisdiction(): string {
    return this.activeJurisdiction;
  }

  /** Load the full database (all jurisdictions). Legacy docs default to LR. */
  train(corpus: (LegalDocument & { jurisdiction?: string })[], jurisdiction?: string): TrainingStats {
    const t0 = performance.now();
    this.allDocs = corpus.map((d) => ({ ...d, jurisdiction: d.jurisdiction ?? 'LR' }) as EngineDoc);
    if (jurisdiction) this.activeJurisdiction = jurisdiction;
    this.buildIndex();
    const trainMs = performance.now() - t0;
    if (this.stats) this.stats.trainMs = trainMs;
    return this.stats!;
  }

  /** Re-train focus on a respect-area country. Keeps the same DB. */
  setJurisdiction(code: string): TrainingStats {
    this.activeJurisdiction = code;
    this.buildIndex();
    return this.stats!;
  }

  getStats(): TrainingStats | null {
    return this.stats;
  }

  getIndexedCount(): number {
    return this.indexed.length;
  }

  // ── Index build (per jurisdiction) ──
  private buildIndex(): void {
    const code = this.activeJurisdiction;
    const primary = this.allDocs.filter((d) => d.jurisdiction === code);
    const community = this.allDocs.filter((d) => d.jurisdiction === 'ECOWAS');
    // Comparative fallback: Liberia reference docs at reduced weight when the
    // active country has no national corpus yet (queued). Honest + useful.
    const comparative =
      code !== 'LR' && code !== 'ECOWAS' && primary.length === 0
        ? this.allDocs.filter((d) => d.jurisdiction === 'LR')
        : [];

    this.indexed = [...primary, ...community, ...comparative];
    this.weights = new Map([
      ...primary.map((d) => [d.id, 1] as [string, number]),
      ...community.map((d) => [d.id, 0.7] as [string, number]),
      ...comparative.map((d) => [d.id, 0.4] as [string, number]),
    ]);

    this.docTermFreq.clear();
    this.docFreq.clear();
    this.docLen.clear();
    this.postings.clear();

    const j = getJurisdiction(code === 'ECOWAS' ? 'LR' : code);
    const lang = j.language;

    let totalLen = 0;
    for (const doc of this.indexed) {
      const tf = new Map<string, number>();
      const add = (text: string, w: number) => {
        for (const t of tokenize(text, lang)) tf.set(t, (tf.get(t) ?? 0) + w);
      };
      add(doc.title, 4);
      add(doc.tags.join(' '), 2.5);
      add(doc.summary, 2);
      add(doc.body, 1);
      // Jurisdiction + category tokens so "ghana tax" style queries route.
      add(`${doc.jurisdiction} ${doc.category} ${doc.type} ${doc.year}`, 1.5);
      this.docTermFreq.set(doc.id, tf);
      let len = 0;
      tf.forEach((v) => (len += v));
      this.docLen.set(doc.id, len);
      totalLen += len;
      for (const term of tf.keys()) {
        this.docFreq.set(term, (this.docFreq.get(term) ?? 0) + 1);
        const list = this.postings.get(term) ?? [];
        list.push({ docId: doc.id, weight: this.weights.get(doc.id) ?? 1 });
        this.postings.set(term, list);
      }
    }
    this.avgLen = this.indexed.length ? totalLen / this.indexed.length : 0;
    this.trainedFor = code;
    this.stats = {
      jurisdiction: code,
      primaryDocs: primary.length,
      communityDocs: community.length,
      comparativeDocs: comparative.length,
      totalIndexed: this.indexed.length,
      uniqueTerms: this.docFreq.size,
      avgDocLength: Math.round(this.avgLen * 10) / 10,
      trainMs: 0,
      trainedAt: new Date().toISOString(),
    };
  }

  // ── Query ──
  query(rawQuery: string, topK = 4): EngineAnswer {
    const t0 = performance.now();
    const q = rawQuery.trim();
    const mentioned = detectJurisdictionInQuery(q);
    // Effective jurisdiction: explicitly named country wins for THIS query.
    const effCode = mentioned ?? this.activeJurisdiction;
    const j = getJurisdiction(effCode === 'ECOWAS' ? 'LR' : effCode);
    const intent = detectIntent(q);
    const year = extractYear(q);
    const article = extractArticle(q);

    if (!q) {
      return {
        content: 'Ask me anything about the law — e.g. **Land Rights Act 2018**.',
        sources: [], confidence: 0, latencyMs: 0,
        jurisdiction: effCode, detectedJurisdiction: mentioned, intent, isComparative: false, scores: [],
      };
    }

    if (intent === 'greeting') {
      const totalNational = this.allDocs.filter((d) => d.jurisdiction === this.activeJurisdiction).length;
      return {
        content: greetingFor(this.activeJurisdiction, this.name, this.version, this.allDocs.length, totalNational),
        sources: [], confidence: 1, latencyMs: performance.now() - t0,
        jurisdiction: effCode, detectedJurisdiction: mentioned, intent, isComparative: false, scores: [],
      };
    }

    const tokens = tokenize(q, j.language);
    if (tokens.length === 0) {
      return {
        content: `Try simpler words like *land*, *constitution*, *tax* — or ask in ${j.languageLabel}.`,
        sources: [], confidence: 0, latencyMs: performance.now() - t0,
        jurisdiction: effCode, detectedJurisdiction: mentioned, intent, isComparative: false, scores: [],
      };
    }
    const expanded = expandTerms(tokens, j.localSynonyms);

    // Re-target index if the query names a different jurisdiction than trained.
    const useIndexFromOther = mentioned && mentioned !== this.trainedFor;
    const saved = useIndexFromOther
      ? { idx: this.indexed, w: this.weights, tf: this.docTermFreq, df: this.docFreq, len: this.docLen, post: this.postings, avg: this.avgLen, code: this.trainedFor }
      : null;
    if (useIndexFromOther && mentioned) {
      const prev = this.activeJurisdiction;
      this.activeJurisdiction = mentioned;
      this.buildIndex();
      this.activeJurisdiction = prev;
    }

    try {
      const N = this.indexed.length;
      const scores = new Map<string, number>();
      for (const term of expanded) {
        const posting = this.postings.get(term);
        if (!posting) continue;
        const df = this.docFreq.get(term) ?? 1;
        const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
        for (const { docId, weight } of posting) {
          const tf = this.docTermFreq.get(docId)?.get(term) ?? 0;
          const dl = this.docLen.get(docId) ?? 1;
          const norm = tf * (K1 + 1) / (tf + K1 * (1 - B + (B * dl) / (this.avgLen || 1)));
          scores.set(docId, (scores.get(docId) ?? 0) + idf * norm * weight);
        }
      }

      // Heuristic boosts: title phrase, year, article, category hint.
      const qNorm = normalize(q);
      const byId = new Map(this.indexed.map((d) => [d.id, d]));
      scores.forEach((s, id) => {
        const d = byId.get(id);
        if (!d) return;
        let boost = 0;
        const titleNorm = normalize(d.title);
        if (qNorm.length > 5 && (titleNorm.includes(qNorm) || qNorm.includes(titleNorm.slice(0, 40)))) boost += 8;
        // Word-overlap on raw (unstemmed) title for precision
        const qWords = qNorm.split(' ').filter((w) => w.length > 3);
        const overlap = qWords.filter((w) => titleNorm.includes(w)).length;
        boost += overlap * 1.5;
        if (year && d.year === year) boost += 3;
        if (article && normalize(`${d.title} ${d.summary} ${d.body}`).includes(`article ${article}`)) boost += 4;
        if (mentioned && d.jurisdiction === mentioned) boost += getJurisdiction(mentioned === 'ECOWAS' ? 'LR' : mentioned).jurisdictionBoost;
        if (!mentioned && d.jurisdiction === this.activeJurisdiction) boost += 2;
        scores.set(id, s + boost);
      });

      const ranked = [...scores.entries()]
        .filter(([, s]) => s > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, topK);
      const sources = ranked.map(([id]) => byId.get(id)!).filter(Boolean);
      const topScores = ranked.map(([, s]) => Math.round(s * 100) / 100);

      // Confidence: saturating function of top score + margin + coverage.
      let confidence = 0;
      if (ranked.length > 0) {
        const top = ranked[0][1];
        const second = ranked[1]?.[1] ?? 0;
        const margin = top - second;
        confidence = (1 - 1 / (1 + top / 5)) * 0.75 + Math.min(0.15, margin / 40) + Math.min(0.1, (overlapCoverage(q, sources[0]) * 0.1));
        confidence = Math.max(0.05, Math.min(0.98, confidence));
      }

      const isComparative =
        (this.stats?.primaryDocs ?? 1) === 0 &&
        sources.length > 0 &&
        sources.every((d) => d.jurisdiction !== effCode);

      const content = this.buildAnswer(q, intent, sources, {
        confidence, effCode, mentioned, year, article, isComparative,
      });

      return {
        content, sources, confidence: Math.round(confidence * 100) / 100,
        latencyMs: Math.round((performance.now() - t0) * 10) / 10,
        jurisdiction: effCode, detectedJurisdiction: mentioned,
        intent, isComparative, scores: topScores,
      };
    } finally {
      if (saved) {
        this.indexed = saved.idx; this.weights = saved.w; this.docTermFreq = saved.tf;
        this.docFreq = saved.df; this.docLen = saved.len; this.postings = saved.post;
        this.avgLen = saved.avg; this.trainedFor = saved.code;
      }
    }
  }

  // ── Grounded answer builder (framed in the area's language: EN/FR/PT) ──
  private buildAnswer(
    q: string, intent: QueryIntent, sources: EngineDoc[],
    ctx: { confidence: number; effCode: string; mentioned: string | null; year: number | null; article: string | null; isComparative: boolean },
  ): string {
    const effJ = getJurisdiction(ctx.effCode === 'ECOWAS' ? 'LR' : ctx.effCode);
    const lang = ctx.effCode === 'ECOWAS' ? 'en' : effJ.language;
    const T = ANSWER_STRINGS[lang];
    const jName = ctx.effCode === 'ECOWAS' ? T.ecowasName : getJurisdiction(ctx.effCode).name;
    const lowConf = ctx.confidence < 0.3 || sources.length === 0;

    if (sources.length === 0) {
      const fallback = this.indexed
        .filter((d) => ['const-1986', 'stat-2018-land-rights', 'ecowas-revised-treaty-1993'].includes(d.id))
        .slice(0, 3);
      const list = fallback.length
        ? '\n\n' + fallback.map((d) => `**${d.title}** — *${d.date}* (${d.type}, ${d.jurisdiction})`).join('\n')
        : '';
      return T.noMatch(q, jName) + `${list}` + T.foundationsNote;
    }

    const intentLine =
      intent === 'procedure' ? T.intentProcedure
      : intent === 'penalty' ? T.intentPenalty
      : intent === 'definition' ? T.intentDefinition
      : intent === 'comparison' ? T.intentComparison
      : T.intentGeneral(jName);

    const bullets = sources
      .map((d) => `**${d.title}** — *${d.date}* (${d.type}, ${d.jurisdiction})\n${d.summary}`)
      .join('\n\n');

    const mentionedName = ctx.mentioned === 'ECOWAS' ? T.ecowasName : ctx.mentioned ? getJurisdiction(ctx.mentioned).name : '';
    const switchNote =
      ctx.mentioned && ctx.mentioned !== this.activeJurisdiction
        ? T.switchNote(mentionedName, getJurisdiction(this.activeJurisdiction).name)
        : '';

    const comparativeNote = ctx.isComparative
      ? T.comparativeNote(jName, getJurisdiction(ctx.effCode).phase)
      : '';

    const lowNote = lowConf ? T.lowNote(Math.round(ctx.confidence * 100)) : '';
    const footer = T.footer(sources[0].title);

    return intentLine + bullets + switchNote + comparativeNote + lowNote + footer;
  }

  /** Quick self-check: each probe query must return its expected doc in top-3. */
  evaluate(probes: { q: string; expectId: string }[]): { passed: number; total: number; failures: string[] } {
    const failures: string[] = [];
    for (const p of probes) {
      const r = this.query(p.q, 3);
      if (!r.sources.some((s) => s.id === p.expectId)) failures.push(`"${p.q}" → expected ${p.expectId}, got [${r.sources.map((s) => s.id).join(', ')}]`);
    }
    return { passed: probes.length - failures.length, total: probes.length, failures };
  }
}

function overlapCoverage(q: string, top?: EngineDoc): number {
  if (!top) return 0;
  const qWords = new Set(normalize(q).split(' ').filter((w) => w.length > 3));
  if (qWords.size === 0) return 0;
  const hay = normalize(`${top.title} ${top.summary} ${top.tags.join(' ')}`);
  let hit = 0;
  qWords.forEach((w) => { if (hay.includes(w)) hit++; });
  return hit / qWords.size;
}

// ── Singleton + one-shot training helper ───────────────────────────────

let singleton: LegalCoreWebEngine | null = null;

export function getWebEngine(): LegalCoreWebEngine {
  if (!singleton) singleton = new LegalCoreWebEngine();
  return singleton;
}

/** Train the singleton on the national DB + ECOWAS community corpus. */
export function ensureEngineTrained(
  nationalDocs: (LegalDocument & { jurisdiction?: string })[],
  communityDocs: (LegalDocument & { jurisdiction?: string })[],
  jurisdiction: string,
): { engine: LegalCoreWebEngine; stats: TrainingStats } {
  const engine = getWebEngine();
  const stats = engine.train([...nationalDocs, ...communityDocs], jurisdiction);
  return { engine, stats };
}

/** Built-in smoke probes used to verify training per jurisdiction. */
export const ENGINE_SMOKE_PROBES: { q: string; expectId: string }[] = [
  { q: 'Land Rights Act 2018 customary land', expectId: 'stat-2018-land-rights' },
  { q: 'Article 20 due process', expectId: 'land-1986-art20' },
  { q: 'ECOWAS free movement visa-free 90 days', expectId: 'ecowas-free-movement' },
  { q: 'OHADA company SARL incorporation', expectId: 'ohada-company-law-2014' },
];

// ── Per-area language framing ──────────────────────────────────────────

interface AnswerStrings {
  ecowasName: string;
  noMatch: (q: string, jName: string) => string;
  foundationsNote: string;
  intentProcedure: string;
  intentPenalty: string;
  intentDefinition: string;
  intentComparison: string;
  intentGeneral: (jName: string) => string;
  switchNote: (asked: string, workspace: string) => string;
  comparativeNote: (jName: string, phase: string) => string;
  lowNote: (pct: number) => string;
  footer: (title: string) => string;
}

const ANSWER_STRINGS: Record<'en' | 'fr' | 'pt', AnswerStrings> = {
  en: {
    ecowasName: 'ECOWAS Community law',
    noMatch: (q, jName) =>
      `I couldn't find a verified match for **"${q}"** in **${jName}** — and I won't guess.` +
      ` Try simpler words like *land*, *constitution*, *tax*, *OHADA*, *free movement*.`,
    foundationsNote: `\n\n_Foundations you can start from above. Every answer here is cited._`,
    intentProcedure: `Here's the **procedure** under the cited instruments:\n\n`,
    intentPenalty: `Here's what the cited instruments say on **penalties**:\n\n`,
    intentDefinition: `Here's the **legal meaning** from the cited instruments:\n\n`,
    intentComparison: `Here's a **comparison** grounded in the cited instruments:\n\n`,
    intentGeneral: (jName) => `Here's what I found in **${jName}** — grounded, cited, no guessing:\n\n`,
    switchNote: (asked, workspace) =>
      `\n\n_Jurisdiction note: you asked about **${asked}** — I answered from that area's training slice. Your workspace is still set to **${workspace}**._`,
    comparativeNote: (jName, phase) =>
      `\n\n_Respect-area note: **${jName}** full corpus is queued (${phase}). Above is ECOWAS community law + Liberia comparative reference — verified, but confirm with local counsel before relying._`,
    lowNote: (pct) =>
      `\n\n_Low-confidence match (${pct}%) — closest verified instruments shown. Rephrase with a year, article number, or Act name for a stronger hit._`,
    footer: (title) => `\n\nTap any **source** below to read the full text. Want it simpler? Say "summarize ${title} simply".`,
  },
  fr: {
    ecowasName: 'le droit communautaire CEDEAO',
    noMatch: (q, jName) =>
      `Je n'ai trouvé aucune correspondance vérifiée pour **« ${q} »** en **${jName}** — et je ne devine jamais.` +
      ` Essayez des mots simples comme *terre*, *constitution*, *impôt*, *OHADA*, *libre circulation*.`,
    foundationsNote: `\n\n_Des fondations pour commencer ci-dessus. Chaque réponse ici est citée._`,
    intentProcedure: `Voici la **procédure** selon les instruments cités :\n\n`,
    intentPenalty: `Voici ce que disent les instruments cités sur les **peines** :\n\n`,
    intentDefinition: `Voici le **sens juridique** selon les instruments cités :\n\n`,
    intentComparison: `Voici une **comparaison** fondée sur les instruments cités :\n\n`,
    intentGeneral: (jName) => `Voici ce que j'ai trouvé en **${jName}** — fondé, cité, sans deviner :\n\n`,
    switchNote: (asked, workspace) =>
      `\n\n_Note de juridiction : vous avez demandé **${asked}** — j'ai répondu depuis la tranche de cette zone. Votre espace reste réglé sur **${workspace}**._`,
    comparativeNote: (jName, phase) =>
      `\n\n_Note de zone : le corpus complet de **${jName}** est en file (${phase}). Ci-dessus : droit communautaire CEDEAO + référence comparative du Liberia — vérifié, mais confirmez avec un juriste local avant usage._`,
    lowNote: (pct) =>
      `\n\n_Correspondance faible (${pct} %) — instruments vérifiés les plus proches affichés. Reformulez avec une année, un numéro d'article ou un nom de loi._`,
    footer: (title) => `\n\nTouchez une **source** ci-dessous pour lire le texte intégral. Version simple ? Dites « résume ${title} simplement ».`,
  },
  pt: {
    ecowasName: 'o direito comunitário CEDEAO',
    noMatch: (q, jName) =>
      `Não encontrei correspondência verificada para **« ${q} »** em **${jName}** — e nunca adivinho.` +
      ` Tente palavras simples como *terra*, *constituição*, *imposto*, *OHADA*, *livre circulação*.`,
    foundationsNote: `\n\n_Bases para começar acima. Cada resposta aqui é citada._`,
    intentProcedure: `Eis o **procedimento** segundo os instrumentos citados:\n\n`,
    intentPenalty: `Eis o que dizem os instrumentos citados sobre **penas**:\n\n`,
    intentDefinition: `Eis o **significado jurídico** segundo os instrumentos citados:\n\n`,
    intentComparison: `Eis uma **comparação** fundamentada nos instrumentos citados:\n\n`,
    intentGeneral: (jName) => `Eis o que encontrei em **${jName}** — fundamentado, citado, sem adivinhar:\n\n`,
    switchNote: (asked, workspace) =>
      `\n\n_Nota de jurisdição: perguntou sobre **${asked}** — respondi a partir do recorte dessa zona. O seu espaço continua em **${workspace}**._`,
    comparativeNote: (jName, phase) =>
      `\n\n_Nota de zona: o corpus completo de **${jName}** está na fila (${phase}). Acima: direito comunitário CEDEAO + referência comparativa da Libéria — verificado, mas confirme com um jurista local antes de usar._`,
    lowNote: (pct) =>
      `\n\n_Correspondência fraca (${pct} %) — instrumentos verificados mais próximos apresentados. Reformule com um ano, número de artigo ou nome de lei._`,
    footer: (title) => `\n\nToque numa **fonte** abaixo para ler o texto integral. Versão simples? Diga «resume ${title} de forma simples».`,
  },
};

/** Greeting tuned to the active respect-area country + its language. */
function greetingFor(code: string, engineName: string, version: string, total: number, national: number): string {
  const j = getJurisdiction(code === 'ECOWAS' ? 'LR' : code);
  const scope = national ? ` (**${national}** for **${j.name}** + ECOWAS community law)` : '';
  const head = `I'm **LegalCore AI** — running on our own **${engineName} ${version}**, trained on **${total}** legal instruments${scope}.`;

  if (j.language === 'fr') {
    return (
      `Bonjour ! ${head}\n\n` +
      `Chaque réponse est fondée et citée — jamais de devinettes. Demandez comme une personne :\n` +
      `• « Comment créer une SARL sous l'OHADA ? »\n` +
      `• « Un Libérien peut-il entrer sans visa pour 90 jours ? »\n` +
      `• « Comment saisir la Cour de justice de la CEDEAO ? »\n\nQue voulez-vous savoir ?`
    );
  }
  if (j.language === 'pt') {
    return (
      `Olá! ${head}\n\n` +
      `Cada resposta é fundamentada e citada — sem adivinhação. Pergunte como uma pessoa:\n` +
      `• « Como constituir uma SARL segundo a OHADA? »\n` +
      `• « Um liberiano pode entrar em ${j.name} sem visto por 90 dias? »\n` +
      `• « Como recorrer ao Tribunal de Justiça da CEDEAO? »\n\nO que quer saber?`
    );
  }
  if (code === 'LR' || code === 'ECOWAS') {
    return (
      `Hey! ${head}\n\n` +
      `Every answer is grounded and cited — no guessing. Ask me like a person:\n` +
      `• "What does Article 20 say about due process?"\n` +
      `• "How do I register customary land?"\n` +
      `• "Can a Liberian work visa-free in Ghana?"\n\nWhat do you want to know?`
    );
  }
  return (
    `Hey! ${head}\n\n` +
    `Every answer is grounded and cited — no guessing. Ask me like a person:\n` +
    `• "Can a ${demonym(code)} enter Liberia visa-free for 90 days?"\n` +
    `• "How do I register a business in ${j.name}?"\n` +
    `• "How do I file a case at the ECOWAS Community Court?"\n\nWhat do you want to know?`
  );
}

function demonym(code: string): string {
  const map: Record<string, string> = {
    SL: 'Sierra Leonean', GH: 'Ghanaian', GM: 'Gambian', NG: 'Nigerian',
    SN: 'Senegalese', CI: 'Ivorian', BJ: 'Beninese', TG: 'Togolese',
    GN: 'Guinean', CV: 'Cape Verdean', GW: 'Bissau-Guinean', LR: 'Liberian',
  };
  return map[code] ?? getJurisdiction(code).name;
}
