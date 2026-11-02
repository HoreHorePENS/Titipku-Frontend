import { describe, it, expect } from 'vitest'
import {
  formatShortDateWIB,
  generate30DaysSales,
  calculateMonthSalesSummary,
  calculatePartnerPerformances,
} from './calc'
import type { VisitRecord } from '@/features/visit/types'
import type { PartnerRecord } from './types'

describe('Dashboard pure calculations', () => {
  it('formats short date in WIB properly', () => {
    expect(formatShortDateWIB('2026-10-28T10:00:00+07:00')).toBe('28 Okt')
    expect(formatShortDateWIB('invalid')).toBe('')
  })

  it('generates 30 days series from real visits', () => {
    const visits: VisitRecord[] = [
      {
        id: 'v1',
        number: 'N-001',
        partnerId: 'p1',
        partnerName: 'Warung A',
        visitedAt: '2026-10-28T10:00:00+07:00',
        receivedBy: 'A',
        total: 150_000,
        paid: 0,
        status: 'unpaid',
        items: [],
      },
    ]

    const refDate = new Date('2026-10-28T12:00:00+07:00')
    const series = generate30DaysSales(visits, refDate)

    expect(series).toHaveLength(30)
    // Titik terakhir (hari ini) bernilai 150_000
    expect(series[29].amount).toBe(150_000)
    expect(series[29].date).toBe('28 Okt')
  })

  it('calculates monthly sales and return rates', () => {
    const visits: VisitRecord[] = [
      {
        id: 'v1',
        number: 'N-001',
        partnerId: 'p1',
        partnerName: 'Warung A',
        visitedAt: '2026-10-15T10:00:00+07:00',
        receivedBy: 'A',
        total: 200_000,
        paid: 200_000,
        status: 'paid',
        items: [
          {
            productId: 'pr1',
            productName: 'Keripik',
            prevStock: 50,
            remaining: 5,
            returned: 5,
            newDrop: 40,
            sold: 40,
            stockAfter: 45,
            unitPrice: 5000,
            subtotal: 200_000,
          },
        ],
      },
    ]

    const summary = calculateMonthSalesSummary(visits, 9, 2026) // Bulan ke-9 adalah Oktober (0-indexed)
    expect(summary.totalRevenue).toBe(200_000)
    expect(summary.totalSoldPackages).toBe(40)
    expect(summary.totalReturnedPackages).toBe(5)
    // 5 / (40 + 5) = 11.1%
    expect(summary.returnRatePercentage).toBe(11.1)
  })

  it('ranks partner performance and derives statuses correctly', () => {
    const partners: PartnerRecord[] = [
      {
        id: 'p1',
        name: 'Warung A',
        owner_name: 'Pak A',
        whatsapp: '6281',
        address: 'Rungkut, Surabaya',
        is_active: true,
        receivable: 600_000,
        created_at: '',
        updated_at: '',
      },
      {
        id: 'p2',
        name: 'Warung B',
        owner_name: 'Pak B',
        whatsapp: '6282',
        address: 'Gubeng',
        is_active: true,
        receivable: 0,
        created_at: '',
        updated_at: '',
      },
    ]

    const visits: VisitRecord[] = [
      {
        id: 'v1',
        number: 'N-1',
        partnerId: 'p2',
        partnerName: 'Warung B',
        visitedAt: '2026-10-20T10:00:00Z',
        receivedBy: 'B',
        total: 500_000,
        paid: 500_000,
        status: 'paid',
        items: [
          {
            productId: 'pr1',
            productName: 'K',
            prevStock: 50,
            remaining: 0,
            returned: 0,
            newDrop: 50,
            sold: 50,
            stockAfter: 50,
            unitPrice: 10_000,
            subtotal: 500_000,
          },
        ],
      },
    ]

    const ranked = calculatePartnerPerformances(partners, visits)
    expect(ranked[0].name).toBe('Warung B')
    expect(ranked[0].rank).toBe(1)
    expect(ranked[0].status).toBe('BAGUS')

    expect(ranked[1].name).toBe('Warung A')
    expect(ranked[1].rank).toBe(2)
    expect(ranked[1].status).toBe('EVALUASI') // piutang > 500k
  })
})
