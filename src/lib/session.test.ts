import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { queryClient } from './query-client'
import { getAuthToken, setAuthToken } from './api-client'
import { fakeAccountToken } from './test-account-token'
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

function mockLoginResponse(userId: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          access_token: fakeAccountToken(userId),
          user: { id: userId, email: 'r@x.co', full_name: 'Rina', role: 'owner', account_type: 'penitip' },
          business: { id: 'b2', name: 'Keripik', owner_name: 'Rina' },
        },
      }),
    })
  )
}

describe('sesi: ganti akun tidak membawa data akun sebelumnya', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('sessionStorage', memoryStorage())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    queryClient.clear()
    setAuthToken(null)
  })

  it('login mengosongkan cache akun lama dan mengisi peran dari respons akun baru', async () => {
    queryClient.setQueryData(CURRENT_ACCOUNT_KEY, { user: { account_type: 'pemilik_toko' } })
    queryClient.setQueryData(['producers', ''], [{ id: 'lama' }])
    mockLoginResponse('u2')

    await loginUser({ email: 'r@x.co', password: 'rahasia123' })

    expect(getAuthToken()).toBe(fakeAccountToken('u2'))
    expect(queryClient.getQueryData(['producers', ''])).toBeUndefined()
    expect(queryClient.getQueryData<{ user: { account_type: string } }>(CURRENT_ACCOUNT_KEY)?.user.account_type).toBe('penitip')
  })

  it('login pertama memindahkan data lama tanpa ID ke akun itu dan menghapus key lama', async () => {
    localStorage.setItem('titipku_digital_invoices', '[{"id":"nota-lama"}]')
    localStorage.setItem('titipku_custom_profile', '{"fullName":"Bu Siti"}')
    mockLoginResponse('u2')

    await loginUser({ email: 'r@x.co', password: 'rahasia123' })

    expect(localStorage.getItem('titipku_digital_invoices')).toBeNull()
    expect(localStorage.getItem('titipku_custom_profile')).toBeNull()
    // Nota toko lama tidak dipakai lagi: dihapus, tidak dipindahkan.
    expect(localStorage.getItem('titipku_digital_invoices:u2')).toBeNull()
    expect(localStorage.getItem('titipku_custom_profile:u2')).toBe('{"fullName":"Bu Siti"}')
  })

  it('logout menghapus token dan cache, tetapi data per akun tetap tersimpan untuk akun itu', () => {
    setAuthToken(fakeAccountToken('u1'))
    localStorage.setItem('titipku_custom_profile:u1', '{}')
    queryClient.setQueryData(['dashboard'], { total: 1 })

    logoutUser()

    expect(getAuthToken()).toBeNull()
    expect(queryClient.getQueryData(['dashboard'])).toBeUndefined()
    expect(localStorage.getItem('titipku_custom_profile:u1')).toBe('{}')
  })
})
