import { formatRupiah } from '../../lib/format'

interface MoneyProps {
  amount: number
}

export function Money({ amount }: MoneyProps) {
  return <span>{formatRupiah(amount)}</span>
}
