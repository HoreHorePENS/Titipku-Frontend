/** Perubahan foto yang belum disimpan (dipakai PhotoPicker dan form pemakainya). */
export type PhotoDraft =
  | { kind: 'keep' }
  | { kind: 'new'; blob: Blob; previewUrl: string }
  | { kind: 'remove' }

export const KEEP_PHOTO: PhotoDraft = { kind: 'keep' }
