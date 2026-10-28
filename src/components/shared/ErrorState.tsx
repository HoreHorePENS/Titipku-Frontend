import { formatJamWIB } from '@/lib/format'
import { Button } from '@/components/ui/Button'

export type ErrorType = 'network' | 'server' | 'generic'

export interface ErrorStateProps {
  /** Jenis kesalahan: 'network' (koneksi), 'server', atau 'generic' */
  type?: ErrorType
  /** Judul pesan error kustom (opsional) */
  title?: string
  /** Deskripsi penyebab & jalan keluar kustom (opsional) */
  description?: string
  /** Callback untuk mencoba memuat ulang data (wajib) */
  onRetry: () => void
  /** Cap waktu data lama yang tersimpan di cache lokal (opsional) */
  lastUpdatedAt?: string | Date
  /** Callback jika pengguna memilih melihat data lama (opsional) */
  onViewCachedData?: () => void
  /** Ukuran tampilan: 'page' (layar penuh) atau 'inline' (dalam kartu/komponen) */
  size?: 'page' | 'inline'
  className?: string
}

/**
 * Ikon Koneksi Terputus (SVG Inline).
 * Menggambarkan gelombang sinyal nirkabel dengan garis coret silang diagonal.
 */
export function DisconnectedIcon({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <line x1="2" y1="2" x2="22" y2="22" />
      <path d="M8.5 16.5a5 5 0 0 1 7 0" />
      <path d="M5 12.5a10 10 0 0 1 5.5-2.5" />
      <path d="M19 12.5a10 10 0 0 0-3.5-2.2" />
      <path d="M2 8.5a15 15 0 0 1 7.2-2.3" />
      <path d="M22 8.5a15 15 0 0 0-5.8-2.1" />
      <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3" />
    </svg>
  )
}

/**
 * Komponen Keadaan Gagal / Error State.
 * Mengikuti spesifikasi:
 * - Kartu berborder merah muda halus
 * - Ikon lingkaran merah muda dengan simbol koneksi terputus
 * - Penjelasan penyebab + jalan keluar
 * - Dua tombol: "Lihat data lama" (outline) dan "Coba lagi" (primary) bila ada data lama
 */
export function ErrorState({
  type = 'generic',
  title,
  description,
  onRetry,
  lastUpdatedAt,
  onViewCachedData,
  size = 'page',
  className = '',
}: ErrorStateProps) {
  const isPage = size === 'page'

  // Default teks berdasarkan jenis kegagalan
  let defaultTitle = 'Gagal memuat data'
  let defaultDescription = 'Terjadi kesalahan sistem. Silakan coba beberapa saat lagi.'

  if (type === 'network') {
    defaultTitle = 'Gagal memuat tagihan'
    defaultDescription = 'Koneksi terputus. Periksa sinyal internet Anda.'
  } else if (type === 'server') {
    defaultTitle = 'Gangguan server'
    defaultDescription = 'Server Titipku sedang sibuk atau dalam pemeliharaan.'
  }

  // Jika ada data lama tersimpan, tambahkan keterangan ketersediaan data cache
  let computedDescription = description || defaultDescription
  if (lastUpdatedAt && !description) {
    const formattedTime = formatJamWIB(lastUpdatedAt)
    computedDescription = `Koneksi terputus. Data terakhir dari ${formattedTime} masih bisa dilihat.`
  }

  const computedTitle = title || defaultTitle

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`error-state flex flex-col items-center text-center rounded-2xl border border-red-200 dark:border-red-900/60 bg-surface shadow-xs transition-colors ${
        isPage ? 'py-10 px-4 min-h-[360px] justify-center max-w-md mx-auto my-4' : 'p-6 w-full'
      } ${className}`}
    >
      {/* Lingkaran Ikon Merah Muda */}
      <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center mb-4 shrink-0 shadow-xs">
        <DisconnectedIcon className="w-7 h-7" />
      </div>

      {/* Judul & Deskripsi */}
      <h3 className={`${isPage ? 'text-title-1' : 'text-title-2'} text-ink font-bold tracking-tight`}>
        {computedTitle}
      </h3>
      <p className="text-body text-ink-soft max-w-xs mt-2 mb-6">
        {computedDescription}
      </p>

      {/* Baris Tombol Aksi */}
      <div
        className={`w-full max-w-xs flex ${
          lastUpdatedAt ? 'flex-row gap-3' : 'flex-col gap-2'
        } items-center justify-center`}
      >
        {/* Tombol Lihat Data Lama (hanya jika ada data lama di cache) */}
        {lastUpdatedAt && (
          <Button
            variant="outline"
            size={isPage ? 'lg' : 'md'}
            className="flex-1"
            onClick={onViewCachedData || onRetry}
          >
            Lihat data lama
          </Button>
        )}

        {/* Tombol Utama Coba Lagi (Wajib) */}
        <Button
          variant="primary"
          size={isPage ? 'lg' : 'md'}
          className={lastUpdatedAt ? 'flex-1' : 'w-full'}
          onClick={onRetry}
        >
          Coba lagi
        </Button>
      </div>
    </div>
  )
}
