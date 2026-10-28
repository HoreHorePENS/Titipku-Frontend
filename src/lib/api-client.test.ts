import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { apiClient, ApiError } from './api-client'

describe('apiClient', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('mengembalikan data JSON jika respon HTTP 200 OK', async () => {
    const mockData = { data: { id: 'usr-1', name: 'Bu Rina' } }
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as unknown as Response)

    const result = await apiClient<typeof mockData>('/v1/me')
    expect(result).toEqual(mockData)
  })

  it('melempar ApiError dengan payload kode dan pesan dari backend jika respon error 400', async () => {
    const backendError = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Nominal pembayaran tidak valid',
        fields: { amount: 'must be positive' },
      },
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => backendError,
    } as unknown as Response)

    await expect(apiClient('/v1/payments')).rejects.toThrow(ApiError)

    try {
      await apiClient('/v1/payments')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      const apiErr = err as ApiError
      expect(apiErr.status).toBe(400)
      expect(apiErr.code).toBe('VALIDATION_ERROR')
      expect(apiErr.message).toBe('Nominal pembayaran tidak valid')
      expect(apiErr.fields).toEqual({ amount: 'must be positive' })
    }
  })

  it('menangani error fallback jika respon error bukan format JSON', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      json: async () => {
        throw new Error('Not JSON')
      },
    } as unknown as Response)

    try {
      await apiClient('/v1/broken')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      const apiErr = err as ApiError
      expect(apiErr.status).toBe(502)
      expect(apiErr.code).toBe('HTTP_ERROR')
    }
  })
})
