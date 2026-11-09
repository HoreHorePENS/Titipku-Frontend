import { describe, it, expect } from 'vitest'
import {
  calculateDaysOverdue,
  calculateInvoicesMetrics,
  simulateFIFOAllocation,
  filterInvoices,
} from './calc'
import type { Invoice } from './types'

describe('Invoices calc & FIFO pure functions', () => {
  const refDate = new Date('2026-10-28T10:00:00Z')

  const sampleInvoices: Invoice[] = [
    {
      id: 'inv-1',
      partnerId: 'p-sri',
      partnerName: 'Warung Bu Sri',
      partnerWhatsApp: '081330124471',
      visitId: 'v-1',
      visitNumber: 'TJ-20261020-001',
      visitDate: '2026-10-20T08:00:00Z',
      receivedBy: 'Bu Sri',
      total: 100000,
      paid: 60000,
      remaining: 40000,
      status: 'partial',
      issuedAt: '2026-10-20T08:00:00Z',
      daysOverdue: 8,
    },
    {
      id: 'inv-2',
      partnerId: 'p-sri',
      partnerName: 'Warung Bu Sri',
      partnerWhatsApp: '081330124471',
      visitId: 'v-2',
      visitNumber: 'TJ-20261027-014',
      visitDate: '2026-10-27T08:00:00Z',
      receivedBy: 'Bu Sri',
      total: 143000,
      paid: 0,
      remaining: 143000,
      status: 'unpaid',
      issuedAt: '2026-10-27T08:00:00Z',
      daysOverdue: 1,
    },
    {
      id: 'inv-3',
      partnerId: 'p-darto',
      partnerName: 'Warung Pak Darto',
      partnerWhatsApp: '08123456789',
      visitId: 'v-3',
      visitNumber: 'TJ-20261007-002',
      visitDate: '2026-10-07T08:00:00Z',
      receivedBy: 'Pak Darto',
      total: 168500,
      paid: 0,
      remaining: 168500,
      status: 'unpaid',
      issuedAt: '2026-10-07T08:00:00Z',
      daysOverdue: 21,
    },
    {
      id: 'inv-4',
      partnerId: 'p-lunas',
      partnerName: 'Kantin SMPN 3',
      partnerWhatsApp: '08198765432',
      visitId: 'v-4',
      visitNumber: 'TJ-20261015-003',
      visitDate: '2026-10-15T08:00:00Z',
      receivedBy: 'Pak Joko',
      total: 200000,
      paid: 200000,
      remaining: 0,
      status: 'paid',
      issuedAt: '2026-10-15T08:00:00Z',
      daysOverdue: 0,
    },
  ]

  it('menghitung selisih hari jatuh tempo dari tanggal terbit', () => {
    const days = calculateDaysOverdue('2026-10-07T08:00:00Z', refDate)
    expect(days).toBe(21)
  })

  it('mengakumulasi metrik tagihan dengan tepat dan mendeteksi warung > 14 hari', () => {
    const metrics = calculateInvoicesMetrics(sampleInvoices, refDate)

    // Total belum lunas: 40.000 + 143.000 + 168.500 = 351.500
    expect(metrics.totalUnpaidAmount).toBe(351500)
    expect(metrics.totalUnpaidPartnersCount).toBe(2) // Bu Sri & Pak Darto
    expect(metrics.totalUnpaidInvoicesCount).toBe(3)

    // Warung menunggak > 14 hari: Pak Darto (21 hari)
    expect(metrics.overduePartners.length).toBe(1)
    expect(metrics.overduePartners[0].partnerName).toBe('Warung Pak Darto')
    expect(metrics.overduePartners[0].days).toBe(21)
  })

  it('mensimulasikan alokasi pembayaran FIFO ke nota tertua terlebih dahulu', () => {
    // Bu Sri punya 2 nota: 20 Okt (sisa 40rb) dan 27 Okt (sisa 143rb). Total utang: 183rb.
    // Bayar Rp100.000 -> melunasi nota 20 Okt (40rb), sisanya 60rb ke nota 27 Okt.
    const buSriInvoices = sampleInvoices.filter((i) => i.partnerId === 'p-sri')
    const result = simulateFIFOAllocation(100000, buSriInvoices)

    expect(result.allocations.length).toBe(2)

    // Nota tertua (20 Okt)
    expect(result.allocations[0].invoiceId).toBe('inv-1')
    expect(result.allocations[0].allocatedAmount).toBe(40000)
    expect(result.allocations[0].isFullyPaid).toBe(true)

    // Nota kedua (27 Okt)
    expect(result.allocations[1].invoiceId).toBe('inv-2')
    expect(result.allocations[1].allocatedAmount).toBe(60000)
    expect(result.allocations[1].isFullyPaid).toBe(false)
    expect(result.allocations[1].remainingOnInvoice).toBe(83000)

    // Sisa utang akhir: 183.000 - 100.000 = 83.000
    expect(result.totalRemainingDebt).toBe(83000)
    expect(result.summaryText).toContain('Melunasi nota 20 Okt (Rp40.000)')
    expect(result.summaryText).toContain('sisanya Rp60.000 ke nota 27 Okt')
  })

  it('memfilter daftar tagihan berdasarkan pencarian dan status', () => {
    // Filter status unpaid
    const unpaidOnly = filterInvoices(sampleInvoices, { statusFilter: 'unpaid' })
    expect(unpaidOnly.length).toBe(2)

    // Filter search "TJ-20261027-014"
    const searchResult = filterInvoices(sampleInvoices, { search: 'TJ-20261027-014' })
    expect(searchResult.length).toBe(1)
    expect(searchResult[0].partnerName).toBe('Warung Bu Sri')
  })
})
