import type React from 'react'
import { Badge, type BadgeSize } from '@/components/ui/Badge'
import { REASON_CONFIG_MAP, type PriorityReason } from './badge-constants'

export type { PriorityReason }

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

export default ReasonChip
