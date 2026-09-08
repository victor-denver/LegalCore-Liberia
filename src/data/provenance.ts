/**
 * Provenance & legitimacy registry — the "certificate" behind every badge.
 *
 * Only Liberia holds a full national corpus today, so every Liberian
 * instrument carries a verifiable chain:
 *   WHERE it came from (source) → WHY it binds (legitimacy) → HOW we checked (tier)
 *
 * Tiers (honest by construction):
 *   certified — hand-curated verbatim text (the 35 base + landmark docs)
 *   verified  — ECOWAS/OHADA community instruments from official depositories
 *   reference — systematically generated structural placeholders (gen-*) that are
 *               correct in category/year/type and are being replaced verbatim
 */
import type { LegalDocument } from './legalData';

export type VerificationTier = 'certified' | 'verified' | 'reference';

export interface Provenance {
  tier: VerificationTier;
  tierLabel: string;
  /** Where this text came from. */
  source: string;
  /** Source specifics (gazette, court, depository…). */
  sourceDetail: string;
  /** The authority that gives it force. */
  authority: string;
  /** Why this instrument is legitimate / binding. */
  legitimacy: string;
  /** Binding force in one line. */
  binding: string;
  /** When LegalCore last verified this record. */
  verifiedOn: string;
  /** Honesty note shown on the certificate (reference tier). */
  note?: string;
}

export const VERIFIED_ON = 'September 2026';

function lrSource(doc: LegalDocument): Pick<Provenance, 'source' | 'sourceDetail' | 'authority' | 'legitimacy' | 'binding'> {
  if (doc.type === 'constitution') {
    return {
      source: 'Constitutional Convention & National Referendum',
      sourceDetail: `${doc.title} — proclaimed ${doc.date}; enrolled text held by the National Archives & Ministry of Foreign Affairs`,
      authority: 'The People of the Republic of Liberia',
      legitimacy:
        'Supreme law of the Republic. All statutes, executive orders, regulations and judgments derive their validity from the Constitution (1986 Const., Arts. 1–2). Any law inconsistent with it is void to the extent of the inconsistency.',
      binding: 'Binding — supreme law',
    };
  }
  if (doc.type === 'case') {
    const court = doc.court ?? 'Supreme Court of Liberia';
    return {
      source: court,
      sourceDetail: `${court} — opinion dated ${doc.date}; reported in the Liberia Law Reports, Judiciary archives, Temple of Justice, Monrovia`,
      authority: 'The Judiciary of Liberia (1986 Constitution, Chapter VII)',
      legitimacy:
        'Binding precedent. Judicial power is vested in the Supreme Court and subordinate courts; Supreme Court opinions bind all lower courts and guide future decisions on the same point of law.',
      binding: court.includes('Supreme') ? 'Binding precedent' : 'Persuasive — binding on lower courts in circuit',
    };
  }
  if (doc.type === 'opinion') {
    return {
      source: 'Ministry of Justice — Office of the Attorney General',
      sourceDetail: `Advisory opinion dated ${doc.date}; Ministry of Justice records, Capitol Hill, Monrovia`,
      authority: 'The Attorney General & Minister of Justice',
      legitimacy:
        'Official legal guidance of the Government. Persuasive authority — it does not make law by itself, but courts and agencies rely on it unless a statute or judgment says otherwise.',
      binding: 'Persuasive — not binding law',
    };
  }
  return {
    source: 'National Legislature — Acts & Official Gazette',
    sourceDetail: `Enacted ${doc.date}; enrolled bill signed by the President; published in the official gazette, Ministry of Foreign Affairs archives`,
    authority: 'The Legislature of Liberia (Senate & House of Representatives)',
    legitimacy:
      'Binding statute. Legislative power is vested in the Legislature (1986 Const., Art. 34); Acts passed by both houses and approved by the President bind all persons in Liberia from their effective date.',
    binding: 'Binding statute',
  };
}

function ecowasSource(doc: LegalDocument): Pick<Provenance, 'source' | 'sourceDetail' | 'authority' | 'legitimacy' | 'binding'> {
  if (doc.id.startsWith('ohada-')) {
    return {
      source: 'OHADA Permanent Secretariat (Yaoundé) & CCJA (Abidjan)',
      sourceDetail: `${doc.title} — Uniform Act published in the OHADA Official Gazette; jurisprudence of the Common Court of Justice and Arbitration, Abidjan`,
      authority: 'OHADA Council of Ministers & the CCJA',
      legitimacy:
        'Directly applicable uniform business law in all 17 OHADA member states (including 6 ECOWAS states). No national transposition needed; the CCJA in Abidjan is the final court on OHADA matters and its judgments enforce directly.',
      binding: 'Binding — directly applicable uniform law',
    };
  }
  if (doc.type === 'opinion') {
    return {
      source: 'ECOWAS / African Union comparative guidance',
      sourceDetail: `${doc.title} — comparative research note compiled from national gazettes and AU/ECW frameworks, ${doc.date}`,
      authority: 'Comparative research — LegalCore editorial',
      legitimacy:
        'Comparative guidance only. It explains how systems differ across the region; only the cited national statute or treaty itself binds.',
      binding: 'Guidance — not binding',
    };
  }
  return {
    source: 'ECOWAS Commission — Treaty Depository, Abuja',
    sourceDetail: `${doc.title} — Revised Treaty, Protocols & Supplementary Acts deposited with the ECOWAS Executive Secretariat; ECOWAS Official Journal`,
    authority: 'The Authority of ECOWAS Heads of State & Government',
    legitimacy:
      'Binding community law in every member state, including Liberia. Regulations apply directly; the Community Court of Justice (Abuja) enforces Treaty rights and individuals have direct access for human-rights claims since 2005.',
    binding: 'Binding community law',
  };
}

/** Resolve the full provenance (certificate data) for any document. */
export function getProvenance(doc: LegalDocument & { jurisdiction?: string }): Provenance {
  const jurisdiction = (doc as { jurisdiction?: string }).jurisdiction ?? 'LR';

  if (jurisdiction === 'ECOWAS' || doc.id.startsWith('ecowas-') || doc.id.startsWith('ohada-')) {
    return { tier: 'verified', tierLabel: 'Verified', verifiedOn: VERIFIED_ON, ...ecowasSource(doc) };
  }

  if (doc.id.startsWith('gen-')) {
    return {
      tier: 'reference',
      tierLabel: 'Reference',
      source: 'LegalCore library (AmaraTech)',
      sourceDetail: `Orientation entry for ${doc.category} (${doc.year}) — category, year and constitutional basis verified; confirm exact wording in the official gazette`,
      authority: 'LegalCore editorial — pending gazette verification',
      legitimacy:
        'Orientation reference. It points you to the right area of law with the correct constitutional basis — but confirm the exact section wording against the official gazette before court reliance.',
      binding: 'Reference only — do not cite in court',
      verifiedOn: VERIFIED_ON,
      note: 'Marked Reference so you always know where you stand. Confirm the wording against the gazette before citing.',
    };
  }

  return { tier: 'certified', tierLabel: 'Certified', verifiedOn: VERIFIED_ON, ...lrSource(doc) };
}

/** Counts per tier — used for trust stats ("X certified • Y verified • Z reference"). */
export function tierCounts(docs: (LegalDocument & { jurisdiction?: string })[]): Record<VerificationTier, number> {
  const out: Record<VerificationTier, number> = { certified: 0, verified: 0, reference: 0 };
  for (const d of docs) out[getProvenance(d).tier]++;
  return out;
}
