import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  saveDraftToStorage,
  loadDraftFromStorage,
  clearDraftFromStorage,
  DRAFT_STORAGE_KEY,
} from './useVisitDraft'

describe('Persistent useVisitDraft (Offline-First Storage)', () => {
  // Mock localStorage
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

  it('berhasil menyimpan dan memulihkan draf kunjungan dengan skema ber-versi v1', () => {
    const draftData = {
      partnerId: 'warung-123',
      receivedBy: 'Bu Sri',
      items: [
        {
          productId: 'prod-1',
          productName: 'Keripik Balado',
          consignPrice: 15000,
          prevStock: 10,
          remaining: 3,
          returned: 1,
          newDrop: 10,
        },
      ],
      step: 'input_stock' as const,
      clientRequestId: 'uuid-req-123',
    }

    const saved = saveDraftToStorage(draftData)
    expect(saved).toBe(true)

    const loaded = loadDraftFromStorage()
    expect(loaded).not.toBeNull()
    expect(loaded?.version).toBe(1)
    expect(loaded?.partnerId).toBe('warung-123')
    expect(loaded?.receivedBy).toBe('Bu Sri')
    expect(loaded?.items.length).toBe(1)
    expect(loaded?.items[0].remaining).toBe(3)
    expect(loaded?.clientRequestId).toBe('uuid-req-123')
    expect(typeof loaded?.updatedAt).toBe('string')
  })

  it('menghapus draf saat clearDraftFromStorage dipanggil', () => {
    saveDraftToStorage({
      partnerId: 'warung-123',
      receivedBy: 'Bu Sri',
      items: [],
      step: 'input_stock',
      clientRequestId: 'uuid-1',
    })

    expect(loadDraftFromStorage()).not.toBeNull()

    clearDraftFromStorage()
    expect(loadDraftFromStorage()).toBeNull()
  })

  it('menangani JSON korup / rusak di localStorage dengan aman tanpa melempar exception', () => {
    mockStorage[DRAFT_STORAGE_KEY] = 'INVALID_JSON_{{{'

    const loaded = loadDraftFromStorage()
    expect(loaded).toBeNull()
    // Kunci yang rusak harus dibersihkan otomatis
    expect(mockStorage[DRAFT_STORAGE_KEY]).toBeUndefined()
  })

  it('mengabaikan data draf jika versi skema tidak cocok (mismatch version)', () => {
    mockStorage[DRAFT_STORAGE_KEY] = JSON.stringify({
      version: 999, // versi lama yang tidak kompatibel
      partnerId: 'warung-old',
    })

    const loaded = loadDraftFromStorage()
    expect(loaded).toBeNull()
  })

  it('menangani skenario storage penuh (QuotaExceededError) dengan aman', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError: storage is full')
      },
      removeItem: () => {},
    })

    const result = saveDraftToStorage({
      partnerId: 'warung-1',
      receivedBy: '',
      items: [],
      step: 'input_stock',
      clientRequestId: 'uuid',
    })

    expect(result).toBe(false)
  })
})
