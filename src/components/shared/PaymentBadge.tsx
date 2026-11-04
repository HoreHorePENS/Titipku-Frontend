import { Badge, type BadgeSize } from '@/components/ui/Badge'
import { PAYMENT_STATUS_MAP, type PaymentStatus } from './badge-constants'

export type { PaymentStatus }

export interface PaymentBadgeProps {
  status: PaymentStatus
  size?: BadgeSize
  className?: string
}

export function PaymentBadge({ status, size = 'sm', className = '' }: PaymentBadgeProps) {
  const config = PAYMENT_STATUS_MAP[status] || PAYMENT_STATUS_MAP.belum_lunas

  return (
    <Badge tone={config.tone} size={size} className={className}>
      {config.label}
    </Badge>
  )
}

export default PaymentBadge
