import { describe, it, expect } from 'vitest'
import { ApiError } from './api-client'
import { API_ERROR_MESSAGES, describeApiError, isNetworkError } from './api-errors'
import { describeLoginError, describeRegisterError } from '@/features/auth/errors'

const validation = (fields: Record<string, string>, fieldCodes?: Record<string, string>) =>
  new ApiError(400, { code: 'VALIDATION_ERROR', message: 'request validation failed', fields, fieldCodes })

describe('describeApiError', () => {
  it('gagal jaringan -> pesan koneksi', () => {
    const err = new TypeError('Failed to fetch')
    expect(isNetworkError(err)).toBe(true)
    expect(describeApiError(err).message).toBe('Tidak dapat terhubung. Periksa koneksi internetmu.')
  })

  it('5xx -> pesan server, tanpa teks teknis', () => {
    const res = describeApiError(new ApiError(502, { code: 'HTTP_ERROR', message: 'Permintaan gagal (502 Bad Gateway)' }))
    expect(res.kind).toBe('server')
    expect(res.message).toBe('Server sedang bermasalah, coba lagi beberapa saat lagi.')
  })

  it('429 -> terlalu banyak percobaan', () => {
    expect(describeApiError(new ApiError(429, { code: 'RATE_LIMITED', message: 'x' })).message).toBe(
      'Terlalu banyak percobaan, coba lagi sebentar lagi.'
    )
  })

  it('field tak dikenal (klien/server tidak sinkron) -> pesan muat ulang, bukan teks JSON', () => {
    const res = describeApiError(validation({ account_type: 'is not a recognized field' }, { account_type: 'unknown_field' }))
    expect(res.message).toBe(API_ERROR_MESSAGES.outdatedClient)
    expect(JSON.stringify(res)).not.toMatch(/json|recognized|account_type/i)
  })

  it('format lama backend (body berisi teks decoder) tetap tidak bocor', () => {
    const res = describeApiError(validation({ body: 'json: unknown field "account_type"' }))
    expect(res.message).toBe(API_ERROR_MESSAGES.badRequest)
    expect(res.message).not.toMatch(/json/i)
  })
})

describe('describeRegisterError', () => {
  it('400 per field dipetakan ke field form dengan pesan yang sama seperti validasi klien', () => {
    const res = describeRegisterError(
      validation(
        { whatsapp: 'must be a valid Indonesian whatsapp number', password: 'must be between 8 and 72 characters' },
        { whatsapp: 'invalid_format', password: 'invalid_length' }
      )
    )
    expect(res.fieldErrors).toEqual({
      whatsapp: 'Nomor WhatsApp belum benar. Contoh: 0812 3456 7890',
      password: 'Kata sandi minimal 8 karakter.',
    })
    expect(res.message).toMatch(/perlu diperbaiki/)
  })

  it('409 EMAIL_TAKEN -> pesan email terdaftar + field email ditandai', () => {
    const res = describeRegisterError(new ApiError(409, { code: 'EMAIL_TAKEN', message: 'email is already registered' }))
    expect(res.message).toBe('Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.')
    expect(res.fieldErrors.email).toBe('Email ini sudah terdaftar.')
  })
})

describe('describeLoginError', () => {
  it('401 -> email atau kata sandi salah', () => {
    const res = describeLoginError(new ApiError(401, { code: 'INVALID_CREDENTIALS', message: 'invalid email or password' }))
    expect(res.message).toBe('Email atau kata sandi salah.')
  })
})
