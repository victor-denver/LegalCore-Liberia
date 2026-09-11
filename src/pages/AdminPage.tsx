import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MessageSquareWarning, Bell, Users, RefreshCw, Check, X, Eye, BarChart3, MessageSquareHeart, FilePlus2, Settings2 } from 'lucide-react';
import { supabase, type Profile } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { titleById, countryName } from './admin/shared';
import InsightsTab from './admin/InsightsTab';
import FeedbackTab from './admin/FeedbackTab';
import RequestsTab from './admin/RequestsTab';
import ConfigTab from './admin/ConfigTab';
import './AdminPage.css';

interface CorrectionRow {
  id: number;
  user_id: string | null;
  doc_id: string;
  message: string;
  status: 'open' | 'reviewing' | 'resolved' | 'rejected';
  admin_note: string | null;
  created_at: string;
  profiles?: { email: string | null; full_name: string | null } | null;
}
interface WatchRow { id: number; country: string; contact: string; created_at: string; }

type Tab = 'insights' | 'feedback' | 'requests' | 'corrections' | 'watchlist' | 'users' | 'config';

interface Snapshot { corrections: CorrectionRow[]; watch: WatchRow[]; users: Profile[]; error: string | null }

/** Users seen in the last 7 days (computed outside render to keep components pure). */
function countActive(users: Profile[]): number {
  const cutoff = Date.now() - 7 * 86_400_000;
  return users.filter((u) => u.last_seen_at && new Date(u.last_seen_at).getTime() > cutoff).length;
}

async function fetchSnapshot(): Promise<Snapshot> {
  if (!supabase) return { corrections: [], watch: [], users: [], error: 'Supabase not configured' };
  const [c, w, u] = await Promise.all([
    supabase.from('corrections').select('*, profiles(email, full_name)').order('created_at', { ascending: false }).limit(500),
    supabase.from('watchlist').select('id, country, contact, created_at').order('created_at', { ascending: false }).limit(1000),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(500),
  ]);
  const firstErr = c.error || w.error || u.error;
  return {
    corrections: (c.data as CorrectionRow[]) ?? [],
    watch: (w.data as WatchRow[]) ?? [],
    users: (u.data as Profile[]) ?? [],
    error: firstErr ? firstErr.message : null,
  };
}

