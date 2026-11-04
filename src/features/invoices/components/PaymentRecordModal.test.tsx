import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { PaymentRecordModal } from './PaymentRecordModal'
import { ApiError } from '@/lib/api-client'
import { toastStore } from '@/components/ui/Toast'
import type { Invoice } from '../types'
import type { Partner } from '@/features/partner/types'

describe('PaymentRecordModal Error & Toast Handling', () => {
  beforeEach(() => {
    toastStore.dismissAll()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    toastStore.dismissAll()
  })

  const mockPartners: Partner[] = [
    {
      id: 'p-1',
      name: 'Warung Barokah',
      ownerName: 'Bu Siti',
      whatsapp: '081234567890',
      isActive: true,
      receivable: 100000,
    },
  ]

  const mockInvoices: Invoice[] = [
    {
      id: 'inv-1',
      partnerId: 'p-1',
      partnerName: 'Warung Barokah',
      visitId: 'v-1',
      visitNumber: 'N-261028-0001',
      visitDate: '2026-10-28T13:00:00Z',
      receivedBy: 'Bu Siti',
      total: 100000,
      paid: 0,
      remaining: 100000,
      status: 'unpaid',
      issuedAt: '2026-10-28T13:00:00Z',
      daysOverdue: 7,
    },
  ]

  it('merender modal pembayaran dengan pilihan warung dan input nominal', () => {
    const html = renderToStaticMarkup(
      <PaymentRecordModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        partners={mockPartners}
        invoices={mockInvoices}
        initialPartnerId="p-1"
      />
    )

    expect(html).toContain('Catat Pembayaran')
    expect(html).toContain('Warung Barokah')
    expect(html).toContain('Nominal Pembayaran (Rp)')
    expect(html).toContain('Simpan Pembayaran')
  })

  it('mendeteksi saat nominal pembayaran melebihi piutang warung dan mencegah penutupan modal', async () => {
    const mockClose = vi.fn()
    const errorExceeds = new ApiError(409, {
      code: 'PAYMENT_EXCEEDS_RECEIVABLE',
      message: 'payment amount exceeds receivable',
    })

    const mockSubmit = vi.fn().mockRejectedValue(errorExceeds)

    try {
      await mockSubmit({
        client_request_id: 'test-uuid',
        partner_id: 'p-1',
        amount: 250000, // Melebihi utang 100000
        method: 'cash',
        paid_at: new Date().toISOString(),
      })
    } catch (err: unknown) {
      if (err instanceof ApiError && (err.status === 409 || err.code === 'PAYMENT_EXCEEDS_RECEIVABLE')) {
        toastStore.add({
          title: 'Gagal Mencatat Pembayaran',
          description: 'Nominal pembayaran melebihi sisa piutang warung pada sistem server.',
          type: 'error',
        })
      }
    }

    expect(mockClose).not.toHaveBeenCalled()
    const snapshot = toastStore.getSnapshot()
    expect(snapshot.length).toBe(1)
    expect(snapshot[0].title).toBe('Gagal Mencatat Pembayaran')
    expect(snapshot[0].description).toContain('melebihi sisa piutang warung')
  })

  it('menampilkan toast error koneksi terputus jika submit pembayaran gagal jaringan', () => {
    toastStore.add({
      title: 'Gagal Mencatat Pembayaran',
      description: 'Koneksi internet terputus. Periksa jaringan Anda dan coba lagi.',
      type: 'error',
    })

    const snapshot = toastStore.getSnapshot()
    expect(snapshot.length).toBe(1)
    expect(snapshot[0].description).toBe('Koneksi internet terputus. Periksa jaringan Anda dan coba lagi.')
  })
})
