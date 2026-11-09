import type React from 'react'

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral'

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: string
  tone?: StatusTone
  className?: string
}

export function StatusBadge({ status, tone, className = '', ...props }: StatusBadgeProps) {
  const normalized = status.toLowerCase().trim()

  let resolvedTone: StatusTone = tone || 'neutral'
  if (!tone) {
    if (normalized === 'bagus' || normalized === 'lunas') {
      resolvedTone = 'success'
    } else if (normalized === 'pantau' || normalized === 'sebagian') {
      resolvedTone = 'warning'
    } else if (
      normalized === 'evaluasi' ||
      normalized === 'belum_lunas' ||
      normalized === 'belum lunas' ||
      normalized === 'belum bayar'
    ) {
      resolvedTone = 'danger'
    }
  }

  const toneClass = {
    success: 'bg-success-soft text-on-success',
    warning: 'bg-accent-soft text-on-accent',
    danger: 'bg-danger-soft text-on-danger',
    neutral: 'bg-surface-raised text-ink-soft',
  }[resolvedTone]

  return (
    <span
      className={`status-badge inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase select-none ${toneClass} ${className}`}
      {...props}
    >
      {status}
    </span>
  )
}
