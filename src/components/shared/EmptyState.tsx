import React from 'react'
import { Button } from '@/components/ui/Button'

export interface EmptyStateAction {
  label: string
  onClick: () => void
  loading?: boolean
}

export interface EmptyStateSecondaryAction {
  label: string
  onClick: () => void
}

export interface EmptyStateProps {
  /** Judul pesan keadaan kosong (wajib) */
  title: string
  /** Deskripsi panduan langkah berikutnya (wajib) */
  description: string
  /** Aksi utama yang WAJIB ada (aturan desainer: selalu ada satu aksi utama) */
  action: EmptyStateAction
  /** Aksi sekunder opsional (misal: "Impor dari daftar kontak") */
  secondaryAction?: EmptyStateSecondaryAction
  /** Ilustrasi khusus opsional (default: Warung Illustration SVG) */
  illustration?: React.ReactNode
  /** Ukuran tampilan: 'page' untuk layar penuh, 'inline' untuk di dalam kartu/bagian */
  size?: 'page' | 'inline'
  className?: string
}

/**
 * Ilustrasi Warung Ramah Lapangan (SVG Inline murni).
 * Dilengkapi atap kanopi belang hijau-oranye, pintu toko, dan lencana plus di atap.
 * Memakai token warna semantik agar adaptif otomatis di mode gelap.
 */
export function OutletIllustration({ className = 'w-28 h-28' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Bayangan halus dasar */}
      <ellipse cx="60" cy="108" rx="42" ry="5" className="fill-line-strong/30 dark:fill-line/40" />

      {/* Dinding Utama Toko */}
      <rect
        x="24"
        y="52"
        width="72"
        height="52"
        rx="4"
        className="fill-primary-soft dark:fill-surface stroke-line-strong dark:stroke-line"
        strokeWidth="2"
      />

      {/* Jendela Warung */}
      <rect
        x="32"
        y="64"
        width="22"
        height="22"
        rx="3"
        className="fill-surface dark:fill-surface-raised stroke-line-strong dark:stroke-line"
        strokeWidth="1.5"
      />
      <line
        x1="43"
        y1="64"
        x2="43"
        y2="86"
        className="stroke-line-strong dark:stroke-line"
        strokeWidth="1.5"
      />

      {/* Pintu Warung */}
      <path
        d="M64 104V70C64 67.7909 65.7909 66 68 66H80C82.2091 66 84 67.7909 84 70V104"
        className="fill-surface dark:fill-surface-raised stroke-line-strong dark:stroke-line"
        strokeWidth="1.5"
      />
      <circle cx="69" cy="85" r="1.5" className="fill-primary" />

      {/* Kanopi Atap Toko (Belang Hijau & Oranye Warm) */}
      <path
        d="M18 52L26 32H94L102 52H18Z"
        className="fill-surface dark:fill-surface-raised stroke-line-strong dark:stroke-line"
        strokeWidth="2"
      />
      {/* Garis-garis Kanopi */}
      <path d="M26 32L21 52H35L37 32H26Z" className="fill-primary/80 dark:fill-primary/60" />
      <path d="M51 32L49 52H63L65 32H51Z" className="fill-primary/80 dark:fill-primary/60" />
      <path d="M79 32L77 52H91L94 32H79Z" className="fill-primary/80 dark:fill-primary/60" />
      <path d="M37 32L35 52H49L51 32H37Z" className="fill-accent-soft/90 dark:fill-accent/30" />
      <path d="M65 32L63 52H77L79 32H65Z" className="fill-accent-soft/90 dark:fill-accent/30" />

      {/* Rumbai Kanopi Bergelombang */}
      <path
        d="M18 52C21 55 25 55 28 52C31 55 35 55 38 52C41 55 45 55 48 52C51 55 55 55 58 52C61 55 65 55 68 52C71 55 75 55 78 52C81 55 85 55 88 52C91 55 95 55 98 52C100 54 102 53 102 52"
        className="stroke-line-strong dark:stroke-line"
        strokeWidth="2"
      />

      {/* Badge Lingkaran Plus di Kanan Atap */}
      <circle
        cx="92"
        cy="26"
        r="13"
        className="fill-primary stroke-surface dark:stroke-surface-raised"
        strokeWidth="2.5"
      />
      {/* Ikon Plus Putih */}
      <path
        d="M92 20V32M86 26H98"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/**
 * Komponen Keadaan Kosong (Empty State).
 * Selalu menampilkan ilustrasi, judul, deskripsi pemandu, dan minimal 1 aksi utama.
 */
export function EmptyState({
  title,
  description,
  action,
  secondaryAction,
  illustration,
  size = 'page',
  className = '',
}: EmptyStateProps) {
  const isPage = size === 'page'

  return (
    <div
      role="region"
      aria-label={title}
      className={`empty-state flex flex-col items-center text-center ${
        isPage
          ? 'py-10 px-4 min-h-[360px] justify-center'
          : 'p-6 bg-surface border border-line rounded-2xl shadow-xs'
      } ${className}`}
    >
      {/* Area Ilustrasi */}
      <div className="mb-4 flex items-center justify-center">
        {illustration !== undefined ? illustration : <OutletIllustration />}
      </div>

      {/* Judul & Deskripsi */}
      <h3 className={`${isPage ? 'text-title-1' : 'text-title-2'} text-ink font-bold tracking-tight`}>
        {title}
      </h3>
      <p className="text-body text-ink-soft max-w-xs mt-2 mb-6">
        {description}
      </p>

      {/* Tombol Aksi Utama (Wajib) */}
      <div className="w-full max-w-xs flex flex-col items-center gap-2">
        <Button
          variant="primary"
          size={isPage ? 'lg' : 'md'}
          fullWidth
          loading={action.loading}
          onClick={action.onClick}
        >
          {action.label}
        </Button>

        {/* Tautan Aksi Sekunder (Opsional) */}
        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            className="text-button text-primary hover:text-primary-hover active:text-primary hover:underline py-2.5 px-3 min-h-[48px] rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-focus-ring"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  )
}
