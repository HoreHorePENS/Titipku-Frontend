import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setAuthToken } from './api-client'
import { fakeAccountToken } from './test-account-token'
import { currentAccountId, purgeObsoleteStorage, readAccountItem, writeAccountItem, removeAccountItem } from './account-storage'

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

describe('penyimpanan lokal per akun', () => {
  beforeEach(() => {
    setAuthToken(null)
    vi.stubGlobal('localStorage', memoryStorage())
    vi.stubGlobal('sessionStorage', memoryStorage())
  })
  afterEach(() => {
    setAuthToken(null)
    vi.unstubAllGlobals()
  })

  it('ID akun diambil dari klaim sub token; tanpa sesi tidak ada yang dibaca/ditulis', () => {
    expect(currentAccountId()).toBeNull()
    expect(writeAccountItem('titipku_custom_profile', '{}')).toBe(false)
    expect(readAccountItem('titipku_custom_profile')).toBeNull()

    setAuthToken(fakeAccountToken('user-a'))
    expect(currentAccountId()).toBe('user-a')
    setAuthToken('bukan-jwt')
    expect(currentAccountId()).toBeNull()
  })

  it('data satu akun tidak terlihat oleh akun lain di browser yang sama', () => {
    setAuthToken(fakeAccountToken('toko-a'))
    expect(writeAccountItem('titipku_custom_profile', '{"a":1}')).toBe(true)
    expect(localStorage.getItem('titipku_custom_profile:toko-a')).toBe('{"a":1}')

    setAuthToken(fakeAccountToken('toko-b'))
    expect(readAccountItem('titipku_custom_profile')).toBeNull()

    setAuthToken(fakeAccountToken('toko-a'))
    expect(readAccountItem('titipku_custom_profile')).toBe('{"a":1}')
  })

  it('sisa nota toko lama di localStorage dihapus (tidak dipakai lagi)', () => {
    localStorage.setItem('titipku_digital_invoices', '[]')
    localStorage.setItem('titipku_digital_invoices:toko-a', '[{"id":"x"}]')
    localStorage.setItem('titipku_custom_profile:toko-a', '{}')
    purgeObsoleteStorage()
    expect(localStorage.getItem('titipku_digital_invoices')).toBeNull()
    expect(localStorage.getItem('titipku_digital_invoices:toko-a')).toBeNull()
    expect(localStorage.getItem('titipku_custom_profile:toko-a')).toBe('{}')
  })

  it('data lama tanpa ID pindah ke akun pertama yang mengaksesnya, tidak ke akun berikutnya', () => {
    localStorage.setItem('titipku_notifications_read_v2', '["p1:pending"]')

    setAuthToken(fakeAccountToken('pertama'))
    expect(readAccountItem('titipku_notifications_read_v2')).toBe('["p1:pending"]')
    expect(localStorage.getItem('titipku_notifications_read_v2')).toBeNull()

    setAuthToken(fakeAccountToken('kedua'))
    expect(readAccountItem('titipku_notifications_read_v2')).toBeNull()
  })

  it('data lama tidak menimpa data akun yang sudah ada', () => {
    localStorage.setItem('titipku_custom_profile:user-a', '{"fullName":"Baru"}')
    localStorage.setItem('titipku_custom_profile', '{"fullName":"Lama"}')
    setAuthToken(fakeAccountToken('user-a'))

    expect(readAccountItem('titipku_custom_profile')).toBe('{"fullName":"Baru"}')
    expect(localStorage.getItem('titipku_custom_profile')).toBeNull()

    removeAccountItem('titipku_custom_profile')
    expect(readAccountItem('titipku_custom_profile')).toBeNull()
  })
})
