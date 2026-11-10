import { rupiah } from '@/lib/format'
import type { CreatedVisitResult } from './types'

/** Nomor WhatsApp Indonesia -> format wa.me (62xxxxxxxx); null bila tidak valid. */
export function normalizeWhatsApp(phone: string | undefined | null): string | null {
  const digits = (phone ?? '').replace(/\D/g, '')
  if (!digits) return null
  const normalized = digits.startsWith('62') ? digits : digits.startsWith('0') ? `62${digits.slice(1)}` : digits.startsWith('8') ? `62${digits}` : null
  return normalized && /^62\d{8,15}$/.test(normalized) ? normalized : null
}

/** Ringkasan nota untuk dikirim ke toko lewat WhatsApp. */
export function buildNotaWhatsAppMessage(visit: CreatedVisitResult): string {
  const lines: string[] = [
    `Halo ${visit.partnerName}, ini nota titipan dari *${visit.businessName || 'penitip'}*.`,
    '',
    `No. nota: ${visit.number}`,
  ]
  const sold = visit.items.filter((it) => it.sold > 0)
  if (sold.length > 0) {
    lines.push('', 'Barang laku:')
    for (const it of sold) {
      lines.push(`- ${it.productName}: ${it.sold} x ${rupiah(it.unitPrice)} = ${rupiah(it.subtotal)}`)
    }
  }
  const dropped = visit.items.filter((it) => it.newDrop > 0)
  if (dropped.length > 0) {
    lines.push('', 'Titip baru:')
    for (const it of dropped) lines.push(`- ${it.productName}: ${it.newDrop}`)
  }
  const returned = visit.items.filter((it) => it.returned > 0)
  if (returned.length > 0) {
    lines.push('', 'Retur:')
    for (const it of returned) lines.push(`- ${it.productName}: ${it.returned}`)
  }
  lines.push('', `*Total tagihan: ${rupiah(visit.total)}*`)
  if (visit.publicInvoiceUrl) lines.push(`Lihat nota: ${visit.publicInvoiceUrl}`)
  lines.push('', 'Terima kasih!')
  return lines.join('\n')
}

/** Link wa.me ke nomor toko dengan ringkasan nota; null bila nomor toko tidak valid. */
export function buildNotaWhatsAppUrl(visit: CreatedVisitResult): string | null {
  const phone = normalizeWhatsApp(visit.partnerWhatsApp)
  if (!phone) return null
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildNotaWhatsAppMessage(visit))}`
}
