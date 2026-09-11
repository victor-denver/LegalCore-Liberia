import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles, ThumbsUp, Lock, Users } from 'lucide-react';
import { FREE_FEATURES, PRO_FEATURES, AUDIENCE_LABEL, type Audience } from '../data/plans';
import { useAuth } from '../hooks/useAuth';
import { useAppConfig } from '../hooks/useAppConfig';
import { supabase } from '../lib/supabase';
import { track } from '../lib/analytics';
import { openFeedback } from '../lib/feedbackBus';
import './PlansPage.css';

export default function PlansPage() {
  const { enabled, status, user, profile } = useAuth();
  const cfg = useAppConfig();
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [audOverride, setAud] = useState<Audience | 'all' | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // Default the filter to the visitor's profession, if we know it; explicit clicks win.
  const p = profile?.profession;
  const aud: Audience | 'all' = audOverride ?? ((p === 'lawyer' || p === 'student' || p === 'business' || p === 'government') ? p : 'all');

  useEffect(() => {
    if (!supabase || !user) return;
    let alive = true;
    supabase.from('feature_interest').select('feature_key').eq('user_id', user.id).then(({ data }) => {
      if (alive) setMine(new Set((data ?? []).map((r) => r.feature_key as string)));
    });
    return () => { alive = false; };
  }, [user]);

  const vote = async (key: string) => {
    if (!supabase || !user) return;
    setBusyKey(key);
    const has = mine.has(key);
    const next = new Set(mine);
    if (has) { next.delete(key); await supabase.from('feature_interest').delete().match({ user_id: user.id, feature_key: key }); }
    else { next.add(key); await supabase.from('feature_interest').upsert({ user_id: user.id, feature_key: key }); track('feature_interest', { feature: key }); }
    setMine(next);
    setBusyKey(null);
  };

  const list = useMemo(() => (aud === 'all' ? PRO_FEATURES : PRO_FEATURES.filter((f) => f.audience.includes(aud))), [aud]);

  return (
    <div className="plans">
      <div className="plans__inner">
        <header className="plans-head">
          <span className="plans-kicker">PLANS</span>
          <h1>The law is free. Your workflow is what we'll charge for — later.</h1>
          <p>Everything LegalCore does today costs nothing and will stay that way. We're deciding what to build next for professionals, and we'd rather ask than guess: tell us which of these you'd pay for.</p>
        </header>

        <div className="plans-grid">
          <section className="plan plan--free">
            <div className="plan__head">
              <h2>Free</h2>
              <div className="plan__price"><strong>$0</strong><span>forever, for everyone</span></div>
            </div>
            <ul className="plan__list">
              {FREE_FEATURES.map((f) => <li key={f}><Check size={14} /> {f}</li>)}
            </ul>
            {status !== 'signed-in' && enabled && <Link to="/login?next=/plans" className="plan__cta">Create a free account</Link>}
          </section>

          <section className="plan plan--pro">
            <div className="plan__head">
              <h2><Sparkles size={16} /> Pro <em>coming</em></h2>
              <div className="plan__price"><strong>{cfg.paywall_enabled ? 'from $8' : 'TBD'}</strong><span>per month — shaped by your votes</span></div>
            </div>
            <p className="plan__note">Vote for what matters. Early voters get founding-member pricing when Pro launches.</p>
            <div className="plans-filter">
              <button className={aud === 'all' ? 'on' : ''} onClick={() => setAud('all')}>All</button>
              {(Object.keys(AUDIENCE_LABEL) as Audience[]).map((a) => (
                <button key={a} className={aud === a ? 'on' : ''} onClick={() => setAud(a)}>{AUDIENCE_LABEL[a]}</button>
              ))}
            </div>
          </section>
        </div>

        <div className="features">
          {list.map((f) => {
            const on = mine.has(f.key);
            return (
              <article key={f.key} className={`feature ${on ? 'feature--on' : ''}`}>
                <div className="feature__body">
                  <div className="feature__top">
                    <h3>{f.title}</h3>
                    <span className={`feature__status feature__status--${f.status}`}>{f.status}</span>
                  </div>
                  <p>{f.blurb}</p>
                  <blockquote>“{f.problem}”</blockquote>
                  <div className="feature__aud"><Users size={11} /> {f.audience.map((a) => AUDIENCE_LABEL[a]).join(' · ')}</div>
                </div>
                {status === 'signed-in' ? (
                  <button className="feature__vote" disabled={busyKey === f.key} onClick={() => void vote(f.key)} aria-pressed={on}>
                    <ThumbsUp size={14} /> {on ? "You'd pay for this" : "I'd pay for this"}
                  </button>
                ) : (
                  <Link to="/login?next=/plans" className="feature__vote feature__vote--login"><Lock size={13} /> Sign in to vote</Link>
                )}
              </article>
            );
          })}
        </div>

        <footer className="plans-foot">
          <p>Something missing? <button className="linkish" onClick={() => openFeedback('idea')}>Tell us</button> — every idea lands on the founders' desk.</p>
        </footer>
      </div>
    </div>
  );
}
