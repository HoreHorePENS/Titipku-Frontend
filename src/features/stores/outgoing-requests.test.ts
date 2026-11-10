import { describe, expect, it } from 'vitest'
import { outgoingRequests } from './outgoing-requests'
import { mapProposal, type RawProposal } from './proposals-api'

const raw = (over: Partial<RawProposal>): RawProposal => ({
  id: 'p',
  direction: 'penitip_to_store',
  status: 'pending',
  message: null,
  shelf_location: null,
  estimated_capacity: null,
  created_at: '2026-11-01T08:00:00Z',
  responded_at: null,
  store: { id: 's', name: 'Warung', category: 'warung', address: 'a', whatsapp: '62', photo_url: null, owner_name: 'Siti', latitude: 0, longitude: 0 },
  business: { id: 'b', name: 'Keripik', owner_name: 'Ani', whatsapp: null, address: null },
  items: [],
  ...over,
})

describe('outgoingRequests', () => {
  it('hanya pengajuan penitip ke toko, tanpa yang dibatalkan, terbaru dulu', () => {
    const list = outgoingRequests(
      [
        raw({ id: 'lama', created_at: '2026-11-01T08:00:00Z' }),
        raw({ id: 'ditolak', status: 'rejected', responded_at: '2026-11-05T08:00:00Z' }),
        raw({ id: 'batal', status: 'cancelled' }),
        raw({ id: 'tawaran', direction: 'store_to_penitip' }),
      ].map(mapProposal)
    )
    expect(list.map((p) => p.id)).toEqual(['ditolak', 'lama'])
  })
})
