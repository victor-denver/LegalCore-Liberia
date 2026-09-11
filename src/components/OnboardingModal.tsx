import { useEffect, useRef, useState } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useJurisdiction } from '../hooks/useJurisdiction';
import { JURISDICTIONS } from '../data/jurisdictions';
import { track } from '../lib/analytics';
import type { Profession } from '../lib/supabase';
import './OnboardingModal.css';

const PROFESSIONS: { v: Profession; label: string; hint: string }[] = [
  { v: 'lawyer', label: 'Lawyer', hint: 'Practising counsel, in-house, paralegal' },
  { v: 'judge', label: 'Judiciary', hint: 'Judge, magistrate, clerk' },
  { v: 'student', label: 'Student', hint: 'Law school, bar prep' },
  { v: 'business', label: 'Business', hint: 'Founder, compliance, HR' },
  { v: 'government', label: 'Government', hint: 'Ministry, agency, legislature' },
  { v: 'ngo', label: 'NGO / Civil society', hint: 'Advocacy, legal aid, research' },
  { v: 'citizen', label: 'Citizen', hint: 'Knowing my rights' },
  { v: 'other', label: 'Other', hint: '' },
];

/**
 * Two questions, once, right after first sign-in:
 *  1. Which country's law do you work with most?  → default jurisdiction everywhere
 *  2. Who are you?                                  → tailor Plans, AI voice, future features
 * Also: on every sign-in, if the profile has a country and this device doesn't, adopt it.
 */
export default function OnboardingModal() {
  const { status, profile, updateProfile } = useAuth();
  const { code, setCode } = useJurisdiction();
  const [country, setCountry] = useState(code);
  const [prof, setProf] = useState<Profession | null>(null);
  const [org, setOrg] = useState('');
  const [busy, setBusy] = useState(false);

  // Admins skip onboarding entirely — this is a public-user experience.
  const settled = !!profile && (profile.onboarding_done || profile.role === 'admin');

  // Adopt the account's saved country the first time we see this profile in this session.
  const adopted = useRef<string | null>(null);
  useEffect(() => {
    if (!profile || adopted.current === profile.id) return;
    adopted.current = profile.id;
    if (settled && profile.country_code && profile.country_code !== code) setCode(profile.country_code);
  }, [profile, settled, code, setCode]);

  // Persist header flag changes to the account so the next device opens on the same country.
  useEffect(() => {
    if (!profile || !settled || adopted.current !== profile.id || code === profile.country_code) return;
    const t = setTimeout(() => { void updateProfile({ country_code: code }); track('country_changed', { to: code, via: 'header' }); }, 600);
    return () => clearTimeout(t);
  }, [code, profile, settled, updateProfile]);

  const show = status === 'signed-in' && !!profile && !settled;
  if (!show) return null;

  const finish = async (skip = false) => {
    setBusy(true);
    const patch = skip
      ? { onboarding_done: true }
      : { country_code: country, profession: prof, organization: org.trim() || null, onboarding_done: true };
    const r = await updateProfile(patch);
    setBusy(false);
    if (!r.error) {
      if (!skip) { setCode(country); track('country_changed', { to: country, via: 'onboarding' }); }
    }
  };

  return (
    <div className="ob-overlay">
      <div className="ob-card animate-in" role="dialog" aria-modal="true" aria-labelledby="ob-title">
        <span className="ob-kicker">WELCOME</span>
        <h2 id="ob-title">Two quick questions so LegalCore fits you</h2>
        <p className="ob-lead">We'll default every search, the AI and the map to your country. You can change it any time from the flag in the header.</p>

        <div className="ob-section">
          <h3>Which country's law do you work with most?</h3>
          <div className="ob-countries">
            {JURISDICTIONS.filter((j) => j.code !== 'ECOWAS').map((j) => (
              <button key={j.code} className={country === j.code ? 'on' : ''} onClick={() => setCountry(j.code)}>
                <img src={`https://flagcdn.com/w40/${j.flag}.png`} alt="" />
                <span>{j.name}</span>
                {j.status !== 'active' && <small>{j.phase}</small>}
              </button>
            ))}
          </div>
        </div>

        <div className="ob-section">
          <h3>Who are you?</h3>
          <div className="ob-profs">
            {PROFESSIONS.map((p) => (
              <button key={p.v} className={prof === p.v ? 'on' : ''} onClick={() => setProf(p.v)}>
                <strong>{p.label}</strong>{p.hint && <small>{p.hint}</small>}
              </button>
            ))}
          </div>
          {(prof === 'lawyer' || prof === 'business' || prof === 'government' || prof === 'ngo') && (
            <input className="ob-org" placeholder="Organisation (optional)" value={org} onChange={(e) => setOrg(e.target.value)} maxLength={120} />
          )}
        </div>

        <div className="ob-actions">
          <button className="ob-skip" onClick={() => void finish(true)} disabled={busy}>Skip</button>
          <button className="ob-go" onClick={() => void finish(false)} disabled={busy || !prof}>
            {busy ? <Loader2 size={15} className="spin" /> : <ArrowRight size={15} />} Continue
          </button>
        </div>
      </div>
    </div>
  );
}
