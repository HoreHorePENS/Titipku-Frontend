import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getStoreDigitalInvoices,
  createStoreDigitalInvoice,
} from './digital-invoices'
import { setAuthToken } from '@/lib/api-client'
import { fakeAccountToken } from '@/lib/test-account-token'

describe('digital-invoices', () => {
  let store: Record<string, string> = {}

  beforeEach(() => {
    store = {}
    setAuthToken(fakeAccountToken('user-a'))
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value
      },
      clear: () => {
        store = {}
      },
    })
  })

  it('mengembalikan array kosong jika belum ada nota tersimpan', () => {
    expect(getStoreDigitalInvoices()).toEqual([])
  })

  it('berhasil membuat dan menyimpan nota digital penjualan baru', () => {
    const invoice = createStoreDigitalInvoice({
      partnerId: 'req-1',
      partnerName: 'Dapur Keripik Bu Rini',
      partnerWhatsApp: '08123456789',
      businessName: 'Warung Berkah Jaya',
      receivedBy: 'Warung Berkah Jaya',
      status: 'paid',
      notes: 'Penjualan festival minggu ini',
      items: [
        {
          productId: 'prod-1',
          productName: 'Keripik Pisang Cokelat 150g',
          unitPrice: 12000,
          sold: 10,
          returned: 0,
        },
        {
          productId: 'prod-2',
          productName: 'Keripik Singkong Balado 200g',
          unitPrice: 10000,
          sold: 5,
          returned: 1,
        },
      ],
    })

    expect(invoice.id).toContain('store-inv-')
    expect(invoice.number).toContain('NOTA-')
    expect(invoice.total).toBe(10 * 12000 + 5 * 10000) // 120.000 + 50.000 = 170.000
    expect(invoice.paid).toBe(170000)
    expect(invoice.status).toBe('paid')
    expect(invoice.items.length).toBe(2)

    const stored = getStoreDigitalInvoices()
    expect(stored.length).toBe(1)
    expect(stored[0].id).toBe(invoice.id)
  })

  it('menangani nota belum lunas dengan benar', () => {
    const invoice = createStoreDigitalInvoice({
      partnerId: 'req-2',
      partnerName: 'Sambal Oma',
      businessName: 'Toko Kelontong Makmur',
      receivedBy: 'Toko Kelontong Makmur',
      status: 'unpaid',
      items: [
        {
          productId: 'prod-3',
          productName: 'Sambal Bawang Botol',
          unitPrice: 20000,
          sold: 4,
        },
      ],
    })

    expect(invoice.total).toBe(80000)
    expect(invoice.paid).toBe(0)
    expect(invoice.status).toBe('unpaid')
  })
})
