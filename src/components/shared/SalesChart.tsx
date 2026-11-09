import { useMemo } from 'react'
import {
  type DailySalesPoint,
  DEFAULT_DIMENSIONS,
  calculateChartPoints,
  formatYTick,
  selectXAxisTicks,
} from './SalesChart.calc'

// 30 hari data penjualan default (Oktober 2026 - Keripik Pisang Rina)
const DEFAULT_SALES_DATA: DailySalesPoint[] = [
  { date: '28 Sep', amount: 160_000 },
  { date: '29 Sep', amount: 180_000 },
  { date: '30 Sep', amount: 150_000 },
  { date: '1 Okt', amount: 170_000 },
  { date: '2 Okt', amount: 215_000 },
  { date: '3 Okt', amount: 160_000 },
  { date: '4 Okt', amount: 130_000 },
  { date: '5 Okt', amount: 0 }, // Minggu libur
  { date: '6 Okt', amount: 175_000 },
  { date: '7 Okt', amount: 185_000 },
  { date: '8 Okt', amount: 195_000 },
  { date: '9 Okt', amount: 170_000 },
  { date: '10 Okt', amount: 235_000 },
  { date: '11 Okt', amount: 190_000 },
  { date: '12 Okt', amount: 0 }, // Minggu libur
  { date: '13 Okt', amount: 180_000 },
  { date: '14 Okt', amount: 200_000 },
  { date: '15 Okt', amount: 170_000 },
  { date: '16 Okt', amount: 210_000 },
  { date: '17 Okt', amount: 255_000 },
  { date: '18 Okt', amount: 200_000 },
  { date: '19 Okt', amount: 0 }, // Minggu libur
  { date: '20 Okt', amount: 185_000 },
  { date: '21 Okt', amount: 230_000 },
  { date: '22 Okt', amount: 285_000 },
  { date: '23 Okt', amount: 350_000 },
  { date: '24 Okt', amount: 430_000 },
  { date: '25 Okt', amount: 205_000 },
  { date: '26 Okt', amount: 0 }, // Minggu libur
  { date: '27 Okt', amount: 215_000 },
]

export interface SalesChartProps {
  data?: DailySalesPoint[]
  className?: string
}

export function SalesChart({ data = DEFAULT_SALES_DATA, className = '' }: SalesChartProps) {
  const { points, pathD, maxAmount, midAmount } = useMemo(
    () => calculateChartPoints(data, DEFAULT_DIMENSIONS),
    [data]
  )

  const xTicks = useMemo(() => selectXAxisTicks(points), [points])

  const { width, height, startX, endX, topY, baseY } = DEFAULT_DIMENSIONS
  const midY = (topY + baseY) / 2

  return (
    <div className={`w-full flex flex-col pt-3 overflow-hidden ${className}`}>
      <div className="w-full h-44">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full block"
          preserveAspectRatio="none"
          aria-label="Grafik tren penjualan 30 hari"
        >
          {/* Label Sumbu Y Dinamis (Selalu rapi di dalam interval x=10 s/d x=46) */}
          <text
            x="46"
            y={topY + 4}
            textAnchor="end"
            className="text-[11px] fill-current text-ink-soft font-sans tabular-nums select-none"
          >
            {formatYTick(maxAmount)}
          </text>
          <text
            x="46"
            y={midY + 4}
            textAnchor="end"
            className="text-[11px] fill-current text-ink-soft font-sans tabular-nums select-none"
          >
            {formatYTick(midAmount)}
          </text>
          <text
            x="46"
            y={baseY + 4}
            textAnchor="end"
            className="text-[11px] fill-current text-ink-soft font-sans tabular-nums select-none"
          >
            0
          </text>

          {/* Garis Vertikal Sumbu Y */}
          <line
            x1={startX}
            y1={topY}
            x2={startX}
            y2={baseY}
            stroke="currentColor"
            strokeWidth="1"
            className="text-line"
          />

          {/* Garis Grid Horizontal Sumbu X */}
          <line
            x1={startX}
            y1={topY}
            x2={endX}
            y2={topY}
            stroke="currentColor"
            strokeDasharray="3 3"
            strokeWidth="1"
            className="text-line"
          />
          <line
            x1={startX}
            y1={midY}
            x2={endX}
            y2={midY}
            stroke="currentColor"
            strokeDasharray="3 3"
            strokeWidth="1"
            className="text-line"
          />
          <line
            x1={startX}
            y1={baseY}
            x2={endX}
            y2={baseY}
            stroke="currentColor"
            strokeWidth="1.25"
            className="text-line-strong"
          />

          {/* Garis Tren Hijau Teal Dinamis */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            />
          )}

          {/* Label Sumbu X Dinamis */}
          {xTicks.map((tick) => (
            <text
              key={tick.date}
              x={tick.x}
              y={baseY + 23}
              textAnchor={tick.anchor}
              className="text-[11px] fill-current text-ink-soft font-sans select-none"
            >
              {tick.date}
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}
