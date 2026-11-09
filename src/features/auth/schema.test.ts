import { describe, it, expect } from 'vitest'
import { registerSchema, loginSchema } from './schema'

describe('Auth Schemas', () => {
  describe('loginSchema', () => {
    it('memvalidasi email dan password login yang benar', () => {
      const res = loginSchema.safeParse({
        email: 'rina@keripik.id',
        password: 'password123',
      })
      expect(res.success).toBe(true)
    })

    it('menolak email kosong atau format salah', () => {
      const res = loginSchema.safeParse({
        email: 'bukan-email',
        password: 'password123',
      })
      expect(res.success).toBe(false)
    })
  })

  describe('registerSchema', () => {
    it('memvalidasi pendaftaran usaha baru dengan format lengkap', () => {
      const res = registerSchema.safeParse({
        businessName: 'Keripik Pisang Rina',
        ownerName: 'Bu Rina',
        email: 'rina@keripik.id',
        whatsapp: '081234567890',
        password: 'password123',
        confirmPassword: 'password123',
      })
      expect(res.success).toBe(true)
    })

    it('menolak jika konfirmasi kata sandi tidak sama dengan kata sandi', () => {
      const res = registerSchema.safeParse({
        businessName: 'Keripik Pisang Rina',
        ownerName: 'Bu Rina',
        email: 'rina@keripik.id',
        whatsapp: '081234567890',
        password: 'password123',
        confirmPassword: 'passwordBeda456',
      })
      expect(res.success).toBe(false)
      if (!res.success) {
        const issue = res.error.issues.find((i) => i.path.includes('confirmPassword'))
        expect(issue?.message).toBe('Kata sandi tidak sama.')
      }
    })

    it('menolak nomor WhatsApp yang terlalu pendek (<9 digit)', () => {
      const res = registerSchema.safeParse({
        businessName: 'Keripik Pisang Rina',
        ownerName: 'Bu Rina',
        email: 'rina@keripik.id',
        whatsapp: '0812',
        password: 'password123',
        confirmPassword: 'password123',
      })
      expect(res.success).toBe(false)
    })

    it('menolak kata sandi kurang dari 8 karakter', () => {
      const res = registerSchema.safeParse({
        businessName: 'Keripik Pisang Rina',
        ownerName: 'Bu Rina',
        email: 'rina@keripik.id',
        whatsapp: '081234567890',
        password: 'pass',
        confirmPassword: 'pass',
      })
      expect(res.success).toBe(false)
    })

    it('memvalidasi pendaftaran pemilik toko dengan format lengkap', () => {
      const res = registerSchema.safeParse({
        accountType: 'pemilik_toko',
        storeName: 'Warung Barokah Bu Siti',
        storeCategory: 'warung',
        storeAddress: 'Jl. Menur No. 12 Surabaya',
        storeLat: -7.2575,
        storeLng: 112.7521,
        ownerName: 'Bu Siti',
        email: 'siti@warung.id',
        whatsapp: '081234567890',
        password: 'password123',
        confirmPassword: 'password123',
      })
      expect(res.success).toBe(true)
    })

    it('memvalidasi pendaftaran pemilik toko jika lat/lng tidak diisi', () => {
      const res = registerSchema.safeParse({
        accountType: 'pemilik_toko',
        storeName: 'Warung Barokah Bu Siti',
        storeAddress: 'Jl. Menur No. 12 Surabaya',
        ownerName: 'Bu Siti',
        email: 'siti@warung.id',
        whatsapp: '081234567890',
        password: 'password123',
        confirmPassword: 'password123',
      })
      expect(res.success).toBe(true)
    })

    it('menolak pendaftaran pemilik toko tanpa nama toko atau alamat toko', () => {
      const res = registerSchema.safeParse({
        accountType: 'pemilik_toko',
        storeName: '',
        storeAddress: '',
        ownerName: 'Bu Siti',
        email: 'siti@warung.id',
        whatsapp: '081234567890',
        password: 'password123',
        confirmPassword: 'password123',
      })
      expect(res.success).toBe(false)
      if (!res.success) {
        const paths = res.error.issues.map((i) => i.path[0])
        expect(paths).toContain('storeName')
        expect(paths).toContain('storeAddress')
      }
    })
  })
})
