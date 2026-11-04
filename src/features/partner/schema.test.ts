import { describe, it, expect } from 'vitest'
import { partnerFormSchema } from './schema'

describe('partnerFormSchema validation', () => {
  it('valid untuk input lengkap dan nomor telepon Indonesia yang valid', () => {
    const valid = {
      name: 'Warung Barokah',
      ownerName: 'Bu Siti',
      whatsapp: '081234567890',
      address: 'Jl. Rungkut Asri 14',
      isActive: true,
    }
    const result = partnerFormSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('gagal jika whatsapp kurang dari 9 digit angka', () => {
    const shortPhone = {
      name: 'Warung Barokah',
      ownerName: 'Bu Siti',
      whatsapp: '081234',
      address: 'Jl. Rungkut Asri 14',
      isActive: true,
    }
    const result = partnerFormSchema.safeParse(shortPhone)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('minimal 9 digit')
    }
  })

  it('gagal jika nama warung atau nama pemilik atau alamat kosong', () => {
    const emptyFields = {
      name: '',
      ownerName: '',
      whatsapp: '081234567890',
      address: '',
    }
    const result = partnerFormSchema.safeParse(emptyFields)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(3)
    }
  })
})
