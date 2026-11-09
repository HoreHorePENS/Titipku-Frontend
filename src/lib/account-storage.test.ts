import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setAuthToken } from './api-client'
import { fakeAccountToken } from './test-account-token'
import { currentAccountId, readAccountItem, writeAccountItem, removeAccountItem } from './account-storage'
import { getStoreDigitalInvoices, saveStoreDigitalInvoice } from '@/features/invoices/digital-invoices'
import type { VisitRecord } from '@/features/visit/types'

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

  it('nota buatan toko tidak terlihat oleh akun lain di browser yang sama', () => {
    setAuthToken(fakeAccountToken('toko-a'))
    saveStoreDigitalInvoice({ id: 'nota-a' } as VisitRecord)
    expect(getStoreDigitalInvoices().map((n) => n.id)).toEqual(['nota-a'])
    expect(localStorage.getItem('titipku_digital_invoices:toko-a')).not.toBeNull()

    setAuthToken(fakeAccountToken('toko-b'))
    expect(getStoreDigitalInvoices()).toEqual([])
    saveStoreDigitalInvoice({ id: 'nota-b' } as VisitRecord)

    setAuthToken(fakeAccountToken('toko-a'))
    expect(getStoreDigitalInvoices().map((n) => n.id)).toEqual(['nota-a'])
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
