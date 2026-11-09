import { describe, it, expect } from 'vitest'
import { mapProducer } from './penitip-businesses'
import type { RawProducer, RawProposal } from './proposals-api'

function proposal(overrides: Partial<RawProposal> = {}): RawProposal {
  return {
    id: 'prop-1',
    direction: 'store_to_penitip',
    status: 'pending',
    message: 'Rak depan kasir',
    shelf_location: null,
    estimated_capacity: null,
    created_at: '2026-11-09T10:00:00Z',
    responded_at: null,
    store: { id: 's1', name: 'Warung Siti', category: 'warung', address: 'Jl. Menur', whatsapp: '6281', photo_url: null, owner_name: 'Siti', latitude: 0, longitude: 0 },
    business: { id: 'b1', name: 'Keripik Rina', owner_name: 'Rina', whatsapp: null, address: null },
    items: [],
    ...overrides,
  }
}

function producer(overrides: Partial<RawProducer> = {}): RawProducer {
  return {
    id: 'b1',
    name: 'Keripik Rina',
    owner_name: 'ibu rina',
    whatsapp: '6282192929292',
    address: null,
    product_count: 3,
    products: [
      { id: 'p1', name: 'Keripik A', photo_path: null, consign_price: 12000, retail_price: 15000, shelf_life_days: 90, is_active: true },
      { id: 'p2', name: 'Keripik B', photo_path: '/uploads/0123456789abcdef0123456789abcdef.webp', consign_price: 10000, retail_price: 13000, shelf_life_days: 60, is_active: true },
    ],
    is_partner: false,
    latest_proposal: null,
    ...overrides,
  }
}

describe('mapProducer (data asli dari /v1/producers)', () => {
  it('tanpa proposal -> belum ditawari, foto sampul dari produk pertama yang berfoto', () => {
    const business = mapProducer(producer())
    expect(business.offerStatus).toBe('none')
    expect(business.productCount).toBe(3)
    expect(business.photoUrl).toMatch(/\/uploads\/0123456789abcdef0123456789abcdef\.webp$/)
    expect(business.topProducts[0]).toMatchObject({ name: 'Keripik A', consignPrice: 12000, suggestedRetailPrice: 15000 })
  })

  it('status hubungan mengikuti proposal terakhir', () => {
    expect(mapProducer(producer({ latest_proposal: proposal() })).offerStatus).toBe('pending')
    expect(mapProducer(producer({ latest_proposal: proposal({ direction: 'penitip_to_store' }) })).offerStatus).toBe('incoming')
    expect(mapProducer(producer({ latest_proposal: proposal({ status: 'rejected' }) })).offerStatus).toBe('rejected')
    expect(mapProducer(producer({ latest_proposal: proposal({ status: 'cancelled' }) })).offerStatus).toBe('none')
    expect(mapProducer(producer({ is_partner: true, latest_proposal: proposal({ status: 'accepted' }) })).offerStatus).toBe('accepted')
  })

  it('menyimpan id proposal untuk pembatalan', () => {
    expect(mapProducer(producer({ latest_proposal: proposal({ id: 'xyz' }) })).offerId).toBe('xyz')
  })
})
