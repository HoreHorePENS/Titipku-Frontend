import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { loginUser, logoutUser, isAuthenticated } from './api'
import { setAuthToken } from '@/lib/api-client'

describe('Auth Feature API', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    setAuthToken(null)
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    setAuthToken(null)
  })

  it('loginUser berhasil menyimpan access_token ke sesi klien', async () => {
    const mockResponse = {
      data: {
        access_token: 'valid-jwt-token-xyz',
        user: { id: 'usr-1', email: 'rina@keripik.id', full_name: 'Bu Rina', role: 'owner' },
        business: { id: 'biz-1', name: 'Keripik Pisang Rina', owner_name: 'Bu Rina' },
      },
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as unknown as Response)

    expect(isAuthenticated()).toBe(false)

    const result = await loginUser({ email: 'rina@keripik.id', password: 'password123' })
    expect(result.access_token).toBe('valid-jwt-token-xyz')
    expect(isAuthenticated()).toBe(true)
  })

  it('logoutUser menghapus token dari sesi klien', () => {
    setAuthToken('token-lama')
    expect(isAuthenticated()).toBe(true)

    logoutUser()
    expect(isAuthenticated()).toBe(false)
  })
})
