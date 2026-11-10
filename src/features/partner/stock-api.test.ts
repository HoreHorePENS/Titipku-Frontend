import { describe, expect, it } from 'vitest'
import { consignedProducts, stockToVisitItems, type PartnerStockEntry } from './stock-api'

const entry = (over: Partial<PartnerStockEntry>): PartnerStockEntry => ({
  productId: 'a',
  productName: 'Produk A',
  photoUrl: null,
  consignPrice: 8000,
  isActive: true,
  onShelf: 0,
  nearestExpiry: null,
  everConsigned: false,
  ...over,
})

describe('stockToVisitItems', () => {
  it('memakai stok di rak sebagai stok kemarin untuk produk aktif', () => {
    const items = stockToVisitItems([entry({ productId: 'a', onShelf: 5 }), entry({ productId: 'b' })])
    expect(items.map((it) => [it.productId, it.prevStock, it.remaining, it.newDrop])).toEqual([
      ['a', 5, 5, 0],
      ['b', 0, 0, 0],
    ])
    expect(items[0].consignPrice).toBe(8000)
  })

  it('tidak memasukkan produk nonaktif (tidak bisa dicatat di kunjungan)', () => {
    const items = stockToVisitItems([
      entry({ productId: 'a', isActive: false, onShelf: 2 }),
      entry({ productId: 'b', isActive: true, onShelf: 0 }),
    ])
    expect(items.map((it) => it.productId)).toEqual(['b'])
  })
})

describe('consignedProducts', () => {
  it('hanya produk yang pernah dititipkan atau masih ada di rak', () => {
    const list = consignedProducts([
      entry({ productId: 'a', everConsigned: true }),
      entry({ productId: 'b' }),
      entry({ productId: 'c', onShelf: 3 }),
    ])
    expect(list.map((e) => e.productId)).toEqual(['a', 'c'])
  })
})
