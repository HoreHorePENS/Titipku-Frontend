import { ApiError } from './api-client'

/**
 * Helper penanganan error API untuk form.
 * Mengubah error apa pun (ApiError, gagal jaringan, lainnya) menjadi pesan yang
 * ramah pengguna. Tidak pernah mengembalikan pesan teknis mentah dari server.
 */

export type ApiErrorKind =
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'rate_limited'
  | 'server'
  | 'network'
  | 'unknown'

/** Kode per field dari backend (error.field_codes). */
export type FieldErrorCode =
  | 'required'
  | 'invalid_format'
  | 'invalid_length'
  | 'out_of_range'
  | 'invalid_choice'
  | 'invalid_type'
  | 'invalid_json'
  | 'unknown_field'
  | 'duplicate'
  | 'invalid'

export interface FriendlyApiError<F extends string = string> {
  kind: ApiErrorKind
  /** Pesan ringkas untuk ringkasan form atau toast. */
  message: string
  /** Pesan per field form (sudah dipetakan dari nama field API). */
  fieldErrors: Partial<Record<F, string>>
  status?: number
  code?: string
}

type FieldMessageSpec = string | Partial<Record<FieldErrorCode | 'default', string>>

export interface DescribeApiErrorOptions<F extends string> {
  /** Nama field API (snake_case) -> nama field form. Field yang tidak dipetakan diabaikan. */
  fieldMap?: Record<string, F>
  /** Pesan per field form: satu teks untuk semua kode, atau per kode. */
  fieldMessages?: Partial<Record<F, FieldMessageSpec>>
  /** Pesan per kode error backend, mis. { EMAIL_TAKEN: '…' }. Menang atas pesan bawaan status. */
  codeMessages?: Record<string, string>
  /** Pesan untuk 401. Bawaan: sesi berakhir. Form masuk memakai "Email atau kata sandi salah." */
  unauthorizedMessage?: string
}

export const API_ERROR_MESSAGES = {
  network: 'Tidak dapat terhubung. Periksa koneksi internetmu.',
  server: 'Server sedang bermasalah, coba lagi beberapa saat lagi.',
  rateLimited: 'Terlalu banyak percobaan, coba lagi sebentar lagi.',
  unauthorized: 'Sesi kamu sudah berakhir. Silakan masuk lagi.',
  forbidden: 'Kamu tidak punya akses untuk melakukan ini.',
  notFound: 'Data yang dicari tidak ditemukan.',
  conflict: 'Data ini sudah ada atau baru saja berubah. Muat ulang halaman lalu coba lagi.',
  validation: 'Ada isian yang perlu diperbaiki. Periksa kolom yang ditandai merah.',
  // Klien dan server berbeda versi (mis. field baru belum dikenal server).
  outdatedClient: 'Aplikasi sedang diperbarui. Muat ulang halaman, lalu coba lagi beberapa saat lagi.',
  badRequest: 'Permintaan belum bisa diproses. Periksa kembali isianmu lalu coba lagi.',
  unknown: 'Terjadi kesalahan. Coba lagi beberapa saat lagi.',
} as const

const GENERIC_FIELD_MESSAGES: Record<FieldErrorCode, string> = {
  required: 'Kolom ini wajib diisi.',
  invalid_format: 'Formatnya belum benar.',
  invalid_length: 'Panjang isian belum sesuai.',
  out_of_range: 'Nilainya di luar batas yang diizinkan.',
  invalid_choice: 'Pilih salah satu pilihan yang tersedia.',
  invalid_type: 'Isian ini belum benar.',
  invalid_json: 'Isian ini belum benar.',
  unknown_field: 'Isian ini belum benar.',
  duplicate: 'Isian ini tidak boleh ganda.',
  invalid: 'Isian ini belum benar.',
}

export function isNetworkError(err: unknown): boolean {
  if (err instanceof ApiError) return err.status === 0
  if (err instanceof TypeError) return true // fetch() gagal: offline, DNS, CORS, server mati
  if (err instanceof DOMException && (err.name === 'AbortError' || err.name === 'TimeoutError')) return true
  return err instanceof Error && /failed to fetch|networkerror|load failed|network request failed/i.test(err.message)
}

function toFieldCode(value: string | undefined): FieldErrorCode {
  return value && value in GENERIC_FIELD_MESSAGES ? (value as FieldErrorCode) : 'invalid'
}

function fieldMessage(spec: FieldMessageSpec | undefined, code: FieldErrorCode): string {
  if (typeof spec === 'string') return spec
  return spec?.[code] ?? spec?.default ?? GENERIC_FIELD_MESSAGES[code]
}

export function describeApiError<F extends string = string>(
  err: unknown,
  options: DescribeApiErrorOptions<F> = {}
): FriendlyApiError<F> {
  if (isNetworkError(err)) {
    return { kind: 'network', message: API_ERROR_MESSAGES.network, fieldErrors: {} }
  }

  if (!(err instanceof ApiError)) {
    return { kind: 'unknown', message: API_ERROR_MESSAGES.unknown, fieldErrors: {} }
  }

  const base = { status: err.status, code: err.code }
  const codeMessage = options.codeMessages?.[err.code]

  if (err.status === 400) {
    const fieldErrors: Partial<Record<F, string>> = {}
    const apiFields = new Set([...Object.keys(err.fields ?? {}), ...Object.keys(err.fieldCodes ?? {})])
    let unmapped = 0
    let unknownField = false

    for (const apiField of apiFields) {
      const code = toFieldCode(err.fieldCodes?.[apiField])
      const formField = options.fieldMap?.[apiField]
      if (code === 'unknown_field') unknownField = true
      if (!formField || code === 'unknown_field') {
        unmapped += 1
        continue
      }
      // Pertahankan pesan pertama jika beberapa field API memetakan ke field form yang sama.
      fieldErrors[formField] ??= fieldMessage(options.fieldMessages?.[formField], code)
    }

    const hasFieldErrors = Object.keys(fieldErrors).length > 0
    let message: string = codeMessage ?? API_ERROR_MESSAGES.validation
    if (!codeMessage && !hasFieldErrors) {
      // Kesalahan tidak bisa ditunjukkan di field mana pun.
      message = unknownField ? API_ERROR_MESSAGES.outdatedClient : API_ERROR_MESSAGES.badRequest
    } else if (!codeMessage && unmapped > 0 && unknownField) {
      message = API_ERROR_MESSAGES.outdatedClient
    }
    return { kind: 'validation', message, fieldErrors, ...base }
  }

  const byStatus = (): { kind: ApiErrorKind; message: string } => {
    if (err.status === 401) {
      return { kind: 'unauthorized', message: options.unauthorizedMessage ?? API_ERROR_MESSAGES.unauthorized }
    }
    if (err.status === 403) return { kind: 'forbidden', message: API_ERROR_MESSAGES.forbidden }
    if (err.status === 404) return { kind: 'not_found', message: API_ERROR_MESSAGES.notFound }
    if (err.status === 409) return { kind: 'conflict', message: API_ERROR_MESSAGES.conflict }
    if (err.status === 429) return { kind: 'rate_limited', message: API_ERROR_MESSAGES.rateLimited }
    if (err.status >= 500) return { kind: 'server', message: API_ERROR_MESSAGES.server }
    if (err.status >= 400) return { kind: 'unknown', message: API_ERROR_MESSAGES.badRequest }
    return { kind: 'unknown', message: API_ERROR_MESSAGES.unknown }
  }

  const resolved = byStatus()
  return { ...resolved, message: codeMessage ?? resolved.message, fieldErrors: {}, ...base }
}
