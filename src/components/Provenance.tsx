import { BadgeCheck, ShieldCheck, FileSearch, Award, Landmark, Scale, Link2, CalendarCheck, Hash } from 'lucide-react';
import type { LegalDocument } from '../data/legalData';
import { getProvenance, type VerificationTier } from '../data/provenance';
import './Provenance.css';

const tierIcon: Record<VerificationTier, typeof BadgeCheck> = {
  certified: BadgeCheck,
  verified: ShieldCheck,
  reference: FileSearch,
};

const tierHint: Record<VerificationTier, string> = {
  certified: 'Certified — hand-checked verbatim text from the official source',
  verified: 'Verified — sourced from the official treaty depository',
  reference: 'Reference — structural placeholder, verbatim replacement in progress',
};

/** Small pill: ✅ Certified / ✓ Verified / • Reference */
export function ProvenanceBadge({ doc }: { doc: LegalDocument }) {
  const p = getProvenance(doc);
  const Icon = tierIcon[p.tier];
  return (
    <span className={`prov-badge prov-badge--${p.tier}`} title={tierHint[p.tier]}>
      <Icon size={11} />
      {p.tierLabel}
    </span>
  );
}

/** Full "Certificate of Authenticity" — where it came from + why it binds. */
export function CertificateCard({ doc }: { doc: LegalDocument }) {
  const p = getProvenance(doc);
  const Icon = tierIcon[p.tier];
  return (
    <div className={`certificate certificate--${p.tier}`}>
      <div className="certificate__head">
        <span className="certificate__seal"><Award size={16} /></span>
        <div>
          <strong>Certificate of Authenticity</strong>
          <span className={`prov-badge prov-badge--${p.tier}`}><Icon size={11} />{p.tierLabel}</span>
        </div>
      </div>

      <div className="certificate__row">
        <span className="certificate__k"><Landmark size={12} /> Came from</span>
        <p><strong>{p.source}</strong><br />{p.sourceDetail}</p>
      </div>

      <div className="certificate__row">
        <span className="certificate__k"><Scale size={12} /> Legitimacy</span>
        <p>{p.legitimacy}</p>
      </div>

      <div className="certificate__kv"><span><Link2 size={12} /> Authority</span><strong>{p.authority}</strong></div>
      <div className="certificate__kv"><span><ShieldCheck size={12} /> Force</span><strong>{p.binding}</strong></div>
      <div className="certificate__kv"><span><CalendarCheck size={12} /> Verified</span><strong>{p.verifiedOn}</strong></div>
      <div className="certificate__kv"><span><Hash size={12} /> Record</span><strong className="certificate__id">{doc.id.toUpperCase()}</strong></div>

      {p.note && <p className="certificate__note">{p.note}</p>}
    </div>
  );
}
