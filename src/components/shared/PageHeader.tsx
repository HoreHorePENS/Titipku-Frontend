import type React from 'react'

export interface PageHeaderProps {
  /** Judul utama halaman (dirender tepat sebagai satu <h1>) */
  title: React.ReactNode
  /** Deskripsi singkat atau tanggal hari ini di bawah judul */
  description?: React.ReactNode
  /** Slot tombol aksi utama di sisi kanan (atau bawah pada layar kecil) */
  actions?: React.ReactNode
  /** Badge / pill indikator opsional di samping judul */
  badge?: React.ReactNode
  className?: string
}

/**
 * Header halaman tunggal terstandarisasi untuk seluruh rute Titipku.
 * Memastikan tepat ada satu `<h1>` per halaman dengan tipografi yang konsisten:
 * Mobile: text-2xl font-black, Desktop: md:text-3xl font-extrabold text-ink
 */
export function PageHeader({
  title,
  description,
  actions,
  badge,
  className = '',
}: PageHeaderProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 sm:gap-4 ${className}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-black text-ink tracking-tight leading-snug">
            {title}
          </h1>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
        {description && (
          <p className="text-xs md:text-sm text-ink-soft mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {actions}
        </div>
      )}
    </div>
  )
}
