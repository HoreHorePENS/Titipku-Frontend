import { describe, it, expect } from 'vitest'
import { buildNotifications, formatTimeAgo } from './notification-store'
import { mapProposal, type RawProposal } from '@/features/stores/proposals-api'

const NOW = new Date('2026-11-09T12:00:00Z').getTime()

function proposal(overrides: Partial<RawProposal>) {
  return mapProposal({
    id: 'p',
    direction: 'store_to_penitip',
    status: 'pending',
    message: null,
    shelf_location: null,
    estimated_capacity: null,
    created_at: '2026-11-09T11:00:00Z',
    responded_at: null,
    store: { id: 's', name: 'Warung Siti', category: 'warung', address: 'a', whatsapp: '62', photo_url: null, owner_name: 'Siti', latitude: 0, longitude: 0 },
    business: { id: 'b', name: 'Keripik Rina', owner_name: 'Rina', whatsapp: null, address: null },
    items: [],
    ...overrides,
  })
}

describe('notifikasi diturunkan dari proposal asli', () => {
  it('akun baru tanpa proposal tidak punya notifikasi (tidak ada data contoh)', () => {
    expect(buildNotifications([], 'penitip', new Set(), NOW)).toEqual([])
    expect(buildNotifications([], 'pemilik_toko', new Set(), NOW)).toEqual([])
  })

  it('penitip: tawaran masuk pending bisa langsung ditindaklanjuti', () => {
    const [notif] = buildNotifications([proposal({ id: 'o1' })], 'penitip', new Set(), NOW)
    expect(notif).toMatchObject({ type: 'offer_incoming', actionable: true, isRead: false, proposalId: 'o1' })
    expect(notif.message).toContain('Warung Siti')
  })

  it('pemilik toko: pengajuan masuk & tawaran yang diterima', () => {
    const list = buildNotifications(
      [
        proposal({ id: 'r1', direction: 'penitip_to_store' }),
        proposal({ id: 'o2', status: 'accepted', responded_at: '2026-11-09T11:30:00Z' }),
      ],
      'pemilik_toko',
      new Set(),
      NOW
    )
    expect(list.map((n) => n.type)).toEqual(['accepted', 'request_incoming'])
  })

  it('tidak memberi notifikasi untuk tawaran sendiri yang masih pending atau dibatalkan', () => {
    expect(buildNotifications([proposal({}), proposal({ status: 'cancelled' })], 'pemilik_toko', new Set(), NOW)).toEqual([])
  })

  it('status baca per proposal+status', () => {
    const [notif] = buildNotifications([proposal({ id: 'o1' })], 'penitip', new Set(['o1:pending']), NOW)
    expect(notif.isRead).toBe(true)
  })

  it('formatTimeAgo', () => {
    expect(formatTimeAgo('2026-11-09T11:59:40Z', NOW)).toBe('Baru saja')
    expect(formatTimeAgo('2026-11-09T11:00:00Z', NOW)).toBe('1 jam lalu')
    expect(formatTimeAgo('2026-11-08T12:00:00Z', NOW)).toBe('Kemarin')
  })
})
