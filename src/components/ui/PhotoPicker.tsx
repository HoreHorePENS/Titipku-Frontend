import { useEffect, useId, useRef, useState } from 'react'
import {
  PHOTO_ACCEPT_ATTR,
  PHOTO_ERROR_MESSAGES,
  PhotoValidationError,
  compressPhoto,
} from '@/lib/image-compress'
import { KEEP_PHOTO, type PhotoDraft } from './photo-draft'

interface PhotoPickerProps {
  label: string
  /** Foto yang sudah tersimpan di server (URL lengkap) atau null. */
  savedUrl: string | null
  draft: PhotoDraft
  onDraftChange: (draft: PhotoDraft) => void
  /** Ikon placeholder saat belum ada foto. */
  placeholder?: 'store' | 'product'
  hint?: string
  disabled?: boolean
}

function PlaceholderIcon({ kind }: { kind: 'store' | 'product' }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {kind === 'store' ? (
        <path d="M3 9l1-5h16l1 5v2H3V9zm0 4v7a1 1 0 001 1h16a1 1 0 001-1v-7H3zm7 4h4" />
      ) : (
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      )}
    </svg>
  )
}

/**
 * Pemilih foto: dari galeri/berkas atau langsung dari kamera HP.
 * Foto dikompres di browser (maks. 1200px, WebP) dan baru diunggah saat form disimpan.
 */
export function PhotoPicker({
  label,
  savedUrl,
  draft,
  onDraftChange,
  placeholder = 'store',
  hint = 'JPG, PNG, atau WebP, maksimal 5 MB. Foto diperkecil otomatis sebelum diunggah.',
  disabled = false,
}: PhotoPickerProps) {
  const id = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Bebaskan object URL pratinjau saat diganti atau komponen dilepas.
  const previewUrl = draft.kind === 'new' ? draft.previewUrl : null
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const shownUrl = draft.kind === 'new' ? draft.previewUrl : draft.kind === 'remove' ? null : savedUrl
  const hasPhoto = Boolean(shownUrl)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    setIsProcessing(true)
    try {
      const blob = await compressPhoto(file)
      onDraftChange({ kind: 'new', blob, previewUrl: URL.createObjectURL(blob) })
    } catch (err) {
      setError(err instanceof PhotoValidationError ? err.message : PHOTO_ERROR_MESSAGES.decode)
    } finally {
      setIsProcessing(false)
      if (fileRef.current) fileRef.current.value = ''
      if (cameraRef.current) cameraRef.current.value = ''
    }
  }

  const buttonClass =
    'inline-flex items-center justify-center gap-1.5 px-3 rounded-xl border text-label font-semibold min-h-[44px] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <div className="flex flex-col gap-2">
      <span id={`${id}-label`} className="text-label font-semibold text-ink">
        {label}
      </span>

      <div className="flex items-start gap-3">
        <div className="w-28 shrink-0 aspect-[4/3] rounded-xl overflow-hidden border border-line bg-slate-50 flex items-center justify-center text-slate-400">
          {hasPhoto ? (
            <img src={shownUrl ?? undefined} alt={`Pratinjau ${label.toLowerCase()}`} className="w-full h-full object-cover" />
          ) : (
            <PlaceholderIcon kind={placeholder} />
          )}
        </div>

        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby={`${id}-label`}>
            <button
              type="button"
              disabled={disabled || isProcessing}
              onClick={() => fileRef.current?.click()}
              className={`${buttonClass} bg-slate-900 text-white border-slate-900 hover:bg-slate-800`}
            >
              {isProcessing ? 'Memproses foto…' : hasPhoto ? 'Ganti foto' : 'Pilih foto'}
            </button>
            <button
              type="button"
              disabled={disabled || isProcessing}
              onClick={() => cameraRef.current?.click()}
              className={`${buttonClass} bg-white text-ink border-line hover:bg-slate-50`}
            >
              Ambil dari kamera
            </button>
            {hasPhoto && (
              <button
                type="button"
                disabled={disabled || isProcessing}
                onClick={() => {
                  setError(null)
                  onDraftChange(savedUrl ? { kind: 'remove' } : KEEP_PHOTO)
                }}
                className={`${buttonClass} bg-white text-danger border-line hover:bg-red-50`}
              >
                Hapus
              </button>
            )}
            {draft.kind !== 'keep' && (
              <button
                type="button"
                disabled={disabled || isProcessing}
                onClick={() => {
                  setError(null)
                  onDraftChange(KEEP_PHOTO)
                }}
                className={`${buttonClass} bg-white text-ink-soft border-transparent hover:text-ink`}
              >
                Batalkan perubahan
              </button>
            )}
          </div>
          <p className="text-caption text-ink-soft">
            {draft.kind === 'new'
              ? 'Pratinjau foto baru. Foto diunggah saat kamu menyimpan.'
              : draft.kind === 'remove'
                ? 'Foto akan dihapus saat kamu menyimpan.'
                : hint}
          </p>
          {error && (
            <p role="alert" className="text-caption font-medium text-danger">
              {error}
            </p>
          )}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={PHOTO_ACCEPT_ATTR}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={cameraRef}
        type="file"
        accept={PHOTO_ACCEPT_ATTR}
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
