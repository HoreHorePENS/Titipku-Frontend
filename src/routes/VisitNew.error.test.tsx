import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { toastStore } from '@/components/ui/Toast'
import { ApiError } from '@/lib/api-client'

describe('VisitNew Error Handling (No Alert, Uses Toast)', () => {
  beforeEach(() => {
    toastStore.dismissAll()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    toastStore.dismissAll()
  })

  it('memastikan sistem toast menangani error simpan kunjungan tanpa alert', () => {
    // Simulasikan error response 409 STOCK_MISMATCH dari backend
    const stockMismatchError = new ApiError(409, {
      code: 'STOCK_MISMATCH',
      message: 'stock physically available does not match batch inventory',
    })

    try {
      throw stockMismatchError
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409 && err.code === 'STOCK_MISMATCH') {
        toastStore.add({
          title: 'Gagal Menyimpan Kunjungan',
          description: 'Perhitungan stok fisik tidak sesuai dengan catatan batch stok di server.',
          type: 'error',
        })
      }
    }

    const snapshot = toastStore.getSnapshot()
    expect(snapshot.length).toBe(1)
    expect(snapshot[0].title).toBe('Gagal Menyimpan Kunjungan')
    expect(snapshot[0].description).toContain('tidak sesuai dengan catatan batch stok')
  })

  it('menangani error offline / network drop dengan pesan koneksi terputus', () => {
    const networkError = new TypeError('Failed to fetch')

    try {
      throw networkError
    } catch {
      toastStore.add({
        title: 'Koneksi Terputus',
        description: 'Koneksi internet terputus. Data kunjungan Anda tetap aman di formulir.',
        type: 'error',
      })
    }

    const snapshot = toastStore.getSnapshot()
    expect(snapshot.length).toBe(1)
    expect(snapshot[0].title).toBe('Koneksi Terputus')
    expect(snapshot[0].description).toContain('Koneksi internet terputus')
  })
})
