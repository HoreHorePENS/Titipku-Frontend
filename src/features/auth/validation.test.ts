import { describe, it, expect } from 'vitest'
import {
  isValidEmail,
  isValidName,
  isValidPassword,
  normalizeEmail,
  normalizeName,
  normalizeWhatsApp,
} from './validation'
import { registerSchema, toRegisterPayload, toLoginPayload, type RegisterFormData } from './schema'

describe('normalizeWhatsApp (cermin domain.NormalizeWhatsApp backend)', () => {
  it.each([
    ['082192929292', '6282192929292'],
    ['0821-9292-9292', '6282192929292'],
    ['0821 9292 9292', '6282192929292'],
    ['+62 821 9292 9292', '6282192929292'],
    ['6282192929292', '6282192929292'],
    ['82192929292', '6282192929292'],
    ['(0812) 3456-7890', '6281234567890'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizeWhatsApp(input)).toBe(expected)
  })

  it.each(['', '0812', '12345678901', '+1 555 0100 000', '62812345', '0812345678901234567'])(
    'menolak %s',
    (input) => {
      expect(normalizeWhatsApp(input)).toBeNull()
    }
  )
})

describe('aturan lain sama dengan backend', () => {
  it('email: trim + huruf kecil, pola sama', () => {
    expect(normalizeEmail('  Keripik@Gmail.COM ')).toBe('keripik@gmail.com')
    expect(isValidEmail(' keripik@gmail.com ')).toBe(true)
    expect(isValidEmail('keripik@gmail')).toBe(false)
    expect(isValidEmail('keripik gmail.com')).toBe(false)
  })

  it('nama: 2–120 karakter setelah trim, spasi berlebih dirapatkan', () => {
    expect(normalizeName('  ibu   rina ')).toBe('ibu rina')
    expect(isValidName(' a ')).toBe(false)
    expect(isValidName('ab')).toBe(true)
    expect(isValidName('x'.repeat(121))).toBe(false)
  })

  it('kata sandi: 8–72 byte UTF-8', () => {
    expect(isValidPassword('1234567')).toBe(false)
    expect(isValidPassword('rina1234')).toBe(true)
    expect(isValidPassword('a'.repeat(72))).toBe(true)
    expect(isValidPassword('a'.repeat(73))).toBe(false)
    // 25 emoji × 4 byte = 100 byte > 72 walau hanya 25 karakter
    expect(isValidPassword('😀'.repeat(25))).toBe(false)
  })
})

const sample: RegisterFormData = {
  accountType: 'penitip',
  businessName: '  Keripik   Rina ',
  ownerName: 'ibu   rina',
  email: ' Keripik@Gmail.com ',
  whatsapp: '0821-9292-9292',
  password: 'rina1234',
  confirmPassword: 'rina1234',
}

describe('payload yang dikirim ke backend', () => {
  it('data contoh lolos validasi dan dinormalisasi', () => {
    expect(registerSchema.safeParse(sample).success).toBe(true)
    expect(toRegisterPayload(sample)).toEqual({
      account_type: 'penitip',
      business_name: 'Keripik Rina',
      owner_name: 'ibu rina',
      email: 'keripik@gmail.com',
      whatsapp: '6282192929292',
      password: 'rina1234',
      store: undefined,
    })
  })

  it('kata sandi tidak di-trim', () => {
    expect(toLoginPayload({ email: ' A@B.co ', password: ' rahasia ' })).toEqual({
      email: 'a@b.co',
      password: ' rahasia ',
    })
  })

  it('pesan ramah untuk setiap kasus salah', () => {
    const res = registerSchema.safeParse({
      ...sample,
      email: 'keripik@',
      whatsapp: '12345',
      password: 'pendek',
      confirmPassword: 'beda',
    })
    expect(res.success).toBe(false)
    if (!res.success) {
      const byPath = Object.fromEntries(res.error.issues.map((i) => [String(i.path[0]), i.message]))
      expect(byPath.email).toBe('Format email belum benar. Contoh: nama@email.com')
      expect(byPath.whatsapp).toBe('Nomor WhatsApp belum benar. Contoh: 0812 3456 7890')
      expect(byPath.password).toBe('Kata sandi minimal 8 karakter.')
      expect(byPath.confirmPassword).toBe('Kata sandi tidak sama.')
    }
  })

  it('field kosong memberi pesan "wajib diisi"', () => {
    const res = registerSchema.safeParse({ ...sample, email: '  ', whatsapp: '', ownerName: '' })
    expect(res.success).toBe(false)
    if (!res.success) {
      const messages = res.error.issues.map((i) => i.message)
      expect(messages).toContain('Email wajib diisi.')
      expect(messages).toContain('Nomor WhatsApp wajib diisi.')
      expect(messages).toContain('Nama wajib diisi.')
    }
  })
})
