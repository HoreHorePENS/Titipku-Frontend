import { describe, it, expect } from 'vitest'
import { productFormSchema } from './schema'

describe('productFormSchema', () => {
  it('berhasil memvalidasi input produk yang valid', () => {
    const validData = {
      name: 'Keripik Pisang Original 100g',
      consignPrice: 12000,
      retailPrice: 15000,
      shelfLifeDays: 30,
      isActive: true,
    }

    const result = productFormSchema.safeParse(validData)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.name).toBe('Keripik Pisang Original 100g')
      expect(result.data.consignPrice).toBe(12000)
      expect(result.data.retailPrice).toBe(15000)
      expect(result.data.shelfLifeDays).toBe(30)
      expect(result.data.isActive).toBe(true)
    }
  })

  it('menolak nama produk kurang dari 2 karakter', () => {
    const result = productFormSchema.safeParse({
      name: 'A',
      consignPrice: 10000,
      retailPrice: 12000,
      shelfLifeDays: 14,
      isActive: true,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('minimal 2 karakter')
    }
  })

  it('menolak harga eceran yang lebih kecil dari harga titip konsinyasi', () => {
    const result = productFormSchema.safeParse({
      name: 'Keripik Tempe Balado',
      consignPrice: 15000,
      retailPrice: 10000, // Invalid: retail < consign
      shelfLifeDays: 20,
      isActive: true,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.includes('retailPrice'))
      expect(issue).toBeDefined()
      expect(issue?.message).toBe('Harga eceran tidak boleh lebih kecil dari harga titip')
    }
  })

  it('menolak masa simpan kurang dari 1 hari atau desimal', () => {
    const zeroDays = productFormSchema.safeParse({
      name: 'Roti Manis',
      consignPrice: 5000,
      retailPrice: 6000,
      shelfLifeDays: 0,
      isActive: true,
    })
    expect(zeroDays.success).toBe(false)

    const floatDays = productFormSchema.safeParse({
      name: 'Roti Manis',
      consignPrice: 5000,
      retailPrice: 6000,
      shelfLifeDays: 2.5,
      isActive: true,
    })
    expect(floatDays.success).toBe(false)
  })
})
