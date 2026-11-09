import { describeApiError } from './api-errors'

/** Pesan ramah untuk kegagalan unggah foto (validasi server field "file", jaringan, dll.). */
export function describePhotoError(err: unknown): string {
  const friendly = describeApiError<'file'>(err, {
    fieldMap: { file: 'file' },
    fieldMessages: {
      file: {
        invalid_choice: 'Format foto belum didukung. Pilih foto JPG, PNG, atau WebP.',
        invalid_length: 'Ukuran foto terlalu besar. Maksimal 5 MB.',
        out_of_range: 'Resolusi foto terlalu besar. Pilih foto lain.',
        required: 'Pilih foto terlebih dahulu.',
        default: 'Foto tidak dapat dibaca. Coba pilih foto lain.',
      },
    },
  })
  return friendly.fieldErrors.file ?? friendly.message
}
