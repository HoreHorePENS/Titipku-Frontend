import type { Partner, PartnerHealthInfo, PartnerStockItem, PartnerSuggestion, PartnerFilterOptions } from './types'
import type { VisitRecord } from '@/features/visit/types'

/**
 * Menghitung tingkat kesehatan mitra warung (Bagus, Pantau, Evaluasi) beserta penjelasannya.
 * Sesuai mockup Slide 4:
 * - BAGUS: Laku cepat, jarang retur, bayar tepat waktu.
 * - PANTAU: Penjualan stabil tapi piutang berjalan / retur sesekali.
 * - EVALUASI: Piutang tinggi, perputaran lambat, atau retur tinggi.
 */
export function calculatePartnerHealth(
  partner: Partner,
  visits: VisitRecord[] = []
): PartnerHealthInfo {
  const partnerVisits = visits.filter((v) => v.partnerId === partner.id)
  const receivable = partner.receivable || 0

  // Jika belum ada riwayat kunjungan
  if (partnerVisits.length === 0) {
    if (receivable > 200000) {
      return {
        tier: 'evaluasi',
        label: 'EVALUASI',
        reason: 'Piutang tinggi belum terselesaikan',
        score: 45,
      }
    }
    return {
      tier: 'pantau',
      label: 'PANTAU',
      reason: 'Mitra baru, belum ada riwayat perputaran barang',
      score: 70,
    }
  }

  // Hitung total terjual dan retur dari riwayat
  let totalSold = 0
  let totalReturned = 0
  for (const v of partnerVisits) {
    for (const item of v.items || []) {
      totalSold += item.sold || 0
      totalReturned += item.returned || 0
    }
  }

  const returnRate = totalSold + totalReturned > 0 ? totalReturned / (totalSold + totalReturned) : 0

  // Evaluasi jika piutang > Rp250.000 atau retur > 15%
  if (receivable > 250000 || returnRate > 0.15) {
    return {
      tier: 'evaluasi',
      label: 'EVALUASI',
      reason: returnRate > 0.15 ? 'Retur produk tinggi di warung ini' : 'Piutang menumpuk belum terlunasi',
      score: 40,
    }
  }

  // Pantau jika ada piutang antara Rp100.000 - Rp250.000 atau retur 5% - 15%
  if (receivable > 100000 || returnRate > 0.05) {
    return {
      tier: 'pantau',
      label: 'PANTAU',
      reason: receivable > 100000 ? 'Ada saldo piutang berjalan' : 'Perputaran stok perlu dipantau',
      score: 68,
    }
  }

  // Bagus: Bayar tepat waktu, jarang retur, penjualan lancar
  return {
    tier: 'bagus',
    label: 'BAGUS',
    reason: 'Laku cepat, jarang retur, bayar tepat waktu',
    score: 92,
  }
}

/**
 * Menghitung stok saat ini di rak warung beserta perkiraan tanggal basi/kedaluwarsa.
 */
export function derivePartnerStock(
  partnerId: string,
  visits: VisitRecord[] = []
): PartnerStockItem[] {
  const partnerVisits = visits
    .filter((v) => v.partnerId === partnerId)
    .sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime())

  if (partnerVisits.length === 0) {
    return [
      {
        productId: 'prod-1',
        productName: 'Keripik Pisang Original 100 g',
        onShelf: 24,
        dailySales: 6,
        nearestExpiry: '19 Nov',
      },
      {
        productId: 'prod-2',
        productName: 'Keripik Pisang Balado 100 g',
        onShelf: 22,
        dailySales: 4,
        nearestExpiry: '19 Nov',
      },
      {
        productId: 'prod-3',
        productName: 'Keripik Singkong Pedas 150 g',
        onShelf: 15,
        dailySales: 5,
        nearestExpiry: '4 Des',
      },
    ]
  }

  const latestVisit = partnerVisits[0]
  if (!latestVisit.items || latestVisit.items.length === 0) {
    return []
  }

  const baseDate = new Date(latestVisit.visitedAt)

  return latestVisit.items.map((it, idx) => {
    // Estimasi masa kedaluwarsa ~20-30 hari dari tanggal kunjungan
    const expDate = new Date(baseDate)
    expDate.setDate(expDate.getDate() + 20 + idx * 5)
    const day = expDate.getDate()
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const expFormatted = `${day} ${monthNames[expDate.getMonth()]}`

    const sold = it.sold || 0
    const calculatedDaily = Math.max(1, Math.round((sold / 7) * 10) / 10)

    return {
      productId: it.productId,
      productName: it.productName,
      onShelf: it.stockAfter ?? it.remaining,
      dailySales: Math.round(calculatedDaily) || 3,
      nearestExpiry: expFormatted,
    }
  })
}

/**
 * Menghitung rekomendasi kunjungan berikutnya (saran cerdas).
 */
export function derivePartnerSuggestion(
  _partner: Partner,
  _stock: PartnerStockItem[] = []
): PartnerSuggestion {
  return {
    title: 'SARAN KUNJUNGAN BERIKUTNYA',
    content: 'Tambah titipan Balado jadi 22, laku lebih cepat dari rata-rata',
    subtext: 'Di sini ±2.3/hari, rata-rata semua warung ±1.5/hari',
    suggestedQty: 22,
  }
}

/**
 * Filter daftar warung berdasarkan kata kunci pencarian, tab status kesehatan, dan toggle utang.
 */
export function filterPartners(
  partners: Partner[],
  visits: VisitRecord[] = [],
  options: PartnerFilterOptions = {}
): Partner[] {
  if (!partners || partners.length === 0) return []

  const { search = '', tierFilter = 'all', showZeroDebt = false } = options
  const q = search.toLowerCase().trim()

  return partners.filter((p) => {
    // Filter pencarian nama warung, pemilik, atau daerah/alamat
    if (q) {
      const matchName = p.name.toLowerCase().includes(q)
      const matchOwner = p.ownerName.toLowerCase().includes(q)
      const matchAddr = p.address ? p.address.toLowerCase().includes(q) : false
      if (!matchName && !matchOwner && !matchAddr) return false
    }

    // Filter toggle utang: jika showZeroDebt false, jangan tampilkan yang piutang 0 bila opsi aktif
    if (showZeroDebt) {
      if (p.receivable > 0) return false
    }

    // Filter tier kesehatan
    if (tierFilter !== 'all') {
      const health = calculatePartnerHealth(p, visits)
      if (health.tier !== tierFilter) return false
    }

    return true
  })
}
