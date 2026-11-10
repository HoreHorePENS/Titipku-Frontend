/**
 * Penulis PDF minimal tanpa dependensi: halaman A4, teks Helvetica/Courier, dan garis.
 * Cukup untuk dokumen sederhana seperti nota. Koordinat dalam point, y diukur dari ATAS halaman.
 */

export const A4 = { width: 595.28, height: 841.89 } as const

export type PdfFont = 'regular' | 'bold' | 'mono' | 'mono-bold'

export interface PdfText {
  x: number
  y: number
  text: string
  size?: number
  font?: PdfFont
  /** 'right': x adalah tepi kanan teks (hanya akurat untuk font mono). */
  align?: 'left' | 'right'
}

export interface PdfLine {
  x1: number
  y1: number
  x2: number
  y2: number
  width?: number
}

export interface PdfPage {
  texts: PdfText[]
  lines?: PdfLine[]
}

const FONT_RESOURCE: Record<PdfFont, string> = {
  regular: 'F1',
  bold: 'F2',
  mono: 'F3',
  'mono-bold': 'F4',
}

/** Lebar karakter Courier = 0,6 em. */
export function monoWidth(text: string, size: number): number {
  return text.length * size * 0.6
}

/** Hanya karakter Latin-1 yang aman untuk font standar PDF. */
export function sanitizePdfText(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/·|•/g, '-')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?')
}

function escapePdfString(text: string): string {
  return sanitizePdfText(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function fmt(n: number): string {
  return (Math.round(n * 100) / 100).toString()
}

function pageContent(page: PdfPage): string {
  const ops: string[] = []
  for (const line of page.lines ?? []) {
    ops.push(
      `${fmt(line.width ?? 0.6)} w ${fmt(line.x1)} ${fmt(A4.height - line.y1)} m ${fmt(line.x2)} ${fmt(A4.height - line.y2)} l S`
    )
  }
  for (const t of page.texts) {
    const size = t.size ?? 10
    const font = t.font ?? 'regular'
    const x = t.align === 'right' ? t.x - monoWidth(sanitizePdfText(t.text), size) : t.x
    ops.push(`BT /${FONT_RESOURCE[font]} ${fmt(size)} Tf ${fmt(x)} ${fmt(A4.height - t.y)} Td (${escapePdfString(t.text)}) Tj ET`)
  }
  return ops.join('\n')
}

/** Bangun file PDF (byte) dari daftar halaman. */
export function buildPdf(pages: PdfPage[], title = 'Dokumen'): Uint8Array {
  const objects: string[] = []
  const add = (body: string) => {
    objects.push(body)
    return objects.length
  }

  const catalogId = add('') // diisi setelah pages diketahui
  const pagesId = add('')
  const fonts = [
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'),
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'),
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>'),
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold /Encoding /WinAnsiEncoding >>'),
  ]
  const fontDict = `<< /F1 ${fonts[0]} 0 R /F2 ${fonts[1]} 0 R /F3 ${fonts[2]} 0 R /F4 ${fonts[3]} 0 R >>`

  const pageIds: number[] = []
  for (const page of pages.length > 0 ? pages : [{ texts: [] }]) {
    const content = pageContent(page)
    const contentId = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)
    pageIds.push(
      add(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${A4.width} ${A4.height}] ` +
          `/Resources << /Font ${fontDict} >> /Contents ${contentId} 0 R >>`
      )
    )
  }
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`
  const infoId = add(`<< /Title (${escapePdfString(title)}) /Producer (Titipku) >>`)

  let out = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((body, i) => {
    offsets.push(out.length)
    out += `${i + 1} 0 obj\n${body}\nendobj\n`
  })
  const xrefStart = out.length
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets) out += `${String(offset).padStart(10, '0')} 00000 n \n`
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`

  // Semua karakter sudah Latin-1 (1 byte), jadi panjang string = jumlah byte.
  const bytes = new Uint8Array(out.length)
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff
  return bytes
}

/** Unduh byte PDF sebagai file di browser. */
export function downloadPdf(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