export default function AdminPage() {
  const { profile, user } = useAuth();
  const [tab, setTab] = useState<Tab>('insights');
  const [corrections, setCorrections] = useState<CorrectionRow[]>([]);
  const [watch, setWatch] = useState<WatchRow[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | CorrectionRow['status']>('open');

  const apply = useCallback((s: Snapshot) => {
    setErr(s.error);
    setCorrections(s.corrections);
    setWatch(s.watch);
    setUsers(s.users);
    setLoading(false);
  }, []);

  useEffect(() => {
    let alive = true;
    fetchSnapshot().then((s) => { if (alive) apply(s); });
    return () => { alive = false; };
  }, [apply]);

  const refresh = () => { setLoading(true); fetchSnapshot().then(apply); };

  const setStatus = async (id: number, status: CorrectionRow['status']) => {
    if (!supabase) return;
    const { error } = await supabase.from('corrections').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) { setErr(error.message); return; }
    setCorrections((p) => p.map((c) => (c.id === id ? { ...c, status } : c)));
  };

  const setRole = async (id: string, role: Profile['role']) => {
    if (!supabase || id === user?.id) return; // never demote yourself by accident
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) { setErr(error.message); return; }
    setUsers((p) => p.map((u) => (u.id === id ? { ...u, role } : u)));
  };

  const visible = useMemo(() => (filter === 'all' ? corrections : corrections.filter((c) => c.status === filter)), [corrections, filter]);
  const activeUsers = useMemo(() => countActive(users), [users]);
  const byCountry = useMemo(() => {
    const m = new Map<string, number>();
    watch.forEach((w) => m.set(w.country, (m.get(w.country) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [watch]);

  return (
    <div className="admin">
      <div className="admin__inner">
        <header className="admin-head">
          <div>
            <span className="admin-badge"><ShieldCheck size={12} /> ADMIN</span>
            <h1>Command centre</h1>
            <p>Signed in as {profile?.email}. What people search for, what they ask for, what they'd pay for — and the switches to act on it.</p>
          </div>
          <button className="admin-refresh" onClick={refresh} disabled={loading}><RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh</button>
        </header>

        <div className="admin-tabs">
          <button className={tab === 'insights' ? 'on' : ''} onClick={() => setTab('insights')}><BarChart3 size={13} /> Insights</button>
          <button className={tab === 'feedback' ? 'on' : ''} onClick={() => setTab('feedback')}><MessageSquareHeart size={13} /> Feedback</button>
          <button className={tab === 'requests' ? 'on' : ''} onClick={() => setTab('requests')}><FilePlus2 size={13} /> Law requests</button>
          <button className={tab === 'corrections' ? 'on' : ''} onClick={() => setTab('corrections')}><MessageSquareWarning size={13} /> Corrections {corrections.some((c) => c.status === 'open') && <i className="admin-dot" />}</button>
          <button className={tab === 'watchlist' ? 'on' : ''} onClick={() => setTab('watchlist')}><Bell size={13} /> Launch alerts</button>
          <button className={tab === 'users' ? 'on' : ''} onClick={() => setTab('users')}><Users size={13} /> Users</button>
          <button className={tab === 'config' ? 'on' : ''} onClick={() => setTab('config')}><Settings2 size={13} /> Config</button>
        </div>

        {err && <div className="admin-error">{err}</div>}

        {tab === 'insights' && <InsightsTab />}
        {tab === 'feedback' && <FeedbackTab />}
        {tab === 'requests' && <RequestsTab />}
        {tab === 'config' && <ConfigTab />}

        {(tab === 'corrections' || tab === 'watchlist' || tab === 'users') && (
          <div className="admin-stats">
            <div><strong>{corrections.filter((c) => c.status === 'open').length}</strong><span>Open corrections</span></div>
            <div><strong>{watch.length}</strong><span>Launch alerts</span></div>
            <div><strong>{users.length}</strong><span>Accounts</span></div>
            <div><strong>{activeUsers}</strong><span>Active · 7d</span></div>
          </div>
        )}

        {tab === 'corrections' && (
          <section>
            <div className="admin-filter">
              {(['open', 'reviewing', 'resolved', 'rejected', 'all'] as const).map((f) => (
                <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>{f}</button>
              ))}
            </div>
            {visible.length === 0 ? <p className="admin-empty">Nothing here.</p> : (
              <ul className="admin-list">
                {visible.map((c) => (
                  <li key={c.id} className="admin-row">
                    <div className="admin-row__main">
                      <Link to={`/document/${c.doc_id}`} className="admin-row__doc">{titleById.get(c.doc_id) ?? c.doc_id}</Link>
                      <p>{c.message}</p>
                      <small>{c.profiles?.full_name || c.profiles?.email || 'anonymous'} • {new Date(c.created_at).toLocaleString()} • <span className={`st st--${c.status}`}>{c.status}</span></small>
                    </div>
                    <div className="admin-row__actions">
                      <button title="Mark reviewing" onClick={() => void setStatus(c.id, 'reviewing')}><Eye size={14} /></button>
                      <button title="Resolve" className="ok" onClick={() => void setStatus(c.id, 'resolved')}><Check size={14} /></button>
                      <button title="Reject" className="no" onClick={() => void setStatus(c.id, 'rejected')}><X size={14} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === 'watchlist' && (
          <section>
            <div className="admin-chips">
              {byCountry.map(([country, n]) => <span key={country}>{countryName(country) === 'Unknown' ? country : countryName(country)} <strong>{n}</strong></span>)}
            </div>
            {watch.length === 0 ? <p className="admin-empty">No launch alerts yet.</p> : (
              <table className="admin-table">
                <thead><tr><th>Country</th><th>Contact</th><th>Date</th></tr></thead>
                <tbody>
                  {watch.map((w) => <tr key={w.id}><td>{w.country}</td><td>{w.contact}</td><td>{new Date(w.created_at).toLocaleDateString()}</td></tr>)}
                </tbody>
              </table>
            )}
          </section>
        )}

        {tab === 'users' && (
          <section>
            <table className="admin-table">
              <thead><tr><th>User</th><th>Email</th><th>Joined</th><th>Country</th><th>Who</th><th>Last seen</th><th>Role</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="admin-user">
                      {u.avatar_url ? <img src={u.avatar_url} alt="" referrerPolicy="no-referrer" /> : <span className="admin-user__ph">{(u.full_name || u.email || '?').slice(0, 1).toUpperCase()}</span>}
                      {u.full_name || '—'}
                    </td>
                    <td>{u.email}</td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>{countryName(u.country_code)}</td>
                    <td>{u.profession ?? '—'}{u.organization ? <small style={{ display: 'block', color: 'var(--text-faint)' }}>{u.organization}</small> : null}</td>
                    <td>{u.last_seen_at ? new Date(u.last_seen_at).toLocaleDateString() : '—'}</td>
                    <td>
                      <select value={u.role} disabled={u.id === user?.id} onChange={(e) => void setRole(u.id, e.target.value as Profile['role'])}>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </div>
  );
}
