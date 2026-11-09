import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  loadNotifications,
  NOTIFICATIONS_STORAGE_KEY,
  INITIAL_NOTIFICATIONS,
} from './notification-store'

describe('Notification Store & Red Dot Indicator', () => {
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

  it('menginisialisasi notifikasi default untuk penitip dan pemilik toko', () => {
    const list = loadNotifications()
    expect(list.length).toBe(INITIAL_NOTIFICATIONS.length)
    expect(mockStorage[NOTIFICATIONS_STORAGE_KEY]).toBeDefined()

    const penitipNotifs = list.filter((n) => n.role === 'penitip')
    expect(penitipNotifs.length).toBeGreaterThan(0)
    // Cek ada notifikasi unread (memicu titik merah pada lonceng)
    const hasUnread = penitipNotifs.some((n) => !n.isRead)
    expect(hasUnread).toBe(true)
  })

  it('memuat notifikasi kustom dari storage', () => {
    const custom = [
      {
        id: 'n-custom-1',
        role: 'penitip' as const,
        title: 'Tawaran Baru',
        message: 'Toko Maju Bersama mengajak titip barang.',
        timeAgo: '1 mnt lalu',
        timestamp: new Date().toISOString(),
        isRead: false,
        type: 'offer_incoming' as const,
      },
    ]
    mockStorage[NOTIFICATIONS_STORAGE_KEY] = JSON.stringify(custom)

    const list = loadNotifications()
    expect(list.length).toBe(1)
    expect(list[0].id).toBe('n-custom-1')
    expect(list[0].isRead).toBe(false)
  })

  it('fallback ke data awal saat JSON corrupt', () => {
    mockStorage[NOTIFICATIONS_STORAGE_KEY] = 'CORRUPTED_{{{'
    const list = loadNotifications()
    expect(list.length).toBe(INITIAL_NOTIFICATIONS.length)
  })
})
