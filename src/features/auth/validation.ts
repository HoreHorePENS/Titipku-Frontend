/**
 * Aturan validasi akun — cermin PERSIS dari backend core-service
 * (services/core-service/internal/domain/models.go & usecase/auth.go).
 * Jika aturan backend berubah, ubah juga di sini dan di validation.test.ts.
 */

export const NAME_MIN = 2
export const NAME_MAX = 120
export const ADDRESS_MIN = 3
export const ADDRESS_MAX = 300
export const PHOTO_URL_MAX = 500
/** Backend mengukur panjang kata sandi dalam byte UTF-8 (batas bcrypt 72 byte). */
export const PASSWORD_MIN_BYTES = 8
export const PASSWORD_MAX_BYTES = 72
export const EMAIL_MAX = 254

// Sama dengan emailPattern di backend.
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
// Sama dengan whatsappPattern di backend (setelah normalisasi ke 62…).
const WHATSAPP_PATTERN = /^62[0-9]{8,15}$/

export const STORE_CATEGORIES = [
  'warung',
  'kelontong',
  'kafe',
  'resto',
  'minimarket',
  'apotek',
  'roti',
  'lainnya',
] as const

/** Trim dan rapatkan spasi berlebih: "  ibu   rina " -> "ibu rina". */
export function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

/** Trim dan huruf kecil, sama dengan domain.NormalizeEmail. */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * Normalisasi nomor WhatsApp Indonesia seperti domain.NormalizeWhatsApp:
 * buang semua non-digit, lalu 0… / 8… menjadi 62….
 * Menerima "0812-3456-7890", "+62 812 3456 7890", "6281234567890", "812 3456 7890".
 * Mengembalikan null jika tidak valid.
 */
export function normalizeWhatsApp(value: string): string | null {
  let digits = value.replace(/\D/g, '')
  if (digits.startsWith('62')) {
    // sudah format internasional
  } else if (digits.startsWith('0')) {
    digits = `62${digits.slice(1)}`
  } else if (digits.startsWith('8')) {
    digits = `62${digits}`
  } else {
    return null
  }
  return WHATSAPP_PATTERN.test(digits) ? digits : null
}

export function isValidEmail(value: string): boolean {
  const email = normalizeEmail(value)
  return email.length <= EMAIL_MAX && EMAIL_PATTERN.test(email)
}

/** Panjang dalam karakter Unicode (rune), sama dengan utf8.RuneCountInString. */
export function charLength(value: string): number {
  return Array.from(value).length
}

export function isValidName(value: string): boolean {
  const length = charLength(value.trim())
  return length >= NAME_MIN && length <= NAME_MAX
}

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length
}

export function isValidPassword(value: string): boolean {
  const bytes = utf8ByteLength(value)
  return bytes >= PASSWORD_MIN_BYTES && bytes <= PASSWORD_MAX_BYTES
}

/** Pesan yang dipakai bersama oleh validasi klien dan pemetaan error server. */
export const AUTH_MESSAGES = {
  ownerNameRequired: 'Nama wajib diisi.',
  ownerNameLength: `Nama minimal ${NAME_MIN} dan maksimal ${NAME_MAX} karakter.`,
  businessNameRequired: 'Nama usaha wajib diisi.',
  businessNameLength: `Nama usaha minimal ${NAME_MIN} dan maksimal ${NAME_MAX} karakter.`,
  storeNameRequired: 'Nama toko wajib diisi.',
  storeNameLength: `Nama toko minimal ${NAME_MIN} dan maksimal ${NAME_MAX} karakter.`,
  storeAddressLength: `Alamat toko minimal ${ADDRESS_MIN} dan maksimal ${ADDRESS_MAX} karakter.`,
  storeCategoryInvalid: 'Pilih salah satu kategori toko.',
  storePhotoUrlLength: `Tautan foto maksimal ${PHOTO_URL_MAX} karakter.`,
  storeLocationInvalid: 'Lokasi toko belum benar. Pilih ulang titik di peta.',
  emailRequired: 'Email wajib diisi.',
  emailInvalid: 'Format email belum benar. Contoh: nama@email.com',
  whatsappRequired: 'Nomor WhatsApp wajib diisi.',
  whatsappInvalid: 'Nomor WhatsApp belum benar. Contoh: 0812 3456 7890',
  passwordRequired: 'Kata sandi wajib diisi.',
  passwordLength: `Kata sandi minimal ${PASSWORD_MIN_BYTES} karakter.`,
  passwordTooLong: `Kata sandi terlalu panjang (maksimal ${PASSWORD_MAX_BYTES} karakter).`,
  confirmPasswordRequired: 'Ketik ulang kata sandi.',
  confirmPasswordMismatch: 'Kata sandi tidak sama.',
} as const

/** Teks syarat yang ditampilkan di bawah field kata sandi sejak awal. */
export const PASSWORD_REQUIREMENTS = `Minimal ${PASSWORD_MIN_BYTES} karakter, maksimal ${PASSWORD_MAX_BYTES}.`
