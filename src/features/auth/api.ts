import { useContext } from 'react'
import { QueryClientContext, useQuery } from '@tanstack/react-query'
import { apiClient, getAuthToken } from '@/lib/api-client'
import { clearSession, startSession } from '@/lib/session'
import type { LoginInput, RegisterInput, AuthResponse, CurrentAccount } from './types'

export const CURRENT_ACCOUNT_KEY = ['auth', 'me'] as const

/** Mulai sesi akun baru: cache & storage akun lama dibuang, peran diambil dari respons ini. */
function beginSession(auth: AuthResponse) {
  if (!auth?.access_token) return
  const account: CurrentAccount = { user: auth.user, business: auth.business, store: auth.store }
  startSession(auth.access_token, account, CURRENT_ACCOUNT_KEY)
}

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const res = await apiClient<{ data: AuthResponse }>('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  beginSession(res.data)
  return res.data
}

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  const res = await apiClient<{ data: AuthResponse }>('/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  beginSession(res.data)
  return res.data
}

export async function fetchCurrentAccount(): Promise<CurrentAccount> {
  const res = await apiClient<{ data: CurrentAccount }>('/v1/auth/me')
  return res.data
}

export function useCurrentAccount() {
  const client = useContext(QueryClientContext)
  const token = getAuthToken()

  if (!client) {
    return { data: undefined, isLoading: false, isError: false, error: null, refetch: () => Promise.resolve() }
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useQuery({
    queryKey: CURRENT_ACCOUNT_KEY,
    queryFn: fetchCurrentAccount,
    enabled: Boolean(token),
    staleTime: 1000 * 60 * 5, // 5 menit
  })
}

/** Logout: kosongkan token, seluruh cache query, dan storage milik akun. */
export function logoutUser(): void {
  clearSession()
}

export type AccountRole = 'penitip' | 'pemilik_toko'

/**
 * Peran akun yang sedang login, selalu dari /auth/me atau respons login akun ini.
 * Selama belum pasti, role bernilai null: query khusus peran tidak boleh dijalankan.
 */
export function useAccountRole() {
  const account = useCurrentAccount()
  // Akun lama tanpa account_type diperlakukan sebagai penitip (sama seperti backend).
  const role: AccountRole | null = account.data ? (account.data.user?.account_type ?? 'penitip') : null
  return {
    role,
    isPenitip: role === 'penitip',
    isPemilikToko: role === 'pemilik_toko',
    isLoading: account.isLoading,
    isError: account.isError,
  }
}

export function isAuthenticated(): boolean {
  return Boolean(getAuthToken())
}
