import { getAuthToken } from './api-client'

/**
 * Penyimpanan localStorage per akun: key "<base>:<userId>".
 * Data satu akun tidak boleh terlihat oleh akun lain di browser yang sama.
 *
 * ID akun diambil dari klaim `sub` token sesi (tersedia sinkron, juga setelah reload).
 * Token tidak diverifikasi di sini: hanya dipakai sebagai nama ruang penyimpanan;
 * otorisasi tetap di backend.
 */

/** Data milik akun yang disimpan di localStorage. */
export const ACCOUNT_STORAGE_KEYS = {
  customProfile: 'titipku_custom_profile',
  notificationsRead: 'titipku_notifications_read_v2',
  visitDraft: 'titipku_visit_draft_v1',
} as const

export type AccountStorageBase = (typeof ACCOUNT_STORAGE_KEYS)[keyof typeof ACCOUNT_STORAGE_KEYS]

function decodeBase64Url(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return atob(padded)
}

/** ID akun yang sedang login (klaim `sub` token), atau null bila tidak ada sesi. */
export function currentAccountId(): string | null {
  const token = getAuthToken()
  const payload = token?.split('.')[1]
  if (!payload) return null
  try {
    const claims: unknown = JSON.parse(decodeBase64Url(payload))
    const sub = claims && typeof claims === 'object' ? (claims as { sub?: unknown }).sub : undefined
    return typeof sub === 'string' && sub.length > 0 ? sub : null
  } catch {
    return null
  }
}

export function accountStorageKey(base: AccountStorageBase, accountId: string): string {
  return `${base}:${accountId}`
}

function getStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

/**
 * Pindahkan data lama tanpa ID akun (sebelum penyimpanan per akun) ke akun ini,
 * lalu hapus key lama. Akun pertama yang login/mengakses data tersebut yang mendapatkannya;
 * bila akun ini sudah punya data sendiri, data lama tidak menimpanya dan tetap dihapus.
 */
/** Key lama yang tidak dipakai lagi (nota buatan toko kini hanya di backend). */
const OBSOLETE_KEY_PREFIXES = ['titipku_digital_invoices'] as const

/** Hapus sisa data lama yang tidak dipakai lagi dari localStorage (semua akun). */
export function purgeObsoleteStorage(): void {
  const storage = getStorage()
  if (!storage) return
  try {
    const keys: string[] = []
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key && OBSOLETE_KEY_PREFIXES.some((prefix) => key === prefix || key.startsWith(`${prefix}:`))) keys.push(key)
    }
    keys.forEach((key) => storage.removeItem(key))
  } catch {
    // Storage tidak tersedia: abaikan.
  }
}

export function migrateLegacyAccountData(accountId: string, bases: readonly AccountStorageBase[] = Object.values(ACCOUNT_STORAGE_KEYS)) {
  const storage = getStorage()
  if (!storage) return
  purgeObsoleteStorage()
  for (const base of bases) {
    try {
      const legacy = storage.getItem(base)
      if (legacy === null) continue
      const scopedKey = accountStorageKey(base, accountId)
      if (storage.getItem(scopedKey) === null) storage.setItem(scopedKey, legacy)
      storage.removeItem(base)
    } catch {
      // Storage penuh/tidak tersedia: biarkan data lama, coba lagi lain kali.
    }
  }
}

/** Baca data akun yang sedang login. Null bila tidak ada sesi atau belum ada data. */
export function readAccountItem(base: AccountStorageBase): string | null {
  const storage = getStorage()
  const accountId = currentAccountId()
  if (!storage || !accountId) return null
  migrateLegacyAccountData(accountId, [base])
  try {
    return storage.getItem(accountStorageKey(base, accountId))
  } catch {
    return null
  }
}

/** Tulis data untuk akun yang sedang login. Mengembalikan false bila tidak ada sesi/storage. */
export function writeAccountItem(base: AccountStorageBase, value: string): boolean {
  const storage = getStorage()
  const accountId = currentAccountId()
  if (!storage || !accountId) return false
  migrateLegacyAccountData(accountId, [base])
  storage.setItem(accountStorageKey(base, accountId), value)
  return true
}

export function removeAccountItem(base: AccountStorageBase): void {
  const storage = getStorage()
  const accountId = currentAccountId()
  if (!storage || !accountId) return
  try {
    storage.removeItem(accountStorageKey(base, accountId))
  } catch {
    // Abaikan bila storage tidak tersedia.
  }
}
