const background = '#28272c';
const accentStart = '#122549';
const accentEnd = '#f33d15';

function createSeededData(rows: number, cols: number) {
  let seed = 123456789;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => {
      const base = 8 + row * 2 + col * 2;
      return Math.round(base + rand() * (row + col + 1) * 3);
    }),
  );
}

function interpolateColor(start: string, end: string, ratio: number) {
  const hexToRgb = (hex: string) => {
    const normalized = hex.replace('#', '');
    return [
      parseInt(normalized.slice(0, 2), 16),
      parseInt(normalized.slice(2, 4), 16),
      parseInt(normalized.slice(4, 6), 16),
    ];
  };

  const [r1, g1, b1] = hexToRgb(start);
  const [r2, g2, b2] = hexToRgb(end);
  const r = Math.round(r1 + (r2 - r1) * ratio);
  const g = Math.round(g1 + (g2 - g1) * ratio);
  const b = Math.round(b1 + (b2 - b1) * ratio);
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`;
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
    <div style={{ width, height, color: '#eee', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <svg width={width} height={height}>
        <rect x={0} y={0} width={width} height={height} rx={14} fill={background} />
        <text x={24} y={24} fill="#fff" fontSize={14} fontWeight={700}>
          Indexed legal coverage
        </text>
        <text x={24} y={42} fill="#bfc7d7" fontSize={12}>
          {rows * columns} coverage cells • {totalValue.toLocaleString()} data points total
        </text>
        <g transform="translate(20, 50)">
          {data.map((rowData, rowIndex) =>
            rowData.map((value, colIndex) => {
              const normalized = (value - minValue) / (maxValue - minValue || 1);
              const fill = interpolateColor(accentStart, accentEnd, normalized);
              return (
                <rect
                  key={`${rowIndex}-${colIndex}`}
                  x={colIndex * cellWidth}
                  y={rowIndex * cellHeight}
                  width={cellWidth - 2}
                  height={cellHeight - 2}
                  rx={4}
                  fill={fill}
                />
              );
            }),
          )}
        </g>
      </svg>
    </div>
  );
};
