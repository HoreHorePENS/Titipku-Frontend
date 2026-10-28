import { Badge, type BadgeSize } from '@/components/ui/Badge'

export type PaymentStatus = 'lunas' | 'sebagian' | 'belum_lunas'

export interface PaymentBadgeProps {
  status: PaymentStatus
  size?: BadgeSize
  className?: string
}

export const PAYMENT_STATUS_MAP: Record<
  PaymentStatus,
  { tone: 'success' | 'warning' | 'danger'; label: string }
> = {
  lunas: {
    tone: 'success',
    label: 'Lunas',
  },
  sebagian: {
    tone: 'warning',
    label: 'Sebagian',
  },
  belum_lunas: {
    tone: 'danger',
    label: 'Belum Lunas',
  },
}

export function PaymentBadge({ status, size = 'sm', className = '' }: PaymentBadgeProps) {
  const config = PAYMENT_STATUS_MAP[status] || PAYMENT_STATUS_MAP.belum_lunas

  return (
    <Badge tone={config.tone} size={size} className={className}>
      {config.label}
    </Badge>
  )
}
