import { Link } from 'react-router-dom';
import { FileText, Gavel, ScrollText, BookOpen, Calendar, Building2 } from 'lucide-react';
import type { LegalDocument } from '../data/legalData';
import './DocumentCard.css';

const typeConfig = {
  statute: { icon: ScrollText, label: 'Statute' },
  case: { icon: Gavel, label: 'Case Law' },
  opinion: { icon: FileText, label: 'Legal Opinion' },
  constitution: { icon: BookOpen, label: 'Constitution' },
};

export default function DocumentCard({ doc }: { doc: LegalDocument }) {
  const config = typeConfig[doc.type];
  const Icon = config.icon;

  return (
    <Link to={`/document/${doc.id}`} className="doc-card">
      <div className="doc-card__header">
        <span className={`doc-card__type doc-card__type--${doc.type}`}>
          <Icon size={13} />
          {config.label}
        </span>
        <span className="doc-card__date">
          <Calendar size={12} />
          {doc.date}
        </span>
      </div>

      <h3 className="doc-card__title">{doc.title}</h3>
      <p className="doc-card__summary">{doc.summary}</p>

      {doc.court && (
        <div className="doc-card__court">
          <Building2 size={13} />
          {doc.court}
        </div>
      )}

      <div className="doc-card__tags">
        {doc.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="doc-card__tag">
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
