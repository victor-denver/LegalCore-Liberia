import { useEffect, useRef, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Loader2, Search, Sparkles, BookOpen, Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useAppConfigState } from '../hooks/useAppConfig';
import { track } from '../lib/analytics';
import './AuthGate.css';

export type GatedFeature = 'search' | 'ai';

const COPY: Record<GatedFeature, { icon: ReactNode; title: string; lead: string; perks: string[] }> = {
  search: {
    icon: <Search size={22} />,
    title: 'Create a free account to search',
    lead: 'Search runs across every statute, act and regulation in the library — with typo tolerance and the exact section cited.',
    perks: [
      'Full-text search across all 12 ECOWAS jurisdictions',
      'Save laws and briefs, synced to every device',
      'Ask the AI in plain English and get cited answers',
    ],
  },
  ai: {
    icon: <Sparkles size={22} />,
    title: 'Create a free account to ask the AI',
    lead: 'Ask a legal question in plain English. Every answer quotes the instrument it came from and links to the full text.',
    perks: [
      'Cited answers drawn from the live corpus — no invented law',
      'Full-text search with typo tolerance',
      'Save laws and briefs, synced to every device',
    ],
  },
};

/**
 * Sign-up wall for search and the AI, controlled by app_config.auth_required.
 *
 * Deliberately renders in place rather than redirecting, so the URL — including
 * ?q=whatever-they-typed — survives. The login link carries it as ?next=, which
 * means a visitor who signs up lands back on the search they came for instead of
 * on the home page having forgotten what they wanted.
 *
 * This is UX, not security. Everything it protects is client-side data, and the
 * real boundary is Row Level Security in Postgres.
 */
export default function AuthGate({ feature, children }: { feature: GatedFeature; children: ReactNode }) {
  const { status, enabled } = useAuth();
  const { cfg, ready } = useAppConfigState();
  const location = useLocation();
  const tracked = useRef(false);

  // Never lock people out of a build with no backend — there would be no way in.
  const gated = enabled && ready && cfg.auth_required && status === 'signed-out';

  useEffect(() => {
    if (gated && !tracked.current) { tracked.current = true; track('auth_gate_shown', { feature }); }
  }, [gated, feature]);

  // Hold the page until both the session and the flag have resolved, otherwise a
  // signed-in visitor sees the wall flash before their content appears.
  if (enabled && (status === 'loading' || !ready)) {
    return (
      <div className="gate gate--waiting">
        <Loader2 size={24} className="spin" />
      </div>
    );
  }

  if (!gated) return <>{children}</>;

  const next = encodeURIComponent(location.pathname + location.search);
  const { icon, title, lead, perks } = COPY[feature];

  return (
    <div className="gate">
      <div className="gate__card animate-in">
        <span className="gate__icon">{icon}</span>
        <h1>{title}</h1>
        <p className="gate__lead">{lead}</p>

        <ul className="gate__perks">
          {perks.map((p) => (
            <li key={p}><Check size={14} /> {p}</li>
          ))}
        </ul>

        <div className="gate__actions">
          <Link to={`/login?next=${next}&mode=signup`} className="gate__primary">Create a free account</Link>
          <Link to={`/login?next=${next}`} className="gate__ghost">I already have one</Link>
        </div>

        <p className="gate__foot">
          Free, no card. Reading the law never needs an account —{' '}
          <Link to="/browse"><BookOpen size={12} /> browse the library</Link> any time.
        </p>
      </div>
    </div>
  );
}
