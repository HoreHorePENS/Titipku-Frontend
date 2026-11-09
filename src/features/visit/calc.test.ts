import { describe, it, expect } from 'vitest'
import {
  calculateVisitItem,
  calculateVisitTotals,
  aggregateVisitItems,
  formatDateHeadersWIB,
  groupVisitsByDate,
  filterVisits,
} from './calc'
import type { VisitItem, VisitRecord } from './types'

describe('aggregateVisitItems', () => {
  it('harus menjumlahkan barang terjual, retur, dan titip baru dengan tepat', () => {
    const items: VisitItem[] = [
      {
        productId: 'p-1',
        productName: 'Keripik Original',
        prevStock: 30,
        remaining: 5,
        returned: 2,
        newDrop: 20,
        sold: 23,
        stockAfter: 25,
        unitPrice: 10000,
        subtotal: 230000,
      },
      {
        productId: 'p-2',
        productName: 'Keripik Balado',
        prevStock: 25,
        remaining: 4,
        returned: 1,
        newDrop: 26,
        sold: 19,
        stockAfter: 30,
        unitPrice: 10000,
        subtotal: 190000,
      },
    ]

    const agg = aggregateVisitItems(items)
    expect(agg.sold).toBe(42)
    expect(agg.returned).toBe(3)
    expect(agg.newDrop).toBe(46)
  })

  it('harus mengembalikan 0 jika items kosong', () => {
    expect(aggregateVisitItems([])).toEqual({ sold: 0, returned: 0, newDrop: 0 })
  })
})

describe('formatDateHeadersWIB & groupVisitsByDate', () => {
  it('harus memformat header tanggal untuk desktop dan mobile', () => {
    const date = '2026-10-27T10:00:00.000Z'
    const headers = formatDateHeadersWIB(date)
    expect(headers.desktop).toContain('27 Okt 2026')
    expect(headers.mobile).toContain('27 OKT 2026')
  })

  it('harus mengelompokkan kunjungan berdasarkan tanggal unik terbaru', () => {
    const mockVisits: VisitRecord[] = [
      {
        id: 'v-1',
        number: 'TJ-20261027-014',
        partnerId: 'w-1',
        partnerName: 'Warung Bu Sri',
        visitedAt: '2026-10-27T13:00:00.000Z',
        receivedBy: 'Bu Sri',
        total: 143000,
        paid: 0,
        status: 'unpaid',
        items: [],
      },
      {
        id: 'v-2',
        number: 'TJ-20261027-015',
        partnerId: 'w-2',
        partnerName: 'Kantin SMPN 3',
        visitedAt: '2026-10-27T15:00:00.000Z',
        receivedBy: 'Pak Budi',
        total: 200000,
        paid: 200000,
        status: 'paid',
        items: [],
      },
      {
        id: 'v-3',
        number: 'TJ-20261024-013',
        partnerId: 'w-3',
        partnerName: 'Warung Bu Hartini',
        visitedAt: '2026-10-24T10:00:00.000Z',
        receivedBy: 'Bu Hartini',
        total: 121500,
        paid: 60000,
        status: 'partial',
        items: [],
      },
    ]

    const grouped = groupVisitsByDate(mockVisits)
    expect(grouped.length).toBe(2)
    // Grup pertama tanggal 27 Okt (ada 2 kunjungan)
    expect(grouped[0].visits.length).toBe(2)
    // Grup kedua tanggal 24 Okt (ada 1 kunjungan)
    expect(grouped[1].visits.length).toBe(1)
  })
})

describe('filterVisits', () => {
  const mockVisits: VisitRecord[] = [
    {
      id: 'v-1',
      number: 'TJ-20261027-014',
      partnerId: 'w-1',
      partnerName: 'Warung Bu Sri',
      partnerArea: 'Rungkut',
      visitedAt: '2026-10-27T13:00:00.000Z',
      receivedBy: 'Bu Sri',
      total: 143000,
      paid: 0,
      status: 'unpaid',
      items: [],
    },
    {
      id: 'v-2',
      number: 'TJ-20261024-013',
      partnerId: 'w-2',
      partnerName: 'Warung Bu Hartini',
      partnerArea: 'Tenggilis',
      visitedAt: '2026-10-24T10:00:00.000Z',
      receivedBy: 'Bu Hartini',
      total: 121500,
      paid: 60000,
      status: 'partial',
      items: [],
    },
  ]

  it('harus memfilter berdasarkan partnerId', () => {
    const res = filterVisits(mockVisits, { partnerId: 'w-1' })
    expect(res.length).toBe(1)
    expect(res[0].partnerName).toBe('Warung Bu Sri')
  })

  it('harus memfilter berdasarkan kata kunci no nota atau nama warung', () => {
    const byNumber = filterVisits(mockVisits, { search: '014' })
    expect(byNumber.length).toBe(1)
    expect(byNumber[0].number).toBe('TJ-20261027-014')

    const byName = filterVisits(mockVisits, { search: 'hartini' })
    expect(byName.length).toBe(1)
    expect(byName[0].partnerName).toBe('Warung Bu Hartini')
  })
})

describe('calculateVisitItem & calculateVisitTotals', () => {
  it('menghitung sold, stockAfter, dan subtotal dengan validasi sisa + retur <= stok kemarin', () => {
    // Valid: stok kemarin 50, sisa 5, retur 3, titip baru 46 -> sold 42, stockAfter 51
    const valid = calculateVisitItem({
      prevStock: 50,
      remaining: 5,
      returned: 3,
      newDrop: 46,
      unitPrice: 10000,
    })
    expect(valid.isValid).toBe(true)
    expect(valid.sold).toBe(42)
    expect(valid.stockAfter).toBe(51)
    expect(valid.subtotal).toBe(420000)
    expect(valid.errorMessage).toBe('')

    // Invalid: stok kemarin 25, sisa 20, retur 10 -> total 30 > 25
    const invalid = calculateVisitItem({
      prevStock: 25,
      remaining: 20,
      returned: 10,
      newDrop: 20,
      unitPrice: 10000,
    })
    expect(invalid.isValid).toBe(false)
    expect(invalid.errorMessage).toContain('melebihi stok kemarin (25)')
  })

  it('mengakumulasi grandTotal termasuk piutang lama dan mendeteksi item tidak valid', () => {
    const items = [
      {
        productId: 'p1',
        productName: 'K1',
        consignPrice: 10000,
        prevStock: 50,
        remaining: 5,
        returned: 5,
        newDrop: 40,
      },
    ]

    const totals = calculateVisitTotals(items, 100000)
    // sold: 50 - 5 - 5 = 40. subtotal: 400.000. grandTotal: 400.000 + 100.000 = 500.000
    expect(totals.totalSold).toBe(40)
    expect(totals.todayTotal).toBe(400000)
    expect(totals.oldDebt).toBe(100000)
    expect(totals.grandTotal).toBe(500000)
    expect(totals.hasInvalidItems).toBe(false)
  })
})
