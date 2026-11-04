import type React from 'react'

export type StatCardTone = 'default' | 'primary' | 'danger' | 'success' | 'warning'

export interface StatCardProps {
  /** Label nama metrik / statistik (ditampilkan huruf kapital halus) */
  label: string
  /** Nilai utama metrik (misal Rupiah atau jumlah angka bulat) */
  value: React.ReactNode
  /** Sub-nilai atau unit satuan di samping nilai (misal: '/ pcs' atau '(3 aktif)') */
  subValue?: React.ReactNode
  /** Ikon dekoratif opsional */
  icon?: React.ReactNode
  /** Keterangan tambahan atau rasio di bawah nilai angka */
  hint?: React.ReactNode
  /** Warna aksen untuk nilai metrik */
  tone?: StatCardTone
  /** Callback jika kartu dapat diklik */
  onClick?: () => void
  className?: string
}

const toneValueClasses: Record<StatCardTone, string> = {
  default: 'text-ink',
  primary: 'text-primary',
  danger: 'text-danger',
  success: 'text-success',
  warning: 'text-accent',
}

/**
 * Kartu metrik/statistik angka terstandarisasi untuk seluruh halaman Titipku.
 * Memastikan satu ukuran font angka (`text-2xl md:text-3xl`), radius `rounded-2xl`,
 * dan padding konsisten `p-4 md:p-5`.
 */
export function StatCard({
  label,
  value,
  subValue,
  icon,
  hint,
  tone = 'default',
  onClick,
  className = '',
}: StatCardProps) {
  const isClickable = Boolean(onClick)

  return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick?.()
              }
            }
          : undefined
      }
      className={`bg-surface border border-line rounded-2xl p-4 md:p-5 flex flex-col justify-between shadow-xs transition-all ${
        isClickable
          ? 'cursor-pointer hover:border-line-strong hover:bg-surface-raised active:scale-[0.99]'
          : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-bold text-ink-soft uppercase tracking-wider block">
          {label}
        </span>
        {icon && <div className="text-ink-soft shrink-0">{icon}</div>}
      </div>

      <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
        <div
          className={`text-2xl md:text-3xl font-black tabular-nums tracking-tight ${toneValueClasses[tone]}`}
        >
          {value}
        </div>
        {subValue && (
          <span className="text-xs md:text-sm font-semibold text-ink-soft">
            {subValue}
          </span>
        )}
      </div>

      {hint && (
        <div className="mt-2 text-xs text-ink-soft leading-normal">
          {hint}
        </div>
      )}
    </div>
  )
}

export interface StatCardGridProps {
  children: React.ReactNode
  /** Jumlah kolom pada desktop (default: 3) */
  columns?: 2 | 3 | 4
  className?: string
}

export function StatCardGrid({
  children,
  columns = 3,
  className = '',
}: StatCardGridProps) {
  const gridClasses = {
    2: 'grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4',
    3: 'grid grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4',
    4: 'grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4',
  }

  return (
    <div className={`w-full ${gridClasses[columns]} ${className}`}>
      {children}
    </div>
  )
}
