import { describe, expect, it } from 'vitest'
import { buildNotaWhatsAppMessage, buildNotaWhatsAppUrl, normalizeWhatsApp } from './nota-whatsapp'
import type { CreatedVisitResult } from './types'

const visit: CreatedVisitResult = {
  id: 'v1',
  number: 'N-1',
  businessName: 'Keripik Tempe Mbak Ani',
  partnerId: 'pt1',
  partnerName: 'Warung Bu Sri',
  partnerOwnerName: 'Sri Wahyuni',
  partnerWhatsApp: '081234500101',
  visitedAt: '2026-11-10T02:00:00Z',
  receivedBy: 'Sri Wahyuni',
  total: 56000,
  publicInvoiceUrl: 'https://titipku.example/i/abc',
  items: [
    { productId: 'p1', productName: 'Keripik Original', prevStock: 10, remaining: 3, returned: 0, newDrop: 7, sold: 7, stockAfter: 10, unitPrice: 8000, subtotal: 56000 },
    { productId: 'p2', productName: 'Keripik Pedas', prevStock: 5, remaining: 4, returned: 1, newDrop: 0, sold: 0, stockAfter: 4, unitPrice: 8500, subtotal: 0 },
  ],
}

describe('kirim nota ke WhatsApp toko', () => {
  it('menormalkan nomor Indonesia', () => {
    expect(normalizeWhatsApp('0812-3450-0101')).toBe('6281234500101')
    expect(normalizeWhatsApp('81234500101')).toBe('6281234500101')
    expect(normalizeWhatsApp('6281234500101')).toBe('6281234500101')
    expect(normalizeWhatsApp('123')).toBeNull()
    expect(normalizeWhatsApp('')).toBeNull()
  })

  it('pesan berisi ringkasan dan link nota publik', () => {
    const msg = buildNotaWhatsAppMessage(visit)
    expect(msg).toContain('N-1')
    expect(msg).toContain('Keripik Original: 7 x Rp8.000 = Rp56.000')
    expect(msg).toContain('Titip baru:\n- Keripik Original: 7')
    expect(msg).toContain('Retur:\n- Keripik Pedas: 1')
    expect(msg).toContain('Total tagihan: Rp56.000')
    expect(msg).toContain('Lihat nota: https://titipku.example/i/abc')
  })

  it('membuka wa.me ke nomor toko', () => {
    const url = buildNotaWhatsAppUrl(visit)!
    expect(url.startsWith('https://wa.me/6281234500101?text=')).toBe(true)
    expect(decodeURIComponent(url.split('text=')[1])).toBe(buildNotaWhatsAppMessage(visit))
    expect(buildNotaWhatsAppUrl({ ...visit, partnerWhatsApp: '' })).toBeNull()
  })
})
