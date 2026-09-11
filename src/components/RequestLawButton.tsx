import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { FilePlus2, X, Loader2, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { track } from '../lib/analytics';
import { JURISDICTIONS } from '../data/jurisdictions';
import './FeedbackWidget.css';

/**
 * Shown on zero-result searches. Every request is a data point for which laws to
 * digitise next, per country — the content roadmap writes itself.
 */
export default function RequestLawButton({ query, country }: { query: string; country: string }) {
  const { enabled, status, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(query);
  const [c, setC] = useState(country);
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!enabled) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || !user) return;
    setBusy(true); setErr(null);
    const { error } = await supabase.from('document_requests').insert({ user_id: user.id, country: c, title: title.trim(), details: details.trim() || null, query });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    track('law_requested', { country: c, title: title.trim(), q: query });
    setDone(true);
  };

  return (
    <>
      <button className="btn btn--dark" onClick={() => setOpen(true)}><FilePlus2 size={14} /> Request this law</button>
      {open && (
        <div className="fb-overlay" onClick={() => setOpen(false)}>
          <div className="fb-sheet animate-in" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <header>
              <h2>Request a law</h2>
              <button className="fb-close" onClick={() => setOpen(false)} aria-label="Close"><X size={16} /></button>
            </header>
            {done ? (
              <div className="fb-done">
                <span className="fb-done__ico"><Check size={20} /></span>
                <h3>Logged.</h3>
                <p>We'll source it. You'll see it in your library the day it's published.</p>
                <button className="fb-primary" onClick={() => setOpen(false)}>Done</button>
              </div>
            ) : status !== 'signed-in' ? (
              <div className="fb-done">
                <p>Sign in so we can notify you when it's added.</p>
                <Link className="fb-primary" to={`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`}>Sign in — it's free</Link>
              </div>
            ) : (
              <form onSubmit={submit} className="fb-form">
                <label className="fb-label">Country
                  <select value={c} onChange={(e) => setC(e.target.value)} className="fb-select">
                    {JURISDICTIONS.map((j) => <option key={j.code} value={j.code}>{j.name}</option>)}
                  </select>
                </label>
                <label className="fb-label">Law, case or instrument
                  <input required minLength={2} maxLength={300} value={title} onChange={(e) => setTitle(e.target.value)} className="fb-input" placeholder="e.g. Decent Work Act 2015" />
                </label>
                <label className="fb-label">Anything that helps us find it (optional)
                  <textarea rows={3} maxLength={2000} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Year, gazette number, court, where you saw it cited…" />
                </label>
                {err && <div className="fb-err">{err}</div>}
                <button type="submit" className="fb-primary" disabled={busy}>{busy ? <Loader2 size={15} className="spin" /> : null} Send request</button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
