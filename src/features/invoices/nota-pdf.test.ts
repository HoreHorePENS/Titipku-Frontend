import { describe, expect, it } from 'vitest'
import { buildNotaPdf, buildNotaPdfPages, notaPdfFilename } from './nota-pdf'
import { mapStoreNota, type RawStoreNota } from './store-visits-api'
import { buildPdf, sanitizePdfText } from '@/lib/simple-pdf'

const raw: RawStoreNota = {
  id: 'v1',
  number: 'N-261110-0002',
  business_id: 'b1',
  partner_name: 'Keripik Tempe Mbak Ani',
  partner_owner_name: 'Ani Lestari',
  partner_whatsapp: '6281234500303',
  visited_at: '2026-11-10T02:00:00Z',
  received_by: 'Sri Wahyuni',
  total: 132500,
  paid: 0,
  payment_status: 'unpaid',
  public_invoice_url: 'http://localhost:3001/i/abc',
  items: [
    { product_id: 'p1', product_name: 'Keripik Tempe (Original) 100 g', prev_stock: 10, remaining: 3, returned: 0, new_drop: 7, sold: 7, stock_after: 10, unit_price: 8000, subtotal: 56000 },
  ],
}

function pdfText(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => String.fromCharCode(b)).join('')
}

describe('PDF nota penjualan', () => {
  it('memetakan respons API toko', () => {
    const nota = mapStoreNota(raw)
    expect(nota).toMatchObject({ businessName: 'Keripik Tempe Mbak Ani', paymentStatus: 'unpaid', total: 132500 })
    expect(nota.items[0]).toMatchObject({ sold: 7, prevStock: 10 })
  })

  it('menghasilkan file PDF valid berisi nomor nota, produk, dan total', () => {
    const text = pdfText(buildNotaPdf(mapStoreNota(raw), 'Warung Bu Sri'))
    expect(text.startsWith('%PDF-1.4')).toBe(true)
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true)
    expect(text).toContain('(N-261110-0002)')
    expect(text).toContain(String.raw`Keripik Tempe \(Original\) 100 g`) // tanda kurung di-escape
    expect(text).toContain('Rp132.500')
    expect(text).toContain('Warung Bu Sri')
  })

  it('offset xref menunjuk tepat ke tiap objek', () => {
    const text = pdfText(buildPdf([{ texts: [{ x: 10, y: 10, text: 'Halo' }] }]))
    const xref = text.slice(text.indexOf('xref'))
    const offsets = [...xref.matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]))
    offsets.forEach((offset, i) => expect(text.slice(offset).startsWith(`${i + 1} 0 obj`)).toBe(true))
    const startxref = Number(text.match(/startxref\n(\d+)/)![1])
    expect(text.slice(startxref).startsWith('xref')).toBe(true)
  })

  it('banyak produk dipecah ke beberapa halaman', () => {
    const many = { ...raw, items: Array.from({ length: 80 }, (_, i) => ({ ...raw.items![0], product_id: `p${i}` })) }
    expect(buildNotaPdfPages(mapStoreNota(many), 'Warung').length).toBeGreaterThan(1)
  })

  it('karakter non-Latin diganti agar aman untuk font PDF', () => {
    expect(sanitizePdfText('Nota · “A” — ✓')).toBe('Nota - "A" - ?')
    expect(notaPdfFilename(mapStoreNota(raw))).toBe('nota-N-261110-0002.pdf')
  })
})
