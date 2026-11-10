import { describe, it, expect } from 'vitest'
import {
  calculatePartnerHealth,
  filterPartners,
} from './calc'
import type { Partner } from './types'
import type { VisitRecord } from '@/features/visit/types'

describe('Partner calculations & pure functions', () => {
  const dummyPartner: Partner = {
    id: 'partner-1',
    name: 'Warung Bu Sri',
    ownerName: 'Bu Sri',
    whatsapp: '081330124471',
    address: 'Jl. Rungkut Asri Tengah No. 14, Rungkut, Surabaya',
    isActive: true,
    receivable: 183000,
  }

  const dummyVisits: VisitRecord[] = [
    {
      id: 'v-1',
      number: 'TJ-20261027-001',
      partnerId: 'partner-1',
      partnerName: 'Warung Bu Sri',
      partnerArea: 'Rungkut',
      visitedAt: '2026-10-27T08:00:00Z',
      receivedBy: 'Bu Sri',
      total: 143000,
      paid: 0,
      status: 'unpaid',
      items: [
        {
          id: 'it-1',
          productId: 'prod-1',
          productName: 'Keripik Pisang Original 100 g',
          prevStock: 30,
          remaining: 5,
          returned: 1,
          sold: 24,
          newDrop: 24,
          stockAfter: 29,
          unitPrice: 10000,
          subtotal: 240000,
        },
      ],
    },
  ]

  it('menghitung kesehatan warung dengan benar (Bagus / Pantau / Evaluasi)', () => {
    // Dengan piutang 183.000 -> tier 'pantau'
    const health = calculatePartnerHealth(dummyPartner, dummyVisits)
    expect(health.tier).toBe('pantau')
    expect(health.label).toBe('PANTAU')
    expect(health.reason).toContain('piutang')

    // Warung lunas tanpa piutang dan retur rendah -> tier 'bagus'
    const healthyPartner: Partner = { ...dummyPartner, receivable: 0 }
    const healthyHealth = calculatePartnerHealth(healthyPartner, dummyVisits)
    expect(healthyHealth.tier).toBe('bagus')
    expect(healthyHealth.label).toBe('BAGUS')

    // Warung piutang tinggi > 250.000 -> tier 'evaluasi'
    const badPartner: Partner = { ...dummyPartner, receivable: 300000 }
    const badHealth = calculatePartnerHealth(badPartner, dummyVisits)
    expect(badHealth.tier).toBe('evaluasi')
    expect(badHealth.label).toBe('EVALUASI')
  })

  it('memfilter daftar warung berdasarkan nama, tier, dan filter tanpa utang', () => {
    const partners: Partner[] = [
      dummyPartner,
      {
        id: 'partner-2',
        name: 'Kantin SMPN 3',
        ownerName: 'Pak Joko',
        whatsapp: '0812345678',
        address: 'Gubeng, Surabaya',
        isActive: true,
        receivable: 0,
      },
    ]

    // Filter nama
    const searchResult = filterPartners(partners, dummyVisits, { search: 'smpn' })
    expect(searchResult.length).toBe(1)
    expect(searchResult[0].name).toBe('Kantin SMPN 3')

    // Filter tanpa utang
    const noDebt = filterPartners(partners, dummyVisits, { showZeroDebt: true })
    expect(noDebt.length).toBe(1)
    expect(noDebt[0].name).toBe('Kantin SMPN 3')
  })
})
