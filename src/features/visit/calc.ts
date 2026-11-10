import type { VisitItem, VisitRecord, GroupedVisits, VisitFilterOptions, VisitItemInput } from './types'

export interface CalcItemResult {
  sold: number
  stockAfter: number
  subtotal: number
  isValid: boolean
  errorMessage: string
}

/**
 * Menghitung pergerakan stok satu produk konsinyasi dan mengevaluasi validitasnya.
 * Sesuai aturan:
 * - sold = prevStock - remaining - returned
 * - stockAfter = remaining + newDrop
 * - valid hanya jika: (remaining + returned) <= prevStock (jika prevStock > 0)
 */
export function calculateVisitItem(item: {
  prevStock: number
  remaining: number
  returned: number
  newDrop: number
  unitPrice: number
}): CalcItemResult {
  const { prevStock, remaining, returned, newDrop, unitPrice } = item

  // Jika stok kemarin > 0, jumlah sisa di rak + barang retur tidak boleh melebihi stok kemarin
  const isExceeded = prevStock > 0 && remaining + returned > prevStock
  const isValid = !isExceeded

  const sold = isValid ? Math.max(0, prevStock - remaining - returned) : 0
  const stockAfter = remaining + newDrop
  const subtotal = sold * unitPrice

  const errorMessage = isExceeded
    ? `Sisa (${remaining}) + retur (${returned}) melebihi stok kemarin (${prevStock}). Hitung ulang rak.`
    : ''

  return {
    sold,
    stockAfter,
    subtotal,
    isValid,
    errorMessage,
  }
}

export interface VisitTotalsResult {
  totalSold: number
  totalReturned: number
  totalNewDrop: number
  todayTotal: number
  oldDebt: number
  grandTotal: number
  hasInvalidItems: boolean
}

/**
 * Menghitung akumulasi total seluruh produk pada draf kunjungan.
 */
export function calculateVisitTotals(
  items: VisitItemInput[],
  partnerReceivable = 0
): VisitTotalsResult {
  let totalSold = 0
  let totalReturned = 0
  let totalNewDrop = 0
  let todayTotal = 0
  let hasInvalidItems = false

  for (const item of items) {
    const calc = calculateVisitItem({
      prevStock: item.prevStock,
      remaining: item.remaining,
      returned: item.returned,
      newDrop: item.newDrop,
      unitPrice: item.consignPrice,
    })

    if (!calc.isValid) {
      hasInvalidItems = true
    }

    totalSold += calc.sold
    totalReturned += item.returned
    totalNewDrop += item.newDrop
    todayTotal += calc.subtotal
  }

  const oldDebt = Math.max(0, partnerReceivable)
  const grandTotal = todayTotal + oldDebt

  return {
    totalSold,
    totalReturned,
    totalNewDrop,
    todayTotal,
    oldDebt,
    grandTotal,
    hasInvalidItems,
  }
}

/**
 * Menghitung rekomendasi kuantitas titip baru (chips saran)
 */
export function getDropSuggestions(
  prevStock: number,
  remaining = prevStock,
  returned = 0
): Array<{ label: string; amount: number }> {
  if (prevStock <= 0) {
    return [
      { label: 'Titip 10', amount: 10 },
      { label: 'Titip 20', amount: 20 },
      { label: 'Titip 30', amount: 30 },
    ]
  }

  // Dihitung dari isian kunjungan ini (bukan angka contoh).
  const sold = Math.max(0, prevStock - remaining - returned)
  const refill = Math.max(0, prevStock - remaining)
  const suggestions: Array<{ label: string; amount: number }> = []
  if (sold > 0) suggestions.push({ label: `Ganti yang laku (${sold})`, amount: sold })
  // Titip baru agar stok di rak kembali seperti kemarin.
  if (refill > 0 && refill !== sold) suggestions.push({ label: `Isi kembali ke ${prevStock} (${refill})`, amount: refill })
  if (suggestions.length === 0) suggestions.push({ label: `Titip ${prevStock}`, amount: prevStock })
  return suggestions
}

/**
 * Menghitung total barang terjual, retur, dan titip baru dari rincian item kunjungan.
 */
export function aggregateVisitItems(items: VisitItem[]) {
  if (!items || items.length === 0) {
    return { sold: 0, returned: 0, newDrop: 0 }
  }

  return items.reduce(
    (acc, item) => ({
      sold: acc.sold + (item.sold || 0),
      returned: acc.returned + (item.returned || 0),
      newDrop: acc.newDrop + (item.newDrop || 0),
    }),
    { sold: 0, returned: 0, newDrop: 0 }
  )
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
]

const DAY_NAMES = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
]

/**
 * Memformat tanggal ke header baku Titipku (contoh: "Selasa, 27 Okt 2026" dan "SELASA, 27 OKT 2026").
 */
export function formatDateHeadersWIB(dateStr: string) {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) {
    return {
      dateKey: dateStr,
      desktop: dateStr,
      mobile: dateStr.toUpperCase(),
    }
  }

  const dayName = DAY_NAMES[d.getDay()]
  const dateNum = d.getDate()
  const monthName = MONTH_NAMES[d.getMonth()]
  const yearNum = d.getFullYear()

  const desktop = `${dayName}, ${dateNum} ${monthName} ${yearNum}`
  const mobile = desktop.toUpperCase()

  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dt = String(dateNum).padStart(2, '0')
  const dateKey = `${yearNum}-${m}-${dt}`

  return { dateKey, desktop, mobile }
}

/**
 * Mengelompokkan daftar kunjungan per tanggal (terbaru di atas).
 */
export function groupVisitsByDate(visits: VisitRecord[]): GroupedVisits[] {
  if (!visits || visits.length === 0) return []

  const sorted = [...visits].sort((a, b) => {
    return new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime()
  })

  const groupsMap = new Map<string, { mobile: string; desktop: string; list: VisitRecord[] }>()

  for (const visit of sorted) {
    const { dateKey, mobile, desktop } = formatDateHeadersWIB(visit.visitedAt)

    if (!groupsMap.has(dateKey)) {
      groupsMap.set(dateKey, { mobile, desktop, list: [] })
    }
    groupsMap.get(dateKey)!.list.push(visit)
  }

  return Array.from(groupsMap.entries()).map(([dateKey, val]) => ({
    dateKey,
    dateHeaderMobile: val.mobile,
    dateHeaderDesktop: val.desktop,
    visits: val.list,
  }))
}

/**
 * Memfilter kunjungan berdasarkan partner, rentang tanggal, dan teks pencarian.
 */
export function filterVisits(visits: VisitRecord[], filters: VisitFilterOptions): VisitRecord[] {
  if (!visits) return []

  return visits.filter((v) => {
    if (filters.partnerId && filters.partnerId !== 'all') {
      if (v.partnerId !== filters.partnerId) return false
    }

    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim()
      const matchNumber = v.number.toLowerCase().includes(q)
      const matchName = v.partnerName.toLowerCase().includes(q)
      const matchArea = v.partnerArea ? v.partnerArea.toLowerCase().includes(q) : false
      if (!matchNumber && !matchName && !matchArea) return false
    }

    return true
  })
}
