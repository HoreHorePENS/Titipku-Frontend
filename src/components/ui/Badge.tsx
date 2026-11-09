import React from 'react'

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral'
export type BadgeMarker = 'circle' | 'square' | 'triangle' | 'ring'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
  marker?: BadgeMarker
  size?: BadgeSize
  children: React.ReactNode
}

// Bahasa bentuk penanda yang konsisten:
// circle = aman / baik (success)
// square = perlu dipantau (warning)
// triangle = bahaya / kritis (danger)
// ring = netral / informasi (neutral)
const defaultMarkers: Record<BadgeTone, BadgeMarker> = {
  success: 'circle',
  warning: 'square',
  danger: 'triangle',
  neutral: 'ring',
}

const toneStyles: Record<BadgeTone, string> = {
  success: 'bg-success-soft text-on-success border border-success-soft',
  warning: 'bg-accent-soft text-on-accent border border-accent-soft',
  danger: 'bg-danger-soft text-on-danger border border-danger-soft',
  neutral: 'bg-surface-raised text-ink border border-line',
}

const sizeStyles: Record<BadgeSize, { badge: string; text: string; icon: string }> = {
  sm: {
    badge: 'h-6 px-2 py-0.5 gap-1.5',
    text: 'text-caption leading-none',
    icon: 'w-2 h-2',
  },
  md: {
    badge: 'h-7 px-2.5 py-1 gap-1.5',
    text: 'text-label leading-none',
    icon: 'w-2.5 h-2.5',
  },
}

function MarkerIcon({ marker, className }: { marker: BadgeMarker; className: string }) {
  switch (marker) {
    case 'circle':
      // Lingkaran padat: Baik / Sukses
      return (
        <svg
          viewBox="0 0 8 8"
          className={`${className} fill-current shrink-0`}
          aria-hidden="true"
        >
          <circle cx="4" cy="4" r="3.25" />
        </svg>
      )
    case 'square':
      // Kotak padat: Pantau / Peringatan
      return (
        <svg
          viewBox="0 0 8 8"
          className={`${className} fill-current shrink-0`}
          aria-hidden="true"
        >
          <rect x="1" y="1" width="6" height="6" rx="1" />
        </svg>
      )
    case 'triangle':
      // Segitiga padat: Bahaya / Evaluasi
      return (
        <svg
          viewBox="0 0 10 10"
          className={`${className} fill-current shrink-0`}
          aria-hidden="true"
        >
          <polygon points="5,1 9.5,9 0.5,9" />
        </svg>
      )
    case 'ring':
      // Lingkaran berongga: Netral / Informasi
      return (
        <svg
          viewBox="0 0 8 8"
          className={`${className} fill-none stroke-current stroke-[1.75] shrink-0`}
          aria-hidden="true"
        >
          <circle cx="4" cy="4" r="2.75" />
        </svg>
      )
    default:
      return null
  }
}

export function Badge({
  tone = 'neutral',
  marker,
  size = 'sm',
  className = '',
  children,
  title,
  ...props
}: BadgeProps) {
  const activeMarker = marker || defaultMarkers[tone]
  const currentTone = toneStyles[tone] || toneStyles.neutral
  const currentSize = sizeStyles[size] || sizeStyles.sm

  // Menyiapkan atribut title untuk aksesibilitas jika teks terpotong
  const resolvedTitle =
    title || (typeof children === 'string' ? children : undefined)

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold select-none whitespace-nowrap overflow-hidden max-w-full ${currentTone} ${currentSize.badge} ${className}`}
      title={resolvedTitle}
      {...props}
    >
      <MarkerIcon marker={activeMarker} className={currentSize.icon} />
      <span className={`truncate ${currentSize.text}`}>{children}</span>
    </span>
  )
}
