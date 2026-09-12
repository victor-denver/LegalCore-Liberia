import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Briefcase, Trash2, ArrowUp, ArrowDown, Printer, FileText, Plus } from 'lucide-react';
import { documents } from '../data/legalData';
import { ecowasCommunityDocs } from '../data/ecowasCommunity';
import { getProvenance, VERIFIED_ON } from '../data/provenance';
import { useStore } from '../hooks/useStore';
import { useAuth } from '../hooks/useAuth';
import './SavedPage.css';

const allDocs = [...documents, ...ecowasCommunityDocs];
const byId = new Map(allDocs.map((d) => [d.id, d]));

export default function SavedPage() {
  const { savedIds, toggleSaved, brief, addToBrief, removeFromBrief, updateBriefNote, moveBrief, clearBrief, syncing } = useStore();
  const { enabled: authEnabled, status: authStatus } = useAuth();
  const [tab, setTab] = useState<'saved' | 'brief'>('saved');
  const [title, setTitle] = useState('Legal Memorandum');
  const [matter, setMatter] = useState('');

  const savedDocs = savedIds.map((id) => byId.get(id)).filter(Boolean);

  return (
    <div className="saved">
      <div className="saved__inner">
        <header className="saved-head no-print">
          <div>
            <h1>My Library</h1>
            <p>
              {authStatus === 'signed-in'
                ? (syncing ? 'Syncing your library…' : 'Synced to your account — available on every device. Free, no limits.')
                : <>Saved on this device — free, no login required, no limits.{authEnabled && <> <Link to="/login?next=/saved">Sign in</Link> to sync across devices.</>}</>}
            </p>
          </div>
          <div className="saved-tabs">
            <button className={tab === 'saved' ? 'on' : ''} onClick={() => setTab('saved')}><Bookmark size={13} /> Saved ({savedIds.length})</button>
            <button className={tab === 'brief' ? 'on' : ''} onClick={() => setTab('brief')}><Briefcase size={13} /> Brief ({brief.length})</button>
          </div>
        </header>

        {tab === 'saved' ? (
          <div className="saved-list">
            {savedDocs.length === 0 ? (
              <div className="saved-empty no-print">
                <Bookmark size={22} />
                <h3>Nothing saved yet</h3>
                <p>Tap the bookmark on any law to keep it here for filings and study.</p>
                <Link to="/search" className="btn-gold">Find a law →</Link>
              </div>
            ) : savedDocs.map((d) => d && (
              <div key={d.id} className="saved-item">
                <Link to={`/document/${d.id}`} className="saved-item__main">
                  <FileText size={15} />
                  <span><strong>{d.title}</strong><small>{d.date} • {getProvenance(d).tierLabel}</small></span>
                </Link>
                <button
                  className="icon-btn"
                  title="Add to brief"
                  onClick={() => {
                    if (addToBrief(d.id) === 'added') setTab('brief');
                  }}
                ><Plus size={15} /></button>
                <button className="icon-btn" title="Remove" onClick={() => toggleSaved(d.id)}><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="brief-tools no-print">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Memorandum title" aria-label="Brief title" />
              <input value={matter} onChange={(e) => setMatter(e.target.value)} placeholder="Matter / client (optional)" aria-label="Matter" />
              <div className="brief-tools__btns">
                {brief.length > 0 && <button className="btn-ghost" onClick={clearBrief}><Trash2 size={13} /> Clear</button>}
                <button className="btn-gold" onClick={() => window.print()} disabled={brief.length === 0}><Printer size={13} /> Export / Print</button>
              </div>
            </div>

            {brief.length === 0 ? (
              <div className="saved-empty no-print">
                <Briefcase size={22} />
                <h3>No authorities in this brief</h3>
                <p>Add laws from any document page, search card, or AI answer — then export a clean memo.</p>
                <Link to="/search" className="btn-gold">Find authorities →</Link>
              </div>
            ) : (
              <div className="brief-edit no-print">
                {brief.map((b, i) => {
                  const d = byId.get(b.docId);
                  if (!d) return null;
                  return (
                    <div key={b.key} className="brief-edit__item">
                      <span className="brief-num">{i + 1}</span>
                      <div className="brief-edit__body">
                        <strong>{d.title}</strong>
                        <small>{d.date} • {getProvenance(d).tierLabel} • {getProvenance(d).binding}</small>
                        <textarea
                          value={b.note}
                          onChange={(e) => updateBriefNote(b.key, e.target.value)}
                          placeholder="Your note — why this authority matters for the matter…"
                          rows={2}
                        />
                      </div>
                      <div className="brief-edit__ops">
                        <button className="icon-btn" onClick={() => moveBrief(b.key, -1)} aria-label="Move up"><ArrowUp size={14} /></button>
                        <button className="icon-btn" onClick={() => moveBrief(b.key, 1)} aria-label="Move down"><ArrowDown size={14} /></button>
                        <button className="icon-btn" onClick={() => removeFromBrief(b.key)} aria-label="Remove"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Printable memo sheet ── */}
            {brief.length > 0 && (
              <article className="brief-sheet">
                <header>
                  <span className="brief-sheet__brand">LegalCore • AmaraTech</span>
                  <h2>{title || 'Legal Memorandum'}</h2>
                  {matter && <p className="brief-sheet__matter">Matter: {matter}</p>}
                  <p className="brief-sheet__meta">
                    Prepared {new Date().toLocaleDateString()} • {brief.length} authorities • Citations from LegalCore — confirm against the gazette before filing
                  </p>
                </header>
                <ol>
                  {brief.map((b) => {
                    const d = byId.get(b.docId);
                    if (!d) return null;
                    const p = getProvenance(d);
                    return (
                      <li key={b.key}>
                        <strong>{d.title}</strong> <em>({d.date}; {d.type}; {p.tierLabel})</em>
                        <p>{d.summary}</p>
                        {b.note && <p className="brief-sheet__note">Counsel&apos;s note: {b.note}</p>}
                        <p className="brief-sheet__cite">Cite as: {d.title} ({d.date}) — LegalCore {d.id.toUpperCase()} [{p.binding}]</p>
                      </li>
                    );
                  })}
                </ol>
                <footer>
                  <p>Sources verified {VERIFIED_ON} • This memo is research assistance, not legal advice. Confirm section wording against the official gazette before filing.</p>
                </footer>
              </article>
            )}
          </>
        )}
      </div>
    </div>
  );
}
