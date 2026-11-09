import { formatRibuan, formatRupiah } from '@/lib/format'

export interface MoneyProps {
  amount: number
  showPrefix?: boolean
  className?: string
}

export function Money({ amount, showPrefix = true, className = '' }: MoneyProps) {
  return (
    <span className={`tabular-nums ${className}`}>
      {showPrefix ? formatRupiah(amount) : formatRibuan(amount)}
    </span>
  )
}
