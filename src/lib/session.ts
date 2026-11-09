import { setAuthToken } from './api-client'
import { currentAccountId, migrateLegacyAccountData } from './account-storage'
import { queryClient } from './query-client'

/**
 * Hapus seluruh jejak sesi di memori: token dan semua cache query (data & peran akun lama).
 * Data milik akun di localStorage tidak dihapus karena sudah dipisah per akun
 * (lihat account-storage.ts) dan tidak terlihat oleh akun lain.
 */
export function clearSession(): void {
  setAuthToken(null)
  void queryClient.cancelQueries()
  queryClient.clear()
}

/**
 * Mulai sesi akun baru dari respons login/daftar. Cache dikosongkan lebih dulu,
 * lalu data akun (termasuk peran) diisi dari respons akun baru agar tidak pernah
 * memakai data akun sebelumnya. Data lokal lama tanpa ID akun dipindahkan ke akun ini.
 */
export function startSession<TAccount>(token: string, account: TAccount, accountQueryKey: readonly unknown[]): void {
  clearSession()
  setAuthToken(token)
  queryClient.setQueryData(accountQueryKey, account)
  const accountId = currentAccountId()
  if (accountId) migrateLegacyAccountData(accountId)
}
