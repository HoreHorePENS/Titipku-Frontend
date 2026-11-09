import { describe, it, expect } from 'vitest'
import { mapProposal, type RawProposal } from './proposals-api'
import { toStoreOffer } from './store-offers'
import { toConsignmentRequest } from './consignment-requests'

const raw: RawProposal = {
  id: 'prop-1',
  direction: 'penitip_to_store',
  status: 'pending',
  message: 'Ingin titip sambal',
  shelf_location: 'Rak depan',
  estimated_capacity: '20 bungkus',
  created_at: '2026-11-09T10:00:00Z',
  responded_at: null,
  store: { id: 's1', name: 'Warung Siti', category: 'warung', address: 'Jl. Menur 12', whatsapp: '6281351273722', photo_url: '/uploads/0123456789abcdef0123456789abcdef.webp', owner_name: 'Bu Siti', latitude: -7.28, longitude: 112.76 },
  business: { id: 'b2', name: 'Sambal Bu Ani', owner_name: 'Ani', whatsapp: '6285700000033', address: null },
  items: [{ product_id: 'p9', name: 'Sambal Bawang', photo_path: null, consign_price: 18000, retail_price: 22000, shelf_life_days: 30, qty: 10 }],
}

describe('pemetaan proposal asli', () => {
  it('mapProposal mengubah snake_case ke model UI dan me-resolve URL foto', () => {
    const proposal = mapProposal(raw)
    expect(proposal.store.photoUrl).toMatch(/^https?:\/\/.+\/uploads\/0123456789abcdef0123456789abcdef\.webp$/)
    expect(proposal.items[0]).toMatchObject({ productId: 'p9', qty: 10, consignPrice: 18000, retailPrice: 22000 })
  })

  it('toConsignmentRequest untuk pemilik toko', () => {
    const request = toConsignmentRequest(mapProposal(raw))
    expect(request).toMatchObject({
      origin: 'request',
      producerBusinessName: 'Sambal Bu Ani',
      producerAddress: null,
      status: 'pending',
      note: 'Ingin titip sambal',
    })
    expect(request.items[0].productName).toBe('Sambal Bawang')
  })

  it('toStoreOffer untuk penitip', () => {
    const offer = toStoreOffer(mapProposal({ ...raw, direction: 'store_to_penitip' }))
    expect(offer).toMatchObject({ storeName: 'Warung Siti', storeOwnerName: 'Bu Siti', shelfLocation: 'Rak depan', estimatedCapacity: '20 bungkus' })
  })
})
