import { useState } from 'react';
import { ShieldCheck, Flag, Send, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { documents } from '../data/legalData';
import { ecowasCommunityDocs } from '../data/ecowasCommunity';
import { tierCounts, VERIFIED_ON } from '../data/provenance';
import { useStore } from '../hooks/useStore';
import './MethodologyPage.css';

const tiers = tierCounts([...documents, ...ecowasCommunityDocs]);

const PROMISES = [
  { title: 'Every law shows its badge', text: 'Certified, Verified or Reference — visible before you read a word, with a certificate naming the source and why it binds.' },
  { title: 'Every answer is cited', text: 'The AI links each claim to the full text. Low-confidence matches are labelled as such — never presented as certain.' },
  { title: 'Every error is correctable', text: 'Spot a wrong date or citation? Report it below. Reports are logged publicly and reviewed within 48 hours.' },
];

const SOURCES: { name: string; detail: string }[] = [
  { name: 'Constitution of Liberia (1986)', detail: 'Referendum text — supreme law' },
  { name: 'Liberian Code of Laws Revised', detail: 'Titles 7, 9, 12, 18, 26, 33…' },
  { name: 'National Legislature gazettes', detail: 'Enrolled Acts & resolutions' },
  { name: 'Supreme Court of Liberia', detail: 'Opinions, Temple of Justice' },
  { name: 'Ministry of Justice', detail: 'Advisory opinions (persuasive)' },
  { name: 'LRA • LiMA • EPA • NEC', detail: 'Revenue, maritime, environment, elections' },
  { name: 'TRC archives (1979–2003)', detail: 'Peace & transitional justice' },
  { name: 'ECOWAS depository, Abuja', detail: 'Treaty, protocols, Court jurisprudence' },
  { name: 'OHADA Secretariat + CCJA', detail: 'Uniform Acts, Abidjan case law' },
];

export default function MethodologyPage() {
  const { corrections, addCorrection } = useStore();
  const [docId, setDocId] = useState('');
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <div className="method">
      <div className="method__inner">
        <header className="method-head">
          <span className="method-eyebrow"><ShieldCheck size={12} /> Trust & sources • Why you can rely on it</span>
          <h1>Trust is the product.</h1>
          <p>One verified statute beats a hundred scraped PDFs. Here is exactly where our {documents.length + ecowasCommunityDocs.length} instruments come from — and how to correct us.</p>
          <div className="method-tiers">
            <span><strong>{tiers.certified}</strong> certified</span>
            <span><strong>{tiers.verified}</strong> verified</span>
            <span><strong>{tiers.reference}</strong> reference</span>
          </div>
        </header>

        <section className="method-steps">
          {PROMISES.map((s, i) => (
            <div key={s.title} className="method-step">
              <span className="method-step__num">{i + 1}</span>
              <span className="method-step__icon"><ShieldCheck size={16} /></span>
              <div><strong>{s.title}</strong><p>{s.text}</p></div>
            </div>
          ))}
        </section>

        <section className="method-sources">
          <h2>Source registry</h2>
          <div className="method-source-grid">
            {SOURCES.map((s) => (
              <div key={s.name} className="method-source"><strong>{s.name}</strong><span>{s.detail}</span></div>
            ))}
          </div>
        </section>

        <section className="method-cite">
          <h2>Cite us like this</h2>
          <code>Land Rights Act of 2018 (Sept 19, 2018) — LegalCore STAT-2018-LAND-RIGHTS [Certified, verified {VERIFIED_ON}]</code>
          <p>For counsel: always confirm section wording against the official gazette before filing. Build a printable memo with citations in <Link to="/saved">Saved &amp; briefs</Link>.</p>
        </section>

        <section className="method-correct">
          <h2><Flag size={15} /> Report an error — corrected within 48 hours</h2>
          <p>Found a wrong date, a bad citation, a moved court? Tell us. Reports are logged publicly below.</p>
          {sent ? (
            <p className="method-sent"><Check size={14} /> Logged. Our editors review within 48 hours. Thank you for keeping the law honest.</p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!msg.trim()) return;
                addCorrection(docId.trim() || 'general', msg);
                setDocId('');
                setMsg('');
                setSent(true);
                setTimeout(() => setSent(false), 4000);
              }}
            >
              <input value={docId} onChange={(e) => setDocId(e.target.value)} placeholder="Record ID (optional) — e.g. stat-2018-land-rights" />
              <textarea value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="What is wrong, and what should it say?" rows={3} />
              <button type="submit"><Send size={13} /> Submit correction</button>
            </form>
          )}
          {corrections.length > 0 && (
            <ul className="method-log">
              {corrections.slice(-5).reverse().map((c, i) => (
                <li key={i}><strong>{c.docId}</strong> — {c.message} <em>({new Date(c.date).toLocaleDateString()})</em></li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
