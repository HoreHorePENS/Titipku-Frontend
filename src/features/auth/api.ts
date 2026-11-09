import { useContext } from 'react'
import { QueryClientContext, useQuery } from '@tanstack/react-query'
import { apiClient, setAuthToken, getAuthToken } from '@/lib/api-client'
import type { LoginInput, RegisterInput, AuthResponse, CurrentAccount } from './types'

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const res = await apiClient<{ data: AuthResponse }>('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })

  if (res.data?.access_token) {
    setAuthToken(res.data.access_token)
  }

  return res.data
}

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  const res = await apiClient<{ data: AuthResponse }>('/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })

  if (res.data?.access_token) {
    setAuthToken(res.data.access_token)
  }

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
    return { data: undefined, isLoading: false, isError: false }
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchCurrentAccount,
    enabled: Boolean(token),
    staleTime: 1000 * 60 * 5, // 5 menit
  })
}

export function logoutUser(): void {
  setAuthToken(null)
}

export function isAuthenticated(): boolean {
  return Boolean(getAuthToken())
}
