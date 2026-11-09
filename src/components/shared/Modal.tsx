import { useEffect, useRef } from 'react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  /** Judul modal */
  title: React.ReactNode
  /** Sub-deskripsi modal di bawah judul */
  description?: React.ReactNode
  /** Badge / indikator tambahan di samping judul */
  badge?: React.ReactNode
  /** Konten isi modal (body) */
  children: React.ReactNode
  /** Slot tombol aksi bawah (footer) */
  footer?: React.ReactNode
  /** Lebar maksimal modal dialog (default: 'lg' = max-w-lg) */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  /** Apakah dapat ditutup dengan mengklik area gelap latar (default: true) */
  closeOnBackdropClick?: boolean
  className?: string
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
}

/**
 * Komponen modal dialog tunggal terstandarisasi untuk seluruh pop-up Titipku.
 * Menyediakan backdrop gelap, penutupan via tombol Esc, tombol close (✕) tetap,
 * scrollable body, dan footer aksi dengan styling token seragam.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  badge,
  children,
  footer,
  maxWidth = 'lg',
  closeOnBackdropClick = true,
  className = '',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Tangani penekanan tombol Escape untuk menutup modal
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/50 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={dialogRef}
        className={`bg-surface border border-line rounded-2xl w-full ${maxWidthClasses[maxWidth]} shadow-xl overflow-hidden flex flex-col max-h-[90vh] font-sans animate-in zoom-in-95 duration-150 ${className}`}
      >
        {/* Header Modal Terstandarisasi */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-line bg-page/50 shrink-0">
          <div className="min-w-0 flex-1 pr-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 id="modal-title" className="text-title-2 text-ink">
                {title}
              </h2>
              {badge && <div className="shrink-0">{badge}</div>}
            </div>
            {description && (
              <p className="text-caption text-ink-soft mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-ink-soft hover:text-ink hover:bg-surface-raised transition-colors cursor-pointer shrink-0"
            aria-label="Tutup modal"
          >
            ✕
          </button>
        </div>

        {/* Konten Body Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          {children}
        </div>

        {/* Footer Aksi Opsional */}
        {footer && (
          <div className="p-4 sm:p-5 border-t border-line bg-page/50 flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
