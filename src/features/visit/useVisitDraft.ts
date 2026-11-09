import { useState, useCallback } from 'react'
import type { VisitItemInput } from './types'

export const DRAFT_STORAGE_KEY = 'titipku_visit_draft_v1'

export interface PersistedVisitDraft {
  version: 1
  partnerId: string
  receivedBy: string
  items: VisitItemInput[]
  step: 'input_stock' | 'summary_payment'
  clientRequestId: string
  updatedAt: string
}

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) return globalThis.localStorage
  } catch {
    return null
  }
  return null
}

export function saveDraftToStorage(data: Omit<PersistedVisitDraft, 'version' | 'updatedAt'>): boolean {
  const storage = getStorage()
  if (!storage) return false

  try {
    const payload: PersistedVisitDraft = {
      ...data,
      version: 1,
      updatedAt: new Date().toISOString(),
    }
    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload))
    return true
  } catch (error) {
    // Penanganan storage kuota penuh atau private browsing mode
    console.warn('Gagal menyimpan draf kunjungan ke localStorage:', error)
    return false
  }
}

export function loadDraftFromStorage(): PersistedVisitDraft | null {
  const storage = getStorage()
  if (!storage) return null

  try {
    const raw = storage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as PersistedVisitDraft
    // Validasi skema ber-versi
    if (parsed && parsed.version === 1 && typeof parsed.partnerId === 'string' && Array.isArray(parsed.items)) {
      return parsed
    }
    // Jika format lama atau rusak, bersihkan
    storage.removeItem(DRAFT_STORAGE_KEY)
    return null
  } catch (error) {
    // JSON korup atau storage tidak bisa diakses
    console.warn('Gagal membaca draf kunjungan dari localStorage:', error)
    try {
      storage.removeItem(DRAFT_STORAGE_KEY)
    } catch {
      // Abaikan jika storage disabled
    }
    return null
  }
}

export function clearDraftFromStorage(): void {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.removeItem(DRAFT_STORAGE_KEY)
  } catch {
    // Abaikan jika storage error
  }
}

export function useVisitDraft() {
  const [draft, setDraftState] = useState<PersistedVisitDraft | null>(() => loadDraftFromStorage())

  const saveDraft = useCallback((data: Omit<PersistedVisitDraft, 'version' | 'updatedAt'>) => {
    const success = saveDraftToStorage(data)
    if (success) {
      setDraftState({
        ...data,
        version: 1,
        updatedAt: new Date().toISOString(),
      })
    }
  }, [])

  const clearDraft = useCallback(() => {
    clearDraftFromStorage()
    setDraftState(null)
  }, [])

  return {
    draft,
    saveDraft,
    clearDraft,
    hasDraft: Boolean(draft),
  }
}

export default useVisitDraft
