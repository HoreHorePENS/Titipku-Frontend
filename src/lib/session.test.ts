import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { queryClient } from './query-client'
import { getAuthToken } from './api-client'
import { loginUser, logoutUser, CURRENT_ACCOUNT_KEY } from '@/features/auth/api'

function memoryStorage(): Storage {
  let data: Record<string, string> = {}
  return {
    get length() {
      return Object.keys(data).length
    },
    key: (i: number) => Object.keys(data)[i] ?? null,
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => {
      data[k] = v
    },
    removeItem: (k: string) => {
      delete data[k]
    },
    clear: () => {
      data = {}
    },
  }
}

describe('sesi: ganti akun tidak membawa data akun sebelumnya', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('sessionStorage', memoryStorage())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    queryClient.clear()
  })

  it('login mengosongkan cache akun lama dan mengisi peran dari respons akun baru', async () => {
    queryClient.setQueryData(CURRENT_ACCOUNT_KEY, { user: { account_type: 'pemilik_toko' } })
    queryClient.setQueryData(['producers', ''], [{ id: 'lama' }])
    localStorage.setItem('titipku_custom_profile', '{"fullName":"Bu Siti"}')

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { access_token: 'token-penitip', user: { id: 'u2', email: 'r@x.co', full_name: 'Rina', role: 'owner', account_type: 'penitip' }, business: { id: 'b2', name: 'Keripik', owner_name: 'Rina' } },
        }),
      })
    )

    await loginUser({ email: 'r@x.co', password: 'rahasia123' })

    expect(getAuthToken()).toBe('token-penitip')
    expect(queryClient.getQueryData(['producers', ''])).toBeUndefined()
    expect(queryClient.getQueryData<{ user: { account_type: string } }>(CURRENT_ACCOUNT_KEY)?.user.account_type).toBe('penitip')
    expect(localStorage.getItem('titipku_custom_profile')).toBeNull()
  })

  it('logout menghapus token, cache, dan storage milik akun', () => {
    sessionStorage.setItem('titipku_auth_token', 'x')
    localStorage.setItem('titipku_notifications_read_v2', '[]')
    localStorage.setItem('titipku_visit_draft_v1', '{}')
    localStorage.setItem('titipku_digital_invoices', '[]')
    queryClient.setQueryData(['dashboard'], { total: 1 })

    logoutUser()

    expect(getAuthToken()).toBeNull()
    expect(queryClient.getQueryData(['dashboard'])).toBeUndefined()
    expect(localStorage.getItem('titipku_notifications_read_v2')).toBeNull()
    expect(localStorage.getItem('titipku_visit_draft_v1')).toBeNull()
    // Nota digital hanya tersimpan di perangkat; tidak dihapus agar tidak hilang permanen.
    expect(localStorage.getItem('titipku_digital_invoices')).toBe('[]')
  })
})
