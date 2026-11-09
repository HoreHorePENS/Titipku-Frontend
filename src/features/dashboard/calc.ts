import type { DailySalesPoint } from '@/components/shared/SalesChart.calc'
import type { VisitRecord } from '@/features/visit/types'
import type { PartnerRecord } from './types'

export interface MonthSalesSummary {
  totalRevenue: number
  totalSoldPackages: number
  totalReturnedPackages: number
  returnRatePercentage: number
}

export interface PartnerPerformanceItem {
  id: string
  rank: number
  name: string
  area: string
  sold: number
  returnRate: string
  isReturnHigh: boolean
  debt: number
  lastVisit: string
  status: 'BAGUS' | 'PANTAU' | 'EVALUASI'
  note: string
}

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
]

/**
 * Format tanggal ISO ke format pendek lokal WIB: "27 Okt"
 */
export function formatShortDateWIB(isoDate: string): string {
  try {
    const d = new Date(isoDate)
    if (isNaN(d.getTime())) return ''
    const day = d.getDate()
    const month = MONTH_NAMES_SHORT[d.getMonth()]
    return `${day} ${month}`
  } catch {
    return ''
  }
}

/**
 * Menghasilkan array deret waktu 30 hari terakhir dari array kunjungan riil.
 */
export function generate30DaysSales(
  visits: VisitRecord[],
  referenceDate: Date = new Date()
): DailySalesPoint[] {
  const result: DailySalesPoint[] = []

  // Map total per YYYY-MM-DD
  const salesMap = new Map<string, number>()
  for (const v of visits) {
    if (!v.visitedAt) continue
    const dateStr = v.visitedAt.slice(0, 10) // 'YYYY-MM-DD'
    const current = salesMap.get(dateStr) || 0
    salesMap.set(dateStr, current + (v.total || 0))
  }

  // Buat 30 titik mundur dari referenceDate
  for (let i = 29; i >= 0; i--) {
    const d = new Date(referenceDate)
    d.setDate(d.getDate() - i)

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const key = `${year}-${month}-${day}`

    const label = `${d.getDate()} ${MONTH_NAMES_SHORT[d.getMonth()]}`
    const amount = salesMap.get(key) || 0

    result.push({
      date: label,
      amount,
    })
  }

  return result
}

/**
 * Menghitung ringkasan performa penjualan bulan berjalan dari data kunjungan riil.
 */
export function calculateMonthSalesSummary(
  visits: VisitRecord[],
  targetMonth: number = new Date().getMonth(),
  targetYear: number = new Date().getFullYear()
): MonthSalesSummary {
  let totalRevenue = 0
  let totalSoldPackages = 0
  let totalReturnedPackages = 0

  for (const v of visits) {
    if (!v.visitedAt) continue
    const d = new Date(v.visitedAt)
    if (d.getMonth() === targetMonth && d.getFullYear() === targetYear) {
      totalRevenue += v.total || 0
      for (const item of v.items || []) {
        totalSoldPackages += item.sold || 0
        totalReturnedPackages += item.returned || 0
      }
    }
  }

  const denominator = totalSoldPackages + totalReturnedPackages
  const returnRatePercentage =
    denominator > 0 ? Math.round((totalReturnedPackages / denominator) * 1000) / 10 : 0

  return {
    totalRevenue,
    totalSoldPackages,
    totalReturnedPackages,
    returnRatePercentage,
  }
}

/**
 * Menghitung dan meranking performa mitra warung dari data backend riil.
 */
export function calculatePartnerPerformances(
  partners: PartnerRecord[],
  visits: VisitRecord[]
): PartnerPerformanceItem[] {
  // Akumulasi data kunjungan per partnerId
  const partnerVisitsMap = new Map<
    string,
    { sold: number; returned: number; lastVisitIso: string }
  >()

  for (const v of visits) {
    const current = partnerVisitsMap.get(v.partnerId) || {
      sold: 0,
      returned: 0,
      lastVisitIso: '',
    }

    let visitSold = 0
    let visitReturned = 0
    for (const item of v.items || []) {
      visitSold += item.sold || 0
      visitReturned += item.returned || 0
    }

    current.sold += visitSold
    current.returned += visitReturned

    if (!current.lastVisitIso || v.visitedAt > current.lastVisitIso) {
      current.lastVisitIso = v.visitedAt
    }

    partnerVisitsMap.set(v.partnerId, current)
  }

  // Petakan dan urutkan berdasarkan penjualan tertinggi atau piutang
  const items: PartnerPerformanceItem[] = partners.map((p) => {
    const agg = partnerVisitsMap.get(p.id) || {
      sold: 0,
      returned: 0,
      lastVisitIso: '',
    }

    const denom = agg.sold + agg.returned
    const returnRateNum = denom > 0 ? (agg.returned / denom) * 100 : 0
    const returnRateStr = `${returnRateNum.toFixed(1).replace('.', ',')}%`
    const isReturnHigh = returnRateNum > 10

    let status: 'BAGUS' | 'PANTAU' | 'EVALUASI' = 'BAGUS'
    let note = 'Kondisi lancar'

    if (p.receivable > 500_000) {
      status = 'EVALUASI'
      note = `Piutang tinggi (${p.receivable.toLocaleString('id-ID')})`
    } else if (p.receivable > 0) {
      status = 'PANTAU'
      note = 'Ada piutang berjalan'
    } else if (isReturnHigh) {
      status = 'PANTAU'
      note = 'Tingkat retur perlu dipantau'
    }

    const area = p.address ? p.address.split(',')[0].trim() : 'Surabaya'
    const lastVisit = agg.lastVisitIso ? formatShortDateWIB(agg.lastVisitIso) : '-'

    return {
      id: p.id,
      rank: 0,
      name: p.name,
      area,
      sold: agg.sold,
      returnRate: returnRateStr,
      isReturnHigh,
      debt: p.receivable,
      lastVisit,
      status,
      note,
    }
  })

  // Urutkan mitra: yang ada transaksi atau piutang lebih dulu
  items.sort((a, b) => b.sold - a.sold || b.debt - a.debt)

  // Tetapkan ranking
  return items.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }))
}
