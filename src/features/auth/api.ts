import { apiClient, setAuthToken, getAuthToken } from '@/lib/api-client'
import type { LoginInput, RegisterInput, AuthResponse } from './types'

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

export function logoutUser(): void {
  setAuthToken(null)
}

export function isAuthenticated(): boolean {
  return Boolean(getAuthToken())
}
