import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, SearchX, FileText, Globe2, ThumbsUp, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PRO_FEATURES } from '../../data/plans';
import { titleById, countryName, fmtDate } from './shared';
import ActivityHeatmap from './ActivityHeatmap';
import InboxCalendar from './InboxCalendar';

interface Daily { day: string; sessions: number; signed_in_users: number; searches: number; doc_views: number; ai_queries: number }
interface TopSearch { query: string; searches: number; avg_results: number; last_seen: string }
interface ZeroSearch { query: string; country: string; searches: number; last_seen: string }
interface TopDoc { doc_id: string; views: number; sessions: number; exports: number }
interface CountryRow { country: string; events: number; sessions: number; users: number; searches: number; doc_views: number; ai_queries: number }
interface Interest { feature_key: string; votes: number; last_vote: string }

interface Data { daily: Daily[]; top: TopSearch[]; zero: ZeroSearch[]; docs: TopDoc[]; countries: CountryRow[]; interest: Interest[]; error: string | null }

async function fetchInsights(): Promise<Data> {
  if (!supabase) return { daily: [], top: [], zero: [], docs: [], countries: [], interest: [], error: 'Not configured' };
  const [d, t, z, dc, c, i] = await Promise.all([
    supabase.from('insights_daily').select('*'),
    supabase.from('insights_top_searches').select('*').limit(25),
    supabase.from('insights_zero_result_searches').select('*').limit(25),
    supabase.from('insights_top_documents').select('*').limit(20),
    supabase.from('insights_country_activity').select('*'),
    supabase.from('insights_feature_interest').select('*'),
  ]);
  const err = d.error || t.error || z.error || dc.error || c.error || i.error;
  return {
    daily: (d.data as Daily[]) ?? [], top: (t.data as TopSearch[]) ?? [], zero: (z.data as ZeroSearch[]) ?? [],
    docs: (dc.data as TopDoc[]) ?? [], countries: (c.data as CountryRow[]) ?? [], interest: (i.data as Interest[]) ?? [],
    error: err ? err.message : null,
  };
}

const featureTitle = (k: string) => PRO_FEATURES.find((f) => f.key === k)?.title ?? k;

/** 30-day product signal: what people want, where they are, what to build & sell. */
export default function InsightsTab() {
  const [data, setData] = useState<Data | null>(null);
  useEffect(() => { let alive = true; fetchInsights().then((d) => { if (alive) setData(d); }); return () => { alive = false; }; }, []);

  if (!data) return <div className="admin-empty"><Loader2 size={18} className="spin" /></div>;
  if (data.error) return <div className="admin-error">{data.error} — did you run <code>0002_product_platform.sql</code>?</div>;

  const totals = data.daily.reduce((a, r) => ({ sessions: a.sessions + r.sessions, searches: a.searches + r.searches, doc_views: a.doc_views + r.doc_views, ai: a.ai + r.ai_queries }), { sessions: 0, searches: 0, doc_views: 0, ai: 0 });
  const maxSessions = Math.max(1, ...data.daily.map((r) => r.sessions));
  const series = [...data.daily].reverse();

  return (
    <div className="ins">
      <div className="admin-stats">
        <div><strong>{totals.sessions}</strong><span>Sessions · 30d</span></div>
        <div><strong>{totals.searches}</strong><span>Searches</span></div>
        <div><strong>{totals.doc_views}</strong><span>Document reads</span></div>
        <div><strong>{totals.ai}</strong><span>AI questions</span></div>
      </div>

      <section className="ins-card">
        <h3><TrendingUp size={14} /> Daily sessions</h3>
        {series.length === 0 ? <p className="admin-empty">No traffic yet. Share the link.</p> : (
          <div className="ins-bars" aria-label="Daily sessions">
            {series.map((r) => (
              <div key={r.day} className="ins-bar" title={`${r.day}: ${r.sessions} sessions, ${r.searches} searches`}>
                <span style={{ height: `${Math.max(3, (r.sessions / maxSessions) * 100)}%` }} />
                <small>{fmtDate(r.day)}</small>
              </div>
            ))}
          </div>
        )}
      </section>

      <ActivityHeatmap />

      <div className="ins-grid">
        <section className="ins-card">
          <h3><SearchX size={14} /> Searches with zero results <em>build these next</em></h3>
          {data.zero.length === 0 ? <p className="admin-empty">None — every search found something.</p> : (
            <table className="admin-table">
              <thead><tr><th>Query</th><th>Country</th><th>×</th></tr></thead>
              <tbody>{data.zero.map((r, i) => <tr key={i}><td className="ins-q">{r.query}</td><td>{countryName(r.country)}</td><td>{r.searches}</td></tr>)}</tbody>
            </table>
          )}
        </section>

        <section className="ins-card">
          <h3><TrendingUp size={14} /> Top searches</h3>
          {data.top.length === 0 ? <p className="admin-empty">Nothing yet.</p> : (
            <table className="admin-table">
              <thead><tr><th>Query</th><th>×</th><th>Avg results</th></tr></thead>
              <tbody>{data.top.map((r, i) => <tr key={i}><td className="ins-q">{r.query}</td><td>{r.searches}</td><td>{r.avg_results}</td></tr>)}</tbody>
            </table>
          )}
        </section>

        <section className="ins-card">
          <h3><FileText size={14} /> Most-read documents</h3>
          {data.docs.length === 0 ? <p className="admin-empty">Nothing yet.</p> : (
            <table className="admin-table">
              <thead><tr><th>Document</th><th>Reads</th><th>PDF</th></tr></thead>
              <tbody>{data.docs.map((r) => <tr key={r.doc_id}><td><Link to={`/document/${r.doc_id}`} className="ins-link">{titleById.get(r.doc_id) ?? r.doc_id}</Link></td><td>{r.views}</td><td>{r.exports}</td></tr>)}</tbody>
            </table>
          )}
        </section>

        <section className="ins-card">
          <h3><Globe2 size={14} /> Activity by country <em>where to launch next</em></h3>
          {data.countries.length === 0 ? <p className="admin-empty">Nothing yet.</p> : (
            <table className="admin-table">
              <thead><tr><th>Country</th><th>Sessions</th><th>Searches</th><th>Reads</th><th>AI</th></tr></thead>
              <tbody>{data.countries.map((r) => <tr key={r.country}><td>{countryName(r.country)}</td><td>{r.sessions}</td><td>{r.searches}</td><td>{r.doc_views}</td><td>{r.ai_queries}</td></tr>)}</tbody>
            </table>
          )}
        </section>

        <section className="ins-card ins-card--wide">
          <h3><ThumbsUp size={14} /> "I'd pay for this" votes <em>your Pro roadmap, ranked by demand</em></h3>
          {data.interest.length === 0 ? <p className="admin-empty">No votes yet. Point users at <Link to="/plans" className="ins-link">/plans</Link>.</p> : (
            <div className="ins-votes">
              {data.interest.map((r) => {
                const max = data.interest[0].votes || 1;
                return (
                  <div key={r.feature_key} className="ins-vote">
                    <span className="ins-vote__label">{featureTitle(r.feature_key)}</span>
                    <span className="ins-vote__bar"><i style={{ width: `${(r.votes / max) * 100}%` }} /></span>
                    <strong>{r.votes}</strong>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <InboxCalendar />
      </div>
    </div>
  );
}
