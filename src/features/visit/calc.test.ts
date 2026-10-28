import { describe, it, expect } from 'vitest'
import { calculateVisit } from './calc'

describe('calculateVisit', () => {
  it('harus menghitung barang terjual dan stok setelah kunjungan', () => {
    const result = calculateVisit({
      initialStock: 10,
      returnedQty: 2,
      newStockAdded: 5,
    })
    expect(result.soldQty).toBe(8)
    expect(result.finalStock).toBe(7)
  })
})
