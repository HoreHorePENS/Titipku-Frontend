// Format rupiah sesuai aturan Titipku (contoh: Rp12.000)
export function rupiah(amount: number): string {
  const rounded = Math.round(amount || 0)
  return `Rp${rounded.toLocaleString('id-ID')}`
}

export function formatRupiah(amount: number): string {
  return rupiah(amount)
}

// Format tanggal hari ini / ISO dalam WIB (contoh: "Rabu, 28 Okt 2026")
export function tanggalWIB(date: Date | string = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

// Format tanggal WIB standar
export function formatDateWIB(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d)
}

// Format jam menit WIB dengan pemisah titik (contoh: "07.12")
export function formatJamWIB(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return formatter.format(d).replace(':', '.')
}

// Format angka dengan pemisah ribuan titik (contoh: 3000 -> "3.000", 1250000 -> "1.250.000")
export function formatRibuan(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return ''
  }
  return new Intl.NumberFormat('id-ID').format(amount)
}

// Parse string ke bilangan bulat Rupiah (contoh: "3.000" -> 3000, "Rp 12.500" -> 12500, "" -> undefined)
export function parseRibuan(value: string | undefined | null): number | undefined {
  if (value === undefined || value === null) return undefined
  const digitsOnly = value.replace(/[^\d]/g, '')
  if (digitsOnly === '') return undefined
  const parsed = parseInt(digitsOnly, 10)
  return isNaN(parsed) ? undefined : parsed
}
