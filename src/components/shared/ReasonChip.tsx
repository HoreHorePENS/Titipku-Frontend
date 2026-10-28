import React from 'react'
import { Badge, type BadgeSize } from '@/components/ui/Badge'

export type PriorityReason = 'stok_hampir_habis' | 'hampir_kedaluwarsa' | 'piutang'

export const REASON_CONFIG_MAP: Record<
  PriorityReason,
  {
    tone: 'neutral' | 'danger' | 'warning'
    defaultLabel: string
  }
> = {
  stok_hampir_habis: {
    tone: 'neutral', // Dilepas dari teal agar tidak tampak seperti tombol aksi
    defaultLabel: 'Stok hampir habis',
  },
  hampir_kedaluwarsa: {
    tone: 'danger',
    defaultLabel: 'Hampir kedaluwarsa',
  },
  piutang: {
    tone: 'warning',
    defaultLabel: 'Piutang 14 hari',
  },
}

export interface ReasonChipProps {
  reason: PriorityReason
  children?: React.ReactNode
  size?: BadgeSize
  className?: string
}

export function ReasonChip({
  reason,
  children,
  size = 'sm',
  className = '',
}: ReasonChipProps) {
  const config = REASON_CONFIG_MAP[reason] || REASON_CONFIG_MAP.stok_hampir_habis

  return (
    <Badge tone={config.tone} size={size} className={className}>
      {children || config.defaultLabel}
    </Badge>
  )
}
