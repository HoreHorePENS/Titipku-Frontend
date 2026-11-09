import { useMemo } from 'react'
import {
  type DailySalesPoint,
  DEFAULT_DIMENSIONS,
  calculateChartPoints,
  formatYTick,
  selectXAxisTicks,
} from './SalesChart.calc'

export interface SalesChartProps {
  /** Titik penjualan harian dari data kunjungan asli (boleh semua nol). */
  data: DailySalesPoint[]
  className?: string
}

export function SalesChart({ data, className = '' }: SalesChartProps) {
  const hasSales = data.some((point) => point.amount > 0)
  const { points, pathD, maxAmount, midAmount } = useMemo(
    () => calculateChartPoints(data, DEFAULT_DIMENSIONS),
    [data]
  )

  const xTicks = useMemo(() => selectXAxisTicks(points), [points])

  const { width, height, startX, endX, topY, baseY } = DEFAULT_DIMENSIONS
  const midY = (topY + baseY) / 2

  return (
    <div className={`w-full flex flex-col pt-3 overflow-hidden ${className}`}>
      {!hasSales && (
        <p className="text-body text-ink-soft mb-2">
          Belum ada penjualan 30 hari terakhir. Grafik terisi otomatis setelah kamu mencatat kunjungan.
        </p>
      )}
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
            className="text-caption fill-current text-ink-soft font-sans tabular-nums select-none"
          >
            {formatYTick(maxAmount)}
          </text>
          <text
            x="46"
            y={midY + 4}
            textAnchor="end"
            className="text-caption fill-current text-ink-soft font-sans tabular-nums select-none"
          >
            {formatYTick(midAmount)}
          </text>
          <text
            x="46"
            y={baseY + 4}
            textAnchor="end"
            className="text-caption fill-current text-ink-soft font-sans tabular-nums select-none"
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
              className="text-caption fill-current text-ink-soft font-sans select-none"
            >
              {tick.date}
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}
