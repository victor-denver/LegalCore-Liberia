import { useState, type FormEvent } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { supabase, type AppConfig } from '../../lib/supabase';
import { useAppConfig, invalidateAppConfig } from '../../hooks/useAppConfig';

/** Remote switches. Saved rows take effect on the next page load for every visitor. */
export default function ConfigTab() {
  const cfg = useAppConfig();
  const [paywall, setPaywall] = useState(cfg.paywall_enabled);
  const [google, setGoogle] = useState(cfg.google_login_enabled);
  const [nudge, setNudge] = useState(cfg.nudge_after_views);
  const [annText, setAnnText] = useState(cfg.announcement?.text ?? '');
  const [annHref, setAnnHref] = useState(cfg.announcement?.href ?? '');
  const [annTone, setAnnTone] = useState<'gold' | 'info' | 'red'>(cfg.announcement?.tone ?? 'gold');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true); setMsg(null);
    const announcement: AppConfig['announcement'] = annText.trim() ? { text: annText.trim(), href: annHref.trim() || undefined, tone: annTone } : null;
    const rows = [
      { key: 'paywall_enabled', value: paywall, updated_at: new Date().toISOString() },
      { key: 'nudge_after_views', value: Math.max(0, Math.floor(nudge)), updated_at: new Date().toISOString() },
      { key: 'google_login_enabled', value: google, updated_at: new Date().toISOString() },
      { key: 'announcement', value: announcement, updated_at: new Date().toISOString() },
    ];
    const { error } = await supabase.from('app_config').upsert(rows, { onConflict: 'key' });
    setBusy(false);
    invalidateAppConfig();
    setMsg(error ? error.message : 'Saved. Visitors see it on their next page load.');
  };

  return (
    <form className="cfg" onSubmit={save}>
      <section className="ins-card">
        <h3>Announcement bar</h3>
        <p className="cfg-help">Shown at the very top of every page. Leave text empty to hide.</p>
        <label className="cfg-field">Text<input value={annText} onChange={(e) => setAnnText(e.target.value)} maxLength={160} placeholder="e.g. Sierra Leone statutes now live — 412 instruments" /></label>
        <div className="cfg-row">
          <label className="cfg-field">Link (optional)<input value={annHref} onChange={(e) => setAnnHref(e.target.value)} placeholder="/west-africa" /></label>
          <label className="cfg-field">Tone
            <select value={annTone} onChange={(e) => setAnnTone(e.target.value as typeof annTone)}>
              <option value="gold">Gold</option><option value="info">Info</option><option value="red">Urgent</option>
            </select>
          </label>
        </div>
      </section>

      <section className="ins-card">
        <h3>Sign-in</h3>
        <label className="cfg-toggle">
          <input type="checkbox" checked={google} onChange={(e) => setGoogle(e.target.checked)} />
          <span><strong>Show "Continue with Google"</strong><small>Only turn on after the Google OAuth client is configured in Supabase → Authentication → Providers. Email + password always works.</small></span>
        </label>
      </section>

      <section className="ins-card">
        <h3>Growth</h3>
        <label className="cfg-field">Show sign-in nudge after N document reads (0 = immediately, 999 = never)
          <input type="number" min={0} max={999} value={nudge} onChange={(e) => setNudge(Number(e.target.value))} />
        </label>
      </section>

      <section className="ins-card">
        <h3>Monetisation</h3>
        <label className="cfg-toggle">
          <input type="checkbox" checked={paywall} onChange={(e) => setPaywall(e.target.checked)} />
          <span><strong>Pro gating enabled</strong><small>Off = everything free (today). On = Pro features check <code>profiles.plan</code>. Nothing is gated until you ship a Pro feature, so this is safe to leave off.</small></span>
        </label>
      </section>

      {msg && <div className={msg.startsWith('Saved') ? 'admin-ok' : 'admin-error'}>{msg}</div>}
      <button type="submit" className="admin-primary" disabled={busy}>{busy ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Save config</button>
    </form>
  );
}
