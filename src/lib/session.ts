import { setAuthToken } from './api-client'
import { queryClient } from './query-client'

/** Kunci storage yang berisi data milik akun tertentu (tidak boleh terbawa ke akun lain). */
const USER_SCOPED_KEYS = ['titipku_custom_profile', 'titipku_notifications_read_v2']
const USER_SCOPED_PREFIXES = ['titipku_visit_draft']

function removeUserScopedKeys(storage: Storage) {
  const keys: string[] = []
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (key && (USER_SCOPED_KEYS.includes(key) || USER_SCOPED_PREFIXES.some((p) => key.startsWith(p)))) {
      keys.push(key)
    }
  }
  keys.forEach((key) => storage.removeItem(key))
}

/**
 * Hapus seluruh jejak sesi: token, semua cache query (data & peran akun lama),
 * dan storage milik pengguna. Dipanggil saat logout, sebelum login, dan saat token ditolak (401).
 */
export function clearSession(): void {
  setAuthToken(null)
  void queryClient.cancelQueries()
  queryClient.clear()
  try {
    removeUserScopedKeys(localStorage)
    removeUserScopedKeys(sessionStorage)
  } catch {
    // Storage tidak tersedia (mode privat): cukup bersihkan memori.
  }
}

/**
 * Mulai sesi akun baru dari respons login/daftar. Cache dikosongkan lebih dulu,
 * lalu data akun (termasuk peran) diisi dari respons akun baru agar tidak pernah
 * memakai data akun sebelumnya.
 */
export function startSession<TAccount>(token: string, account: TAccount, accountQueryKey: readonly unknown[]): void {
  clearSession()
  setAuthToken(token)
  queryClient.setQueryData(accountQueryKey, account)
}
