import { useEffect, useMemo, useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { countryName, fmtDateTime, whoLabel, type Who } from './shared';

interface Row {
  id: number; kind: string; rating: number | null; message: string; page: string | null; country: string | null;
  status: 'new' | 'seen' | 'planned' | 'done' | 'closed'; admin_note: string | null; created_at: string; profiles?: Who | null;
}
const STATUSES: Row['status'][] = ['new', 'seen', 'planned', 'done', 'closed'];

export default function FeedbackTab() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | Row['status']>('new');
  const [kind, setKind] = useState<'all' | string>('all');

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.from('feedback').select('*, profiles(email, full_name)').order('created_at', { ascending: false }).limit(500)
      .then(({ data, error }) => { if (!alive) return; if (error) setErr(error.message); setRows((data as Row[]) ?? []); });
    return () => { alive = false; };
  }, []);

  const setStatus = async (id: number, status: Row['status']) => {
    if (!supabase) return;
    const { error } = await supabase.from('feedback').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { setErr(error.message); return; }
    setRows((p) => p?.map((r) => (r.id === id ? { ...r, status } : r)) ?? null);
  };
  const saveNote = async (id: number, admin_note: string) => {
    if (!supabase) return;
    await supabase.from('feedback').update({ admin_note }).eq('id', id);
    setRows((p) => p?.map((r) => (r.id === id ? { ...r, admin_note } : r)) ?? null);
  };

  const visible = useMemo(() => (rows ?? []).filter((r) => (filter === 'all' || r.status === filter) && (kind === 'all' || r.kind === kind)), [rows, filter, kind]);
  const avg = useMemo(() => { const rs = (rows ?? []).map((r) => r.rating).filter((n): n is number => n != null); return rs.length ? (rs.reduce((a, b) => a + b, 0) / rs.length).toFixed(1) : '—'; }, [rows]);

  if (!rows) return <div className="admin-empty"><Loader2 size={18} className="spin" /></div>;

  return (
    <section>
      <div className="admin-stats">
        <div><strong>{rows.filter((r) => r.status === 'new').length}</strong><span>New</span></div>
        <div><strong>{rows.filter((r) => r.kind === 'bug').length}</strong><span>Bugs reported</span></div>
        <div><strong>{rows.filter((r) => r.kind === 'idea').length}</strong><span>Ideas</span></div>
        <div><strong>{avg}</strong><span>Avg rating / 5</span></div>
      </div>
      <div className="admin-filter">
        {(['new', 'seen', 'planned', 'done', 'closed', 'all'] as const).map((f) => <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>{f}</button>)}
        <span className="admin-filter__sep" />
        {['all', 'idea', 'bug', 'content', 'praise', 'other'].map((k) => <button key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>{k}</button>)}
      </div>
      {err && <div className="admin-error">{err}</div>}
      {visible.length === 0 ? <p className="admin-empty">Nothing here.</p> : (
        <ul className="admin-list">
          {visible.map((r) => (
            <li key={r.id} className="admin-row">
              <div className="admin-row__main">
                <div className="fbk-top">
                  <span className={`fbk-kind fbk-kind--${r.kind}`}>{r.kind}</span>
                  {r.rating != null && <span className="fbk-stars">{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={11} className={n <= r.rating! ? 'on' : ''} />)}</span>}
                  <small>{whoLabel(r.profiles)} · {countryName(r.country)} · {r.page} · {fmtDateTime(r.created_at)}</small>
                </div>
                <p>{r.message}</p>
                <input className="fbk-note" placeholder="Internal note…" defaultValue={r.admin_note ?? ''} onBlur={(e) => { if (e.target.value !== (r.admin_note ?? '')) void saveNote(r.id, e.target.value); }} />
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
