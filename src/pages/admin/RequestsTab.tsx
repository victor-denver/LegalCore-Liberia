import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { countryName, fmtDateTime, whoLabel, type Who } from './shared';

interface Row {
  id: number; country: string; title: string; details: string | null; query: string | null;
  status: 'open' | 'sourcing' | 'added' | 'declined'; created_at: string; profiles?: Who | null;
}
const STATUSES: Row['status'][] = ['open', 'sourcing', 'added', 'declined'];

/** Laws users asked for that we don't have — grouped by country = your content roadmap. */
export default function RequestsTab() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | Row['status']>('open');

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.from('document_requests').select('*, profiles(email, full_name)').order('created_at', { ascending: false }).limit(500)
      .then(({ data, error }) => { if (!alive) return; if (error) setErr(error.message); setRows((data as Row[]) ?? []); });
    return () => { alive = false; };
  }, []);

  const setStatus = async (id: number, status: Row['status']) => {
    if (!supabase) return;
    const { error } = await supabase.from('document_requests').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { setErr(error.message); return; }
    setRows((p) => p?.map((r) => (r.id === id ? { ...r, status } : r)) ?? null);
  };

  const visible = useMemo(() => (rows ?? []).filter((r) => filter === 'all' || r.status === filter), [rows, filter]);
  const byCountry = useMemo(() => {
    const m = new Map<string, number>();
    (rows ?? []).filter((r) => r.status === 'open').forEach((r) => m.set(r.country, (m.get(r.country) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  if (!rows) return <div className="admin-empty"><Loader2 size={18} className="spin" /></div>;

  return (
    <section>
      <div className="admin-chips">{byCountry.map(([c, n]) => <span key={c}>{countryName(c)} <strong>{n}</strong></span>)}</div>
      <div className="admin-filter">{(['open', 'sourcing', 'added', 'declined', 'all'] as const).map((f) => <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>{f}</button>)}</div>
      {err && <div className="admin-error">{err}</div>}
      {visible.length === 0 ? <p className="admin-empty">No requests.</p> : (
        <ul className="admin-list">
          {visible.map((r) => (
            <li key={r.id} className="admin-row">
              <div className="admin-row__main">
                <span className="admin-row__doc">{r.title}</span>
                <p>{r.details || <em style={{ color: 'var(--text-faint)' }}>No details</em>}{r.query && <><br /><small>Searched: “{r.query}”</small></>}</p>
                <small>{countryName(r.country)} · {whoLabel(r.profiles)} · {fmtDateTime(r.created_at)}</small>
              </div>
              <div className="admin-row__actions admin-row__actions--col">
                <select value={r.status} onChange={(e) => void setStatus(r.id, e.target.value as Row['status'])}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
