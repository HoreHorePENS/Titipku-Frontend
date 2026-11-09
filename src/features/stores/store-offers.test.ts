import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  loadStoreOffers,
  STORE_OFFERS_STORAGE_KEY,
  INITIAL_STORE_OFFERS,
} from './store-offers'

describe('Store Offers (Penitip Approval & Persistence)', () => {
  let mockStorage: Record<string, string> = {}

  beforeEach(() => {
    mockStorage = {}
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, val: string) => {
        mockStorage[key] = val
      },
      removeItem: (key: string) => {
        delete mockStorage[key]
      },
      clear: () => {
        mockStorage = {}
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('menginisialisasi tawaran toko default saat storage kosong', () => {
    const list = loadStoreOffers()
    expect(list.length).toBe(INITIAL_STORE_OFFERS.length)
    expect(mockStorage[STORE_OFFERS_STORAGE_KEY]).toBeDefined()
    expect(list[0].storeName).toBe('Toko Kelontong Berkah Jaya')
    expect(list[0].status).toBe('pending')
  })

  it('memuat tawaran yang tersimpan di localStorage', () => {
    const custom = [
      {
        ...INITIAL_STORE_OFFERS[0],
        id: 'custom-offer-99',
        storeName: 'Toko Sumber Rejeki',
        status: 'accepted' as const,
      },
    ]
    mockStorage[STORE_OFFERS_STORAGE_KEY] = JSON.stringify(custom)

    const list = loadStoreOffers()
    expect(list.length).toBe(1)
    expect(list[0].id).toBe('custom-offer-99')
    expect(list[0].storeName).toBe('Toko Sumber Rejeki')
    expect(list[0].status).toBe('accepted')
  })

  it('fallback ke data awal saat storage rusak', () => {
    mockStorage[STORE_OFFERS_STORAGE_KEY] = '{invalid-json'
    const list = loadStoreOffers()
    expect(list.length).toBe(INITIAL_STORE_OFFERS.length)
  })
})
