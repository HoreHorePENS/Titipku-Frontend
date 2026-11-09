import { describe, it, expect } from 'vitest'
import { PHOTO_ERROR_MESSAGES, PHOTO_MAX_BYTES, fitWithin, validatePhotoFile } from './image-compress'
import { resolveMediaUrl } from './api-client'

describe('validasi foto sebelum diunggah', () => {
  it('menerima JPG, PNG, WebP sampai 5 MB', () => {
    expect(validatePhotoFile({ name: 'toko.jpg', type: 'image/jpeg', size: 1000 })).toBeNull()
    expect(validatePhotoFile({ name: 'toko.png', type: 'image/png', size: PHOTO_MAX_BYTES })).toBeNull()
    expect(validatePhotoFile({ name: 'toko.webp', type: 'image/webp', size: 10 })).toBeNull()
    // Beberapa HP mengirim MIME kosong: tebak dari ekstensi.
    expect(validatePhotoFile({ name: 'IMG_0001.JPEG', type: '', size: 10 })).toBeNull()
  })

  it('menolak tipe lain dan file terlalu besar dengan pesan ramah', () => {
    expect(validatePhotoFile({ name: 'foto.heic', type: 'image/heic', size: 10 })).toBe('type')
    expect(validatePhotoFile({ name: 'anim.gif', type: 'image/gif', size: 10 })).toBe('type')
    expect(validatePhotoFile({ name: 'dok.pdf', type: 'application/pdf', size: 10 })).toBe('type')
    expect(validatePhotoFile({ name: 'besar.jpg', type: 'image/jpeg', size: PHOTO_MAX_BYTES + 1 })).toBe('size')
    expect(PHOTO_ERROR_MESSAGES.size).toBe('Ukuran foto terlalu besar. Maksimal 5 MB.')
    expect(PHOTO_ERROR_MESSAGES.type).toContain('JPG, PNG, atau WebP')
  })

  it('memperkecil ke sisi terpanjang 1200px dengan rasio tetap, tanpa memperbesar', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 1200, height: 900 })
    expect(fitWithin(3000, 4000)).toEqual({ width: 900, height: 1200 })
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 })
  })
})

describe('resolveMediaUrl', () => {
  it('melengkapi path unggahan dengan base URL API, URL absolut lama apa adanya', () => {
    expect(resolveMediaUrl('/uploads/abc.webp')).toMatch(/^https?:\/\/.+\/uploads\/abc\.webp$/)
    expect(resolveMediaUrl('https://cdn.example.com/x.jpg')).toBe('https://cdn.example.com/x.jpg')
    expect(resolveMediaUrl(null)).toBeNull()
    expect(resolveMediaUrl('javascript:alert(1)')).toBeNull()
  })
})
