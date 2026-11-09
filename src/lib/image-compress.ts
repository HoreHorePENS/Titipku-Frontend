/**
 * Validasi & kompresi foto di browser sebelum diunggah.
 * Backend tetap memvalidasi ulang dari isi file dan membuang metadata (EXIF/GPS).
 */

export const PHOTO_MAX_BYTES = 5 * 1024 * 1024
export const PHOTO_MAX_SIDE = 1200
export const PHOTO_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const PHOTO_ACCEPT_ATTR = PHOTO_ACCEPTED_TYPES.join(',')

export type PhotoErrorCode = 'type' | 'size' | 'decode'

export const PHOTO_ERROR_MESSAGES: Record<PhotoErrorCode, string> = {
  type: 'Format foto belum didukung. Pilih foto JPG, PNG, atau WebP.',
  size: 'Ukuran foto terlalu besar. Maksimal 5 MB.',
  decode: 'Foto tidak dapat dibaca. Coba pilih foto lain.',
}

export class PhotoValidationError extends Error {
  readonly code: PhotoErrorCode
  constructor(code: PhotoErrorCode) {
    super(PHOTO_ERROR_MESSAGES[code])
    this.name = 'PhotoValidationError'
    this.code = code
  }
}

const EXTENSION_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

/** Periksa tipe (dari MIME, atau ekstensi bila MIME kosong) dan ukuran file asli. */
export function validatePhotoFile(file: Pick<File, 'type' | 'size' | 'name'>): PhotoErrorCode | null {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  const type = file.type || EXTENSION_TYPES[extension] || ''
  if (!(PHOTO_ACCEPTED_TYPES as readonly string[]).includes(type)) return 'type'
  if (file.size > PHOTO_MAX_BYTES) return 'size'
  return null
}

/** Ukuran baru yang muat dalam kotak maxSide x maxSide dengan rasio tetap (tidak memperbesar). */
export function fitWithin(width: number, height: number, maxSide = PHOTO_MAX_SIDE) {
  const longest = Math.max(width, height)
  if (longest <= maxSide) return { width, height }
  const scale = maxSide / longest
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

async function loadBitmap(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      // Terapkan orientasi EXIF agar foto kamera HP tidak miring.
      return await createImageBitmap(file, { imageOrientation: 'from-image' })
    } catch {
      // Lanjut ke fallback <img>.
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

/**
 * Perkecil foto ke sisi terpanjang PHOTO_MAX_SIDE dan simpan sebagai WebP.
 * Menggambar ulang di canvas sekaligus membuang metadata EXIF/GPS dari file asli.
 */
export async function compressPhoto(file: File, quality = 0.82): Promise<Blob> {
  const invalid = validatePhotoFile(file)
  if (invalid) throw new PhotoValidationError(invalid)

  let source: ImageBitmap | HTMLImageElement
  try {
    source = await loadBitmap(file)
  } catch {
    throw new PhotoValidationError('decode')
  }

  const { width, height } = fitWithin(source.width, source.height)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new PhotoValidationError('decode')
  context.imageSmoothingQuality = 'high'
  context.drawImage(source, 0, 0, width, height)
  if ('close' in source) source.close()

  // Browser lama yang tidak bisa meng-encode WebP mengembalikan PNG: pakai JPEG sebagai gantinya.
  let blob = await canvasToBlob(canvas, 'image/webp', quality)
  if (!blob || blob.type !== 'image/webp') {
    blob = await canvasToBlob(canvas, 'image/jpeg', quality)
  }
  if (!blob) throw new PhotoValidationError('decode')
  if (blob.size > PHOTO_MAX_BYTES) throw new PhotoValidationError('size')
  return blob
}
