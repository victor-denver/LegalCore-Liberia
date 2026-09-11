import { useEffect, useMemo, useState } from 'react';
import { Group } from '@visx/group';
import { scaleLinear } from '@visx/scale';
import { HeatmapRect } from '@visx/heatmap';
import { Clock3, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * When is West Africa reading the law? Weekday × hour of day, last 30 days.
 * Tells you when to publish, when to send launch emails, and whether usage is
 * office-hours (professionals) or evenings/weekends (students & citizens).
 */

interface Row { dow: number; hour: number; events: number; sessions: number }

interface Cell { count: number; dow: number; hour: number }
interface Column { bin: number; bins: Cell[] }

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CELL = 26;
const GAP = 3;
const PAD = { left: 40, top: 22, right: 10, bottom: 8 };
const WIDTH = PAD.left + 24 * CELL + PAD.right;
const HEIGHT = PAD.top + 7 * CELL + PAD.bottom;

const bins = (d: Column) => d.bins;
const count = (d: Cell) => d.count;

export default function ActivityHeatmap() {
  // Null means "still loading"; without a configured backend there is nothing to load.
  const [rows, setRows] = useState<Row[] | null>(() => (supabase ? null : []));
  const [hover, setHover] = useState<Cell | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.from('insights_activity_heatmap').select('*').then(({ data }) => {
      if (alive) setRows((data as Row[]) ?? []);
    });
    return () => { alive = false; };
  }, []);

  const { columns, max } = useMemo(() => {
    const lookup = new Map<string, number>();
    (rows ?? []).forEach((r) => lookup.set(`${r.dow}-${r.hour}`, r.sessions || r.events));
    const cols: Column[] = Array.from({ length: 24 }, (_, hour) => ({
      bin: hour,
      bins: Array.from({ length: 7 }, (_, dow) => ({ dow, hour, count: lookup.get(`${dow}-${hour}`) ?? 0 })),
    }));
    return { columns: cols, max: Math.max(1, ...[...lookup.values()]) };
  }, [rows]);

  const xScale = scaleLinear<number>({ domain: [0, 24], range: [0, 24 * CELL] });
  const yScale = scaleLinear<number>({ domain: [0, 7], range: [0, 7 * CELL] });
  const colorScale = scaleLinear<string>({ range: ['#20201B', '#F7B733'], domain: [0, max] });
  const opacityScale = scaleLinear<number>({ range: [0.35, 1], domain: [0, max] });

  if (!rows) return <div className="admin-empty"><Loader2 size={18} className="spin" /></div>;

  const busiest = [...(rows ?? [])].sort((a, b) => (b.sessions || b.events) - (a.sessions || a.events))[0];

  return (
    <section className="ins-card ins-card--wide">
      <h3>
        <Clock3 size={14} /> When people use LegalCore
        <em>weekday × hour · 30 days</em>
      </h3>

      {rows.length === 0 ? (
        <p className="admin-empty">No activity recorded yet — the map fills in as people use the site.</p>
      ) : (
        <>
          <div className="heat">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height="auto" role="img" aria-label="Activity by weekday and hour">
              {/* Hour ruler */}
              <Group top={12} left={PAD.left}>
                {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
                  <text key={h} x={h * CELL + CELL / 2} textAnchor="middle" className="heat__tick">
                    {h === 0 ? '12a' : h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`}
                  </text>
                ))}
              </Group>

              {/* Day labels */}
              <Group top={PAD.top} left={PAD.left - 10}>
                {DAY_LABELS.map((d, i) => (
                  <text key={d} y={i * CELL + CELL / 2 + 3} textAnchor="end" className="heat__tick">{d}</text>
                ))}
              </Group>

              <Group top={PAD.top} left={PAD.left}>
                <HeatmapRect<Column, Cell>
                  data={columns}
                  bins={bins}
                  count={count}
                  xScale={(d) => xScale(d) ?? 0}
                  yScale={(d) => yScale(d) ?? 0}
                  colorScale={colorScale}
                  opacityScale={opacityScale}
                  binWidth={CELL}
                  binHeight={CELL}
                  gap={GAP}
                >
                  {(heatmap) =>
                    heatmap.map((heatmapBins) =>
                      heatmapBins.map((bin) => (
                        <rect
                          key={`heat-${bin.row}-${bin.column}`}
                          className="heat__cell"
                          width={bin.width}
                          height={bin.height}
                          x={bin.x}
                          y={bin.y}
                          rx={5}
                          fill={bin.bin.count === 0 ? '#181815' : bin.color}
                          fillOpacity={bin.bin.count === 0 ? 1 : bin.opacity}
                          onMouseEnter={() => setHover(bin.bin)}
                          onMouseLeave={() => setHover(null)}
                        />
                      )),
                    )
                  }
                </HeatmapRect>
              </Group>
            </svg>
          </div>

          <div className="heat__foot">
            <span className="heat__legend">
              Quiet
              <i style={{ background: '#181815' }} />
              <i style={{ background: '#4A3A1C' }} />
              <i style={{ background: '#9A751F' }} />
              <i style={{ background: '#F7B733' }} />
              Busy
            </span>
            <span className="heat__read">
              {hover
                ? `${DAY_LABELS[hover.dow]} ${hover.hour}:00 — ${hover.count} session${hover.count === 1 ? '' : 's'}`
                : busiest
                  ? `Busiest: ${DAY_LABELS[busiest.dow]} around ${busiest.hour}:00 (UTC)`
                  : ''}
            </span>
          </div>
        </>
      )}
    </section>
  );
}
