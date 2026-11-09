import { describe, it, expect } from 'vitest'
import {
  filterProducts,
  calculateProductMargin,
  calculateCatalogStats,
} from './calc'
import type { Product } from './types'

const mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'Keripik Pisang Coklat 100g',
    consignPrice: 12000,
    retailPrice: 15000,
    shelfLifeDays: 30,
    isActive: true,
  },
  {
    id: 'p2',
    name: 'Keripik Pisang Original 100g',
    consignPrice: 10000,
    retailPrice: 12500,
    shelfLifeDays: 45,
    isActive: true,
  },
  {
    id: 'p3',
    name: 'Kacang Bawang Renyah',
    consignPrice: 8000,
    retailPrice: 10000,
    shelfLifeDays: 60,
    isActive: false,
  },
]

describe('calculateProductMargin', () => {
  it('menghitung nominal dan persentase margin warung dengan tepat', () => {
    const result = calculateProductMargin(12000, 15000)
    expect(result.marginRp).toBe(3000)
    expect(result.marginPct).toBe(20) // 3000 / 15000 = 20%
  })

  it('mengembalikan 0 jika harga nol atau negatif', () => {
    const result = calculateProductMargin(0, 0)
    expect(result.marginRp).toBe(0)
    expect(result.marginPct).toBe(0)
  })
})

describe('filterProducts', () => {
  it('menyaring berdasarkan pencarian teks case-insensitive', () => {
    const filtered = filterProducts(mockProducts, {
      search: 'PISANG',
      statusFilter: 'all',
    })
    expect(filtered.length).toBe(2)
    expect(filtered.map((p) => p.id)).toEqual(['p1', 'p2'])
  })

  it('menyaring hanya produk aktif', () => {
    const active = filterProducts(mockProducts, {
      search: '',
      statusFilter: 'active',
    })
    expect(active.length).toBe(2)
    expect(active.every((p) => p.isActive)).toBe(true)
  })

  it('menyaring hanya produk nonaktif', () => {
    const inactive = filterProducts(mockProducts, {
      search: '',
      statusFilter: 'inactive',
    })
    expect(inactive.length).toBe(1)
    expect(inactive[0].id).toBe('p3')
  })
})

describe('calculateCatalogStats', () => {
  it('menghitung ringkasan statistik katalog dengan benar', () => {
    const stats = calculateCatalogStats(mockProducts)
    expect(stats.total).toBe(3)
    expect(stats.activeCount).toBe(2)
    expect(stats.inactiveCount).toBe(1)
    expect(stats.averageConsignPrice).toBe(10000) // (12000 + 10000 + 8000) / 3
    expect(stats.averageMargin).toBe(2500) // (3000 + 2500 + 2000) / 3
  })

  it('mengembalikan nol untuk daftar kosong', () => {
    const stats = calculateCatalogStats([])
    expect(stats.total).toBe(0)
    expect(stats.activeCount).toBe(0)
    expect(stats.averageConsignPrice).toBe(0)
    expect(stats.averageMargin).toBe(0)
  })
})
