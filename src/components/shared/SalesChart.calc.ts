export interface DailySalesPoint {
  date: string
  amount: number
}

export interface ChartDimensions {
  width: number
  height: number
  startX: number
  endX: number
  topY: number
  baseY: number
}

export const DEFAULT_DIMENSIONS: ChartDimensions = {
  width: 540,
  height: 195,
  startX: 55,
  endX: 530,
  topY: 30,
  baseY: 165,
}

/**
 * Menghitung batas maksimum skala sumbu Y yang membulat rapi (1, 2.5, 5, 10 * 10^n).
 */
export function calculateNiceMax(rawMax: number, minimumFloor = 500_000): number {
  if (rawMax <= 0 || isNaN(rawMax)) {
    return minimumFloor
  }

  const effectiveMax = Math.max(rawMax, minimumFloor)
  const exponent = Math.floor(Math.log10(effectiveMax))
  const unit = Math.pow(10, exponent)
  const fraction = effectiveMax / unit

  let niceFraction = 10
  if (fraction <= 1) {
    niceFraction = 1
  } else if (fraction <= 2.5) {
    niceFraction = 2.5
  } else if (fraction <= 5) {
    niceFraction = 5
  }

  return Math.round(niceFraction * unit)
}

/**
 * Format label angka sumbu Y ke notasi ringkas Indonesia ("500 rb", "1 jt", "0").
 */
export function formatYTick(amount: number): string {
  if (amount <= 0) return '0'
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000
    return `${Number.isInteger(val) ? val : val.toFixed(1).replace('.', ',')} jt`
  }
  const val = amount / 1_000
  return `${Number.isInteger(val) ? val : val.toFixed(1).replace('.', ',')} rb`
}

export interface ChartPoint {
  x: number
  y: number
  date: string
  amount: number
}

export interface ChartCalculationResult {
  points: ChartPoint[]
  pathD: string
  maxAmount: number
  midAmount: number
}

/**
 * Menghitung koordinat titik SVG (x, y) dan atribut path 'd' dari array data dinamis.
 * Dijamin berada dalam batas kanvas SVG [startX..endX] dan [topY..baseY] tanpa overflow.
 */
export function calculateChartPoints(
  data: DailySalesPoint[],
  dimensions: ChartDimensions = DEFAULT_DIMENSIONS
): ChartCalculationResult {
  const { startX, endX, topY, baseY } = dimensions

  if (!data || data.length === 0) {
    const maxAmount = 500_000
    return {
      points: [],
      pathD: '',
      maxAmount,
      midAmount: maxAmount / 2,
    }
  }

  // Temukan nilai maksimum data
  const rawMax = Math.max(...data.map((d) => (typeof d.amount === 'number' && !isNaN(d.amount) ? d.amount : 0)))
  const maxAmount = calculateNiceMax(rawMax)
  const midAmount = maxAmount / 2
  const heightSpan = baseY - topY
  const widthSpan = endX - startX

  const count = data.length

  const points: ChartPoint[] = data.map((item, index) => {
    // x terbagi rata dari startX ke endX
    const x = count === 1 ? (startX + endX) / 2 : startX + index * (widthSpan / (count - 1))

    // y dihitung proporsional dari baseY (0) ke topY (maxAmount)
    const safeAmount = Math.max(0, Math.min(item.amount || 0, maxAmount))
    const y = baseY - (safeAmount / maxAmount) * heightSpan

    return {
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      date: item.date,
      amount: safeAmount,
    }
  })

  // Rakit atribut 'd' untuk path SVG
  let pathD = ''
  if (points.length === 1) {
    pathD = `M ${points[0].x},${points[0].y} L ${points[0].x},${points[0].y}`
  } else if (points.length > 1) {
    pathD = `M ${points.map((p) => `${p.x},${p.y}`).join(' L ')}`
  }

  return {
    points,
    pathD,
    maxAmount,
    midAmount,
  }
}

export interface XAxisTick {
  date: string
  x: number
  anchor: 'start' | 'middle' | 'end'
}

/**
 * Mengambil 5 label sumbu X yang tersebar merata agar tidak berdesakan.
 */
export function selectXAxisTicks(points: ChartPoint[]): XAxisTick[] {
  if (!points || points.length === 0) return []
  if (points.length <= 5) {
    return points.map((p, i) => ({
      date: p.date,
      x: p.x,
      anchor: i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle',
    }))
  }

  const indices = [
    0,
    Math.round((points.length - 1) * 0.25),
    Math.round((points.length - 1) * 0.5),
    Math.round((points.length - 1) * 0.75),
    points.length - 1,
  ]

  // Filter duplikat jika data sangat sedikit
  const uniqueIndices = Array.from(new Set(indices))

  return uniqueIndices.map((idx, pos) => ({
    date: points[idx].date,
    x: points[idx].x,
    anchor: pos === 0 ? 'start' : pos === uniqueIndices.length - 1 ? 'end' : 'middle',
  }))
}
