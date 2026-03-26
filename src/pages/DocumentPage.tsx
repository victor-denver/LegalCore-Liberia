import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Building2, Tag, FileText, Gavel, ScrollText, BookOpen, Copy, Check, ExternalLink, Download, Printer, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
import { documents } from '../data/legalData';
import './DocumentPage.css';

const typeConfig = {
  statute: { icon: ScrollText, label: 'Statute', color: 'statute' },
  case: { icon: Gavel, label: 'Case Law', color: 'case' },
  opinion: { icon: FileText, label: 'Legal Opinion', color: 'opinion' },
  constitution: { icon: BookOpen, label: 'Constitution', color: 'constitution' },
};

export default function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const doc = documents.find((d) => d.id === id);
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState(15);

  if (!doc) {
    return (
      <div className="doc-page">
        <div className="doc-page__inner">
          <div className="doc-page__not-found">
            <h2>Document not found</h2>
            <p>The document you're looking for doesn't exist.</p>
            <Link to="/search" className="doc-page__back-link"><ArrowLeft size={16} /> Back to search</Link>
          </div>
        </div>
      </div>
    );
  }

  const config = typeConfig[doc.type];
  const Icon = config.icon;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(doc.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => window.print();

  const relatedDocs = documents.filter((d) => d.id !== doc.id && d.category === doc.category).slice(0, 3);

  return (
    <div className="doc-page">
      <div className="doc-page__inner">
        <div className="doc-page__nav animate-in">
          <Link to="/search" className="doc-page__back-link"><ArrowLeft size={16} /> Back to results</Link>
        </div>

        <article className="doc-page__article animate-in-up">
          <header className="doc-page__header">
            <div className="doc-page__meta">
              <span className={`doc-page__type doc-page__type--${config.color}`}>
                <Icon size={14} /> {config.label}
              </span>
              <span className="doc-page__date"><Calendar size={14} /> {doc.date}</span>
              {doc.court && <span className="doc-page__court"><Building2 size={14} /> {doc.court}</span>}
            </div>
            <h1 className="doc-page__title">{doc.title}</h1>
            <p className="doc-page__summary">{doc.summary}</p>
            <div className="doc-page__tags">
              <Tag size={14} className="doc-page__tags-icon" />
              {doc.tags.map((tag) => (
                <Link key={tag} to={`/search?q=${encodeURIComponent(tag)}`} className="doc-page__tag">{tag}</Link>
              ))}
            </div>
          </header>

          {/* PDF-like toolbar */}
          <div className="doc-page__toolbar">
            <div className="doc-page__toolbar-left">
              <button className="doc-page__tool-btn" onClick={handleCopy}>
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button className="doc-page__tool-btn" onClick={handlePrint}>
                <Printer size={15} /> Print
              </button>
              <button className="doc-page__tool-btn">
                <Download size={15} /> Export
              </button>
            </div>
            <div className="doc-page__toolbar-right">
              <button className="doc-page__zoom-btn" onClick={() => setFontSize((s) => Math.max(12, s - 1))} aria-label="Zoom out">
                <ZoomOut size={15} />
              </button>
              <span className="doc-page__zoom-level">{fontSize}px</span>
              <button className="doc-page__zoom-btn" onClick={() => setFontSize((s) => Math.min(22, s + 1))} aria-label="Zoom in">
                <ZoomIn size={15} />
              </button>
            </div>
          </div>

          {/* PDF-style body */}
          <div className="doc-page__pdf-viewer">
            <div className="doc-page__pdf-page" style={{ fontSize: `${fontSize}px` }}>
              <div className="doc-page__pdf-header">
                <div className="doc-page__pdf-flag">
                  <span className="pdf-flag--red" />
                  <span className="pdf-flag--white" />
                  <span className="pdf-flag--blue" />
                </div>
                <span className="doc-page__pdf-label">REPUBLIC OF LIBERIA</span>
              </div>
              <div className="doc-page__body">
                {doc.body.split('\n').map((line, i) => {
                  if (!line.trim()) return <br key={i} />;
                  const isHeading = line === line.toUpperCase() && line.length > 3 && !line.startsWith('(');
                  if (isHeading) return <h3 key={i} className="doc-page__section-heading">{line}</h3>;
                  return <p key={i}>{line}</p>;
                })}
              </div>
            </div>
          </div>

          {doc.citations.length > 0 && (
            <div className="doc-page__citations">
              <h3 className="doc-page__citations-title">Citations</h3>
              <ul className="doc-page__citations-list">
                {doc.citations.map((cite, i) => (
                  <li key={i}><ExternalLink size={13} /> {cite}</li>
                ))}
              </ul>
            </div>
          )}
        </article>

        {relatedDocs.length > 0 && (
          <section className="doc-page__related animate-in-up">
            <h3 className="doc-page__related-title">Related Documents</h3>
            <div className="doc-page__related-grid">
              {relatedDocs.map((rd) => {
                const rdConfig = typeConfig[rd.type];
                const RdIcon = rdConfig.icon;
                return (
                  <Link key={rd.id} to={`/document/${rd.id}`} className="related-card">
                    <span className={`related-card__type related-card__type--${rdConfig.color}`}>
                      <RdIcon size={12} /> {rdConfig.label}
                    </span>
                    <h4 className="related-card__title">{rd.title}</h4>
                    <p className="related-card__summary">{rd.summary}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
