import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  loadBusinesses,
  PENITIP_STORAGE_KEY,
  INITIAL_PENITIP_BUSINESSES,
  PENITIP_CATEGORIES,
} from './penitip-businesses'

describe('Penitip Businesses Storage & Domain', () => {
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

  it('menginisialisasi data awal jika storage kosong', () => {
    const list = loadBusinesses()
    expect(list.length).toBe(INITIAL_PENITIP_BUSINESSES.length)
    expect(mockStorage[PENITIP_STORAGE_KEY]).toBeDefined()
    expect(list[0].businessName).toBe('Keripik Pisang & Aneka Snack Bu Rina')
  })

  it('memuat data yang ada di storage jika valid', () => {
    const custom = [
      {
        ...INITIAL_PENITIP_BUSINESSES[0],
        id: 'custom-1',
        businessName: 'Snack Bu Siti Test',
        offerStatus: 'pending' as const,
      },
    ]
    mockStorage[PENITIP_STORAGE_KEY] = JSON.stringify(custom)

    const list = loadBusinesses()
    expect(list.length).toBe(1)
    expect(list[0].id).toBe('custom-1')
    expect(list[0].businessName).toBe('Snack Bu Siti Test')
    expect(list[0].offerStatus).toBe('pending')
  })

  it('menangani JSON rusak dengan fallback ke INITIAL_PENITIP_BUSINESSES', () => {
    mockStorage[PENITIP_STORAGE_KEY] = 'INVALID_JSON_@@@'
    const list = loadBusinesses()
    expect(list.length).toBe(INITIAL_PENITIP_BUSINESSES.length)
  })

  it('memiliki kategori lengkap dengan label bahasa Indonesia', () => {
    expect(PENITIP_CATEGORIES.length).toBeGreaterThanOrEqual(5)
    expect(PENITIP_CATEGORIES.some((c) => c.key === 'snack')).toBe(true)
    expect(PENITIP_CATEGORIES.some((c) => c.key === 'kue')).toBe(true)
  })
})
