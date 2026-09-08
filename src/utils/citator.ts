/** Citator — reverse citation graph: which instruments cite this one.
 *  Citations in the corpus are free text ("Constitution of Liberia (1986), Art. 20"),
 *  so matches are detected by significant-title-token overlap. Honest + explainable. */
import type { LegalDocument } from '../data/legalData';
import { normalize } from '../ai/webEngine';

const STOP = new Set(
  'the,a,an,and,or,of,to,in,on,for,with,by,from,as,at,republic,liberia,liberian,act,law,general,national,amended,revised'.split(','),
);

function sigTokens(title: string): string[] {
  return normalize(title)
    .split(' ')
    .filter((t) => t.length > 4 && !STOP.has(t));
}

export interface CitingRef {
  doc: LegalDocument & { jurisdiction?: string };
  matched: string;
}

/** All instruments whose citations[] reference `target`. Capped, self excluded. */
export function getCitedBy(
  target: LegalDocument & { jurisdiction?: string },
  allDocs: (LegalDocument & { jurisdiction?: string })[],
  cap = 12,
): CitingRef[] {
  const sig = sigTokens(target.title);
  if (sig.length === 0) return [];
  const need = sig.length <= 2 ? 1 : 2;
  const out: CitingRef[] = [];

  for (const d of allDocs) {
    if (d.id === target.id) continue;
    const hit = (d.citations ?? []).find((c) => {
      const cn = normalize(c);
      if (target.id && cn.includes(target.id)) return true;
      let n = 0;
      for (const t of sig) if (cn.includes(t)) n++;
      return n >= need;
    });
    if (hit) {
      out.push({ doc: d, matched: hit });
      if (out.length >= cap) break;
    }
  }
  return out;
}
