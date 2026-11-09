import { describe, it, expect } from 'vitest'
import { visitItemSchema, visitFormSchema } from './schema'

describe('visitFormSchema & visitItemSchema validation', () => {
  it('valid jika sisa + retur <= prevStock', () => {
    const validItem = {
      productId: 'prod-1',
      productName: 'Keripik Pisang 100g',
      consignPrice: 12000,
      prevStock: 10,
      remaining: 5,
      returned: 2,
      newDrop: 10,
    }
    const res = visitItemSchema.safeParse(validItem)
    expect(res.success).toBe(true)
  })

  it('gagal jika sisa + retur melebihi stok kemarin', () => {
    const invalidItem = {
      productId: 'prod-1',
      productName: 'Keripik Pisang 100g',
      consignPrice: 12000,
      prevStock: 10,
      remaining: 8,
      returned: 4, // 8 + 4 = 12 > 10
      newDrop: 5,
    }
    const res = visitItemSchema.safeParse(invalidItem)
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error.issues[0].message).toContain('melebihi stok kemarin')
    }
  })

  it('validasi form kunjungan lengkap', () => {
    const validForm = {
      partnerId: 'warung-1',
      receivedBy: 'Bu Sri',
      items: [
        {
          productId: 'prod-1',
          productName: 'Keripik Pisang 100g',
          consignPrice: 12000,
          prevStock: 10,
          remaining: 5,
          returned: 1,
          newDrop: 5,
        },
      ],
    }
    const res = visitFormSchema.safeParse(validForm)
    expect(res.success).toBe(true)
  })

  it('gagal jika receivedBy kosong', () => {
    const invalidForm = {
      partnerId: 'warung-1',
      receivedBy: '   ',
      items: [
        {
          productId: 'prod-1',
          productName: 'Keripik Pisang 100g',
          consignPrice: 12000,
          prevStock: 10,
          remaining: 5,
          returned: 1,
          newDrop: 5,
        },
      ],
    }
    const res = visitFormSchema.safeParse(invalidForm)
    expect(res.success).toBe(false)
    if (!res.success) {
      expect(res.error.issues[0].message).toContain('Nama penerima barang wajib diisi')
    }
  })
})
