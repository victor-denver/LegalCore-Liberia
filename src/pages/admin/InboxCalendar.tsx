import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * Everything that arrived from users, laid out on a calendar: feedback, law
 * requests, corrections and sign-ups. Shows at a glance which days were busy and
 * what came in — the pulse of the product in one panel.
 */

type Kind = 'feedback' | 'request' | 'correction' | 'signup';
interface Row { day: string; kind: Kind; items: number }

const KINDS: { k: Kind; label: string; color: string }[] = [
  { k: 'feedback', label: 'Feedback', color: 'var(--sunrise-gold)' },
  { k: 'request', label: 'Law requests', color: '#93C5FD' },
  { k: 'correction', label: 'Corrections', color: 'var(--accent-red)' },
  { k: 'signup', label: 'Sign-ups', color: 'var(--leaf-live)' },
];

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

type Totals = Partial<Record<Kind, number>>;
interface DayCell { key: string; date: number; totals: Totals; total: number; isToday: boolean }

/** Impure reads kept out of render. */
function thisMonth() { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; }
function todayKey() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

export default function InboxCalendar() {
  // Null means "still loading"; without a configured backend there is nothing to load.
  const [rows, setRows] = useState<Row[] | null>(() => (supabase ? null : []));
  const [cursor, setCursor] = useState(thisMonth);
  const [selected, setSelected] = useState<string | null>(null);
  const [today] = useState(todayKey);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.from('insights_inbox_daily').select('*').then(({ data }) => {
      if (alive) setRows((data as Row[]) ?? []);
    });
    return () => { alive = false; };
  }, []);

  const byDay = useMemo(() => {
    const m = new Map<string, Totals>();
    (rows ?? []).forEach((r) => {
      const day = r.day.slice(0, 10);
      const cur = m.get(day) ?? {};
      cur[r.kind] = (cur[r.kind] ?? 0) + r.items;
      m.set(day, cur);
    });
    return m;
  }, [rows]);

  const { cells, lead, monthTotal } = useMemo(() => {
    const first = new Date(Date.UTC(cursor.year, cursor.month, 1));
    const daysInMonth = new Date(Date.UTC(cursor.year, cursor.month + 1, 0)).getUTCDate();
    const out: DayCell[] = [];
    let sum = 0;
    for (let date = 1; date <= daysInMonth; date++) {
      const key = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      const totals = byDay.get(key) ?? {};
      const total = Object.values(totals).reduce((a, b) => a + (b ?? 0), 0);
      sum += total;
      out.push({ key, date, totals, total, isToday: key === today });
    }
    return { cells: out, lead: first.getUTCDay(), monthTotal: sum };
  }, [cursor, byDay, today]);

  const max = useMemo(() => Math.max(1, ...cells.map((c) => c.total)), [cells]);
  const active = selected ? cells.find((c) => c.key === selected) ?? null : null;
  const busiest = useMemo(() => [...cells].filter((c) => c.total > 0).sort((a, b) => b.total - a.total).slice(0, 6), [cells]);

  const move = (delta: number) => {
    setSelected(null);
    setCursor(({ year, month }) => {
      const m = month + delta;
      if (m < 0) return { year: year - 1, month: 11 };
      if (m > 11) return { year: year + 1, month: 0 };
      return { year, month: m };
    });
  };

  if (!rows) return <div className="admin-empty"><Loader2 size={18} className="spin" /></div>;

  return (
    <section className="ins-card ins-card--wide">
      <h3>
        <CalendarDays size={14} /> Inbox calendar
        <em>{monthTotal} item{monthTotal === 1 ? '' : 's'} this month</em>
      </h3>

      <div className="cal">
        <div className="cal__main">
          <div className="cal__head">
            <strong>{MONTHS[cursor.month]} <span>{cursor.year}</span></strong>
            <div className="cal__nav">
              <button onClick={() => move(-1)} aria-label="Previous month"><ChevronLeft size={15} /></button>
              <button onClick={() => move(1)} aria-label="Next month"><ChevronRight size={15} /></button>
            </div>
          </div>

          <div className="cal__grid cal__grid--dow">
            {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
          </div>

          <motion.div layout className="cal__grid">
            {Array.from({ length: lead }, (_, i) => <span key={`pad-${i}`} className="cal__cell cal__cell--empty" />)}
            {cells.map((c) => (
              <motion.button
                key={c.key}
                layout
                type="button"
                className={`cal__cell ${c.total ? 'cal__cell--has' : ''} ${c.isToday ? 'cal__cell--today' : ''} ${selected === c.key ? 'cal__cell--on' : ''}`}
                style={c.total ? { borderColor: `rgba(247,183,51,${0.2 + 0.55 * (c.total / max)})` } : undefined}
                onClick={() => setSelected((s) => (s === c.key ? null : c.key))}
                onMouseEnter={() => c.total && setSelected(c.key)}
              >
                <span className="cal__date">{c.date}</span>
                {c.total > 0 && (
                  <>
                    <motion.span layoutId={`badge-${c.key}`} className="cal__badge">{c.total}</motion.span>
                    <span className="cal__dots">
                      {KINDS.filter((k) => c.totals[k.k]).map((k) => <i key={k.k} style={{ background: k.color }} />)}
                    </span>
                  </>
                )}
              </motion.button>
            ))}
          </motion.div>

          <div className="cal__legend">
            {KINDS.map((k) => <span key={k.k}><i style={{ background: k.color }} /> {k.label}</span>)}
          </div>
        </div>

        <div className="cal__side">
          <AnimatePresence mode="wait">
            {active && active.total > 0 ? (
              <motion.div key={active.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                <h4>{MONTHS[cursor.month]} {active.date}{active.isToday ? ' · today' : ''}</h4>
                <ul className="cal__breakdown">
                  {KINDS.filter((k) => active.totals[k.k]).map((k) => (
                    <li key={k.k}>
                      <i style={{ background: k.color }} />
                      <span>{k.label}</span>
                      <strong>{active.totals[k.k]}</strong>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ) : (
              <motion.div key="busiest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                <h4>Busiest days</h4>
                {busiest.length === 0 ? (
                  <p className="admin-empty" style={{ padding: '12px 0', textAlign: 'left' }}>Nothing arrived this month yet.</p>
                ) : (
                  <ul className="cal__breakdown">
                    {busiest.map((c) => (
                      <li key={c.key}>
                        <i style={{ background: 'var(--sunrise-gold)' }} />
                        <span>{MONTHS[cursor.month].slice(0, 3)} {c.date}</span>
                        <strong>{c.total}</strong>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="cal__hint">Hover a day to see what came in.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
