import { Link } from 'react-router-dom';
import { FileText, Gavel, ScrollText, BookOpen, Calendar, ArrowRight } from 'lucide-react';
import type { LegalDocument } from '../data/legalData';
import { ProvenanceBadge } from './Provenance';
import './DocumentCard.css';

const cfg = {
  statute: { icon: ScrollText, label: 'Statute', cls: 'statute' },
  case: { icon: Gavel, label: 'Case', cls: 'case' },
  opinion: { icon: FileText, label: 'Opinion', cls: 'opinion' },
  constitution: { icon: BookOpen, label: 'Constitution', cls: 'constitution' },
};

export default function DocumentCard({ doc }: { doc: LegalDocument }) {
  const c = cfg[doc.type];
  const Icon = c.icon;
  return (
    <Link to={`/document/${doc.id}`} className={`doc-card doc-card--${c.cls}`}>
      <div className="doc-card__header">
        <span className={`doc-tag doc-tag--${c.cls}`}><Icon size={12}/>{c.label}</span>
        <span style={{display:'inline-flex', gap:6, alignItems:'center'}}><ProvenanceBadge doc={doc} /><span className="doc-card__year">{doc.year}</span></span>
      </div>
      <h3 className="doc-card__title">{doc.title}</h3>
      <p className="doc-card__summary">{doc.summary}</p>
      <div className="doc-card__footer">
        <span className="doc-card__date"><Calendar size={12}/>{doc.date}</span>
        <span className="doc-card__cta">Open <ArrowRight size={12}/></span>
      </div>
    </Link>
  );
}
