import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquarePlus, X, Bug, Lightbulb, Heart, FileWarning, MessageCircle, Star, Loader2, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useJurisdiction } from '../hooks/useJurisdiction';
import { supabase } from '../lib/supabase';
import { track } from '../lib/analytics';
import { onOpenFeedback, type FeedbackKind } from '../lib/feedbackBus';
import './FeedbackWidget.css';

const KINDS: { k: FeedbackKind; label: string; icon: typeof Bug }[] = [
  { k: 'idea', label: 'Idea', icon: Lightbulb },
  { k: 'bug', label: 'Bug', icon: Bug },
  { k: 'content', label: 'Missing / wrong law', icon: FileWarning },
  { k: 'praise', label: 'Praise', icon: Heart },
  { k: 'other', label: 'Other', icon: MessageCircle },
];

/** Global feedback sheet. Floating button bottom-left; also opened via openFeedback(). */
export default function FeedbackWidget() {
  const { enabled, status } = useAuth();
  const { code } = useJurisdiction();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<FeedbackKind>('idea');
  const [rating, setRating] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => onOpenFeedback(({ kind: k, presetMessage }) => {
    if (k) setKind(k);
    if (presetMessage) setMsg(presetMessage);
    setDone(false); setOpen(true);
  }), []);

  if (!enabled) return null;
  // Keep the admin console and auth pages clean.
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/auth') || location.pathname === '/login') return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase || status !== 'signed-in') return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setBusy(true); setErr(null);
    const { error } = await supabase.from('feedback').insert({ user_id: user.id, kind, rating, message: msg.trim(), page: location.pathname, country: code });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    track('feedback_sent', { kind, rating });
    setDone(true); setMsg(''); setRating(null);
  };

  return (
    <>
      <button className="fb-fab" onClick={() => { setDone(false); setOpen(true); }} aria-label="Send feedback" title="Send feedback">
        <MessageSquarePlus size={18} />
      </button>

      {open && (
        <div className="fb-overlay" onClick={() => setOpen(false)}>
          <div className="fb-sheet animate-in" role="dialog" aria-modal="true" aria-labelledby="fb-title" onClick={(e) => e.stopPropagation()}>
            <header>
              <h2 id="fb-title">Help shape LegalCore</h2>
              <button className="fb-close" onClick={() => setOpen(false)} aria-label="Close"><X size={16} /></button>
            </header>

            {done ? (
              <div className="fb-done">
                <span className="fb-done__ico"><Check size={20} /></span>
                <h3>Thank you.</h3>
                <p>Your note goes straight to the team. If it's a bug or a missing law, we usually act within days.</p>
                <button className="fb-primary" onClick={() => setOpen(false)}>Done</button>
              </div>
            ) : status !== 'signed-in' ? (
              <div className="fb-done">
                <p>Sign in so we can follow up with you — and so you can see what we did with your feedback.</p>
                <Link className="fb-primary" to={`/login?next=${encodeURIComponent(location.pathname)}`}>Sign in — it's free</Link>
              </div>
            ) : (
              <form onSubmit={submit} className="fb-form">
                <div className="fb-kinds" role="radiogroup">
                  {KINDS.map(({ k, label, icon: Icon }) => (
                    <button type="button" key={k} role="radio" aria-checked={kind === k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}><Icon size={13} /> {label}</button>
                  ))}
                </div>
                <label className="fb-label">
                  {kind === 'bug' ? 'What happened, and what did you expect?' : kind === 'content' ? 'Which law, and what\'s wrong or missing?' : kind === 'idea' ? 'What would make LegalCore more useful to you?' : 'Your message'}
                  <textarea required minLength={2} maxLength={4000} rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Be as specific as you like — page, country, what you were trying to do." />
                </label>
                <div className="fb-rating">
                  <span>How is LegalCore working for you?</span>
                  <div>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button type="button" key={n} className={rating !== null && n <= rating ? 'on' : ''} onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`}><Star size={16} /></button>
                    ))}
                  </div>
                </div>
                {err && <div className="fb-err">{err}</div>}
                <button type="submit" className="fb-primary" disabled={busy || msg.trim().length < 2}>{busy ? <Loader2 size={15} className="spin" /> : null} Send feedback</button>
                <small>Sent from <code>{location.pathname}</code> · {code}. No screenshots or personal data are collected.</small>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
