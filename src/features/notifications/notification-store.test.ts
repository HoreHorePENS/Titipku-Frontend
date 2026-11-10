import { describe, it, expect } from 'vitest'
import { buildNotaNotifications, buildNotifications, formatTimeAgo, notificationTarget } from './notification-store'
import { mapStoreNota } from '@/features/invoices/store-visits-api'
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

describe('notificationTarget: tombol "Lihat" mengarah ke tempat yang benar', () => {
  const build = (role: 'penitip' | 'pemilik_toko', raw: Partial<RawProposal>) =>
    buildNotifications([proposal({ id: 'x1', ...raw })], role, new Set(), NOW)[0]

  it('penitip: pengajuan disetujui membuka detail toko mitra tersebut', () => {
    const notif = build('penitip', { direction: 'penitip_to_store', status: 'accepted', responded_at: '2026-11-09T11:30:00Z' })
    expect(notif.title).toBe('Pengajuan disetujui')
    expect(notificationTarget(notif, 'penitip')).toBe('/warung?toko=s')
  })

  it('penitip: pengajuan ditolak membuka daftar pengajuan dengan item tersebut', () => {
    const notif = build('penitip', { direction: 'penitip_to_store', status: 'rejected', responded_at: '2026-11-09T11:30:00Z' })
    expect(notif.title).toBe('Pengajuan ditolak')
    expect(notificationTarget(notif, 'penitip')).toBe('/warung?pengajuan=x1#pengajuan-saya')
  })

  it('pemilik toko: pengajuan masuk membuka Toko Saya tab pengajuan', () => {
    const notif = build('pemilik_toko', { direction: 'penitip_to_store', status: 'pending' })
    expect(notif.type).toBe('request_incoming')
    expect(notificationTarget(notif, 'pemilik_toko')).toBe('/toko-saya?tab=pengajuan&pengajuan=x1')
  })
})

describe('notifikasi nota baru untuk pemilik toko', () => {
  const nota = mapStoreNota({
    id: 'v9',
    number: 'N-9',
    business_id: 'b',
    partner_name: 'Keripik Rina',
    partner_owner_name: 'Rina',
    partner_whatsapp: '62',
    visited_at: '2026-11-09T11:00:00Z',
    received_by: 'Siti',
    total: 50000,
    paid: 0,
    payment_status: 'unpaid',
  })

  it('satu notifikasi per nota, membuka detail nota di halaman Penitip', () => {
    const [notif] = buildNotaNotifications([nota], new Set(), NOW)
    expect(notif).toMatchObject({ type: 'nota_new', title: 'Nota baru dari Keripik Rina', isRead: false, notaId: 'v9' })
    expect(notificationTarget(notif, 'pemilik_toko')).toBe('/penitip?nota=v9')
    expect(buildNotaNotifications([nota], new Set(['nota:v9']), NOW)[0].isRead).toBe(true)
  })

  it('nota lebih dari 30 hari tidak dijadikan notifikasi', () => {
    expect(buildNotaNotifications([{ ...nota, visitedAt: '2026-09-01T00:00:00Z' }], new Set(), NOW)).toEqual([])
  })
})
