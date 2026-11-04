import type { Product, ProductFilterOptions, CatalogStats } from './types'

/**
 * Memfilter daftar produk berdasarkan teks pencarian dan filter status (semua / aktif / nonaktif).
 */
export function filterProducts(
  products: Product[],
  options: ProductFilterOptions
): Product[] {
  const { search, statusFilter } = options
  const normalizedSearch = search.trim().toLowerCase()

  return products.filter((p) => {
    // 1. Filter status
    if (statusFilter === 'active' && !p.isActive) return false
    if (statusFilter === 'inactive' && p.isActive) return false

    // 2. Filter teks pencarian (nama produk)
    if (normalizedSearch) {
      const matchName = p.name.toLowerCase().includes(normalizedSearch)
      if (!matchName) return false
    }

    return true
  })
}

/**
 * Menghitung selisih keuntungan (margin) warung mitra antara harga eceran dan harga titip konsinyasi.
 */
export function calculateProductMargin(
  consignPrice: number,
  retailPrice: number
): { marginRp: number; marginPct: number } {
  const marginRp = Math.max(0, retailPrice - consignPrice)
  if (consignPrice <= 0 || retailPrice <= 0) {
    return { marginRp: 0, marginPct: 0 }
  }
  const marginPct = Math.round((marginRp / retailPrice) * 100)
  return { marginRp, marginPct }
}

/**
 * Menghitung statistik ringkasan katalog produk:
 * - Total produk
 * - Jumlah produk aktif & nonaktif
 * - Rata-rata harga konsinyasi
 * - Rata-rata margin keuntungan warung
 */
export function calculateCatalogStats(products: Product[]): CatalogStats {
  const total = products.length
  if (total === 0) {
    return {
      total: 0,
      activeCount: 0,
      inactiveCount: 0,
      averageConsignPrice: 0,
      averageMargin: 0,
    }
  }

  let activeCount = 0
  let totalConsign = 0
  let totalMargin = 0

  for (const p of products) {
    if (p.isActive) activeCount++
    totalConsign += p.consignPrice
    const { marginRp } = calculateProductMargin(p.consignPrice, p.retailPrice)
    totalMargin += marginRp
  }

  return {
    total,
    activeCount,
    inactiveCount: total - activeCount,
    averageConsignPrice: Math.round(totalConsign / total),
    averageMargin: Math.round(totalMargin / total),
  }
}
