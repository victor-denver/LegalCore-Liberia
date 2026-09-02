const accentStart = '#EFF6FF';
const accentMid = '#002868';
const accentEnd = '#BF0A30';

function createSeededData(rows: number, cols: number) {
  let seed = 123456789;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => {
      const base = 8 + row * 1.6 + col * 1.9;
      const wave = Math.sin(row * 0.5) * Math.cos(col * 0.45) * 6;
      return Math.round(base + wave + rand() * (row + col + 1) * 2.2);
    }),
  );
}

function interpolateColor(ratio: number) {
  const hexToRgb = (hex: string) => {
    const n = hex.replace('#', '');
    return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
  };
  const rgbToHex = (r: number, g: number, b: number) =>
    `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
  const [r1, g1, b1] = hexToRgb(accentStart);
  const [r2, g2, b2] = hexToRgb(accentMid);
  const [r3, g3, b3] = hexToRgb(accentEnd);
  if (ratio < 0.5) {
    const t = ratio / 0.5;
    return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
  }
  const t = (ratio - 0.5) / 0.5;
  return rgbToHex(r2 + (r3 - r2) * t, g2 + (g3 - g2) * t, b2 + (b3 - b2) * t);
}

export type HeatmapChartProps = {
  width: number;
  height: number;
  rows?: number;
  columns?: number;
};

const defaultRows = 16;
const defaultCols = 16;

export const HeatmapChart = ({
  width,
  height,
  rows = defaultRows,
  columns = defaultCols,
}: HeatmapChartProps) => {
  const data = createSeededData(rows, columns);
  const values = data.flat();
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const totalValue = values.reduce((sum, value) => sum + value, 0);

  const chartWidth = Math.max(0, width - 40);
  const chartHeight = Math.max(0, height - 60);
  const cellWidth = chartWidth / columns;
  const cellHeight = chartHeight / rows;

  return (
    <div style={{ width, height, color: '#334155', fontFamily: 'Inter, system-ui, sans-serif', borderRadius: 16, overflow: 'hidden', border: '1px solid #E2E8F0', background: 'white' }}>
      <svg width={width} height={height} style={{ display: 'block' }}>
        <rect x={0} y={0} width={width} height={height} rx={16} fill="white" />
        <text x={20} y={26} fill="#0F172A" fontSize={14} fontWeight={800} letterSpacing="-0.02em">
          Indexed legal coverage — RED WHITE BLUE
        </text>
        <text x={20} y={44} fill="#64748B" fontSize={11} fontWeight={600} letterSpacing="0.04em">
          {(rows * columns).toLocaleString()} CELLS • {totalValue.toLocaleString()} POINTS • 1847–2024
        </text>
        <g transform="translate(20, 56)">
          {data.map((rowData, rowIndex) =>
            rowData.map((value, colIndex) => {
              const normalized = (value - minValue) / (maxValue - minValue || 1);
              const fill = interpolateColor(normalized);
              return (
                <rect
                  key={`${rowIndex}-${colIndex}`}
                  x={colIndex * cellWidth}
                  y={rowIndex * cellHeight}
                  width={cellWidth - 2.2}
                  height={cellHeight - 2.2}
                  rx={5}
                  fill={fill}
                  stroke="white"
                  strokeWidth={0.6}
                />
              );
            }),
          )}
        </g>
      </svg>
    </div>
  );
};
