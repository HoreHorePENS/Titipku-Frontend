import { A4, buildPdf, monoWidth, type PdfPage, type PdfText } from '@/lib/simple-pdf'
import { STORE_NOTA_STATUS_LABEL, type StoreNota } from './store-visits-api'

const MARGIN = 48
const TABLE_SIZE = 8.5
const ROW_HEIGHT = 15
const PAGE_BOTTOM = A4.height - 70

function rp(amount: number): string {
  return `Rp${Math.round(amount).toLocaleString('id-ID')}`
}

function tanggal(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' WIB'
}

function fit(text: string, maxChars: number): string {
  return text.length <= maxChars ? text : `${text.slice(0, Math.max(0, maxChars - 3))}...`
}

/** Kolom tabel (font mono): x = tepi kiri (teks) atau tepi kanan (angka). */
const COLUMNS = [
  { key: 'name', label: 'Produk', x: MARGIN, align: 'left' as const },
  { key: 'prev', label: 'Stok', x: MARGIN + 238, align: 'right' as const },
  { key: 'remaining', label: 'Sisa', x: MARGIN + 270, align: 'right' as const },
  { key: 'returned', label: 'Retur', x: MARGIN + 304, align: 'right' as const },
  { key: 'sold', label: 'Laku', x: MARGIN + 336, align: 'right' as const },
  { key: 'newDrop', label: 'Titip', x: MARGIN + 372, align: 'right' as const },
  { key: 'price', label: 'Harga', x: MARGIN + 425, align: 'right' as const },
  { key: 'subtotal', label: 'Subtotal', x: A4.width - MARGIN, align: 'right' as const },
]
const NAME_MAX_CHARS = Math.floor((COLUMNS[1].x - monoWidth('0000', TABLE_SIZE) - MARGIN) / (TABLE_SIZE * 0.6))

/** Susun halaman PDF nota penjualan konsinyasi. */
export function buildNotaPdfPages(nota: StoreNota, storeName: string): PdfPage[] {
  const pages: PdfPage[] = []
  let page: PdfPage = { texts: [], lines: [] }
  let y = MARGIN

  const text = (t: PdfText) => page.texts.push(t)
  const rule = (atY: number, width = 0.6) => page.lines!.push({ x1: MARGIN, y1: atY, x2: A4.width - MARGIN, y2: atY, width })

  const tableHeader = () => {
    for (const col of COLUMNS) {
      text({ x: col.x, y, text: col.label, size: TABLE_SIZE, font: 'mono-bold', align: col.align })
    }
    rule(y + 5)
    y += ROW_HEIGHT + 2
  }

  // Kepala nota
  text({ x: MARGIN, y: y + 6, text: 'NOTA PENJUALAN KONSINYASI', size: 16, font: 'bold' })
  y += 30
  const meta: Array<[string, string]> = [
    ['No. nota', nota.number],
    ['Tanggal', tanggal(nota.visitedAt)],
    ['Penitip', nota.ownerName && nota.ownerName !== nota.businessName ? `${nota.businessName} (${nota.ownerName})` : nota.businessName],
    ['Toko', storeName],
    ['Diterima oleh', nota.receivedBy || '-'],
    ['Status', STORE_NOTA_STATUS_LABEL[nota.paymentStatus]],
  ]
  for (const [label, value] of meta) {
    text({ x: MARGIN, y, text: label, size: 10, font: 'bold' })
    text({ x: MARGIN + 90, y, text: fit(value, 80), size: 10 })
    y += 15
  }
  y += 10
  tableHeader()

  // Baris produk (pindah halaman bila penuh)
  for (const item of nota.items) {
    if (y > PAGE_BOTTOM) {
      pages.push(page)
      page = { texts: [], lines: [] }
      y = MARGIN
      tableHeader()
    }
    const values: Record<string, string> = {
      name: fit(item.productName, NAME_MAX_CHARS),
      prev: String(item.prevStock),
      remaining: String(item.remaining),
      returned: String(item.returned),
      sold: String(item.sold),
      newDrop: String(item.newDrop),
      price: rp(item.unitPrice),
      subtotal: rp(item.subtotal),
    }
    for (const col of COLUMNS) {
      text({ x: col.x, y, text: values[col.key], size: TABLE_SIZE, font: 'mono', align: col.align })
    }
    y += ROW_HEIGHT
  }
  if (nota.items.length === 0) {
    text({ x: MARGIN, y, text: 'Tidak ada rincian produk.', size: TABLE_SIZE, font: 'mono' })
    y += ROW_HEIGHT
  }

  // Ringkasan
  if (y > PAGE_BOTTOM - 70) {
    pages.push(page)
    page = { texts: [], lines: [] }
    y = MARGIN
  }
  rule(y - 6)
  y += 8
  const right = A4.width - MARGIN
  const totals: Array<[string, string]> = [
    ['Total tagihan', rp(nota.total)],
    ['Dibayar', rp(nota.paid)],
    ['Sisa tagihan', rp(Math.max(0, nota.total - nota.paid))],
  ]
  for (const [label, value] of totals) {
    text({ x: right - 190, y, text: label, size: 10, font: 'bold' })
    text({ x: right, y, text: value, size: 10, font: 'mono-bold', align: 'right' })
    y += 15
  }

  y += 16
  if (nota.publicInvoiceUrl) {
    text({ x: MARGIN, y, text: `Nota online: ${nota.publicInvoiceUrl}`, size: 8.5 })
    y += 12
  }
  text({ x: MARGIN, y, text: 'Nota ini dibuat oleh penitip melalui Titipku.', size: 8.5 })

  pages.push(page)
  return pages
}

export function buildNotaPdf(nota: StoreNota, storeName: string): Uint8Array {
  return buildPdf(buildNotaPdfPages(nota, storeName), `Nota ${nota.number}`)
}

export function notaPdfFilename(nota: StoreNota): string {
  return `nota-${nota.number.replace(/[^A-Za-z0-9-]+/g, '-')}.pdf`
}
