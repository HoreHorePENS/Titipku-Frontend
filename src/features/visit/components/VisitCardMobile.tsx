import { Link } from 'react-router-dom'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Money } from '@/components/shared/Money'
import { aggregateVisitItems } from '../calc'
import type { VisitRecord } from '../types'

export interface VisitCardMobileProps {
  visit: VisitRecord
  onSelect?: (visit: VisitRecord) => void
}

export function VisitCardMobile({ visit, onSelect }: VisitCardMobileProps) {
  const { sold } = aggregateVisitItems(visit.items)
  const statusLabel =
    visit.status === 'paid' ? 'LUNAS' : visit.status === 'partial' ? 'SEBAGIAN' : 'BELUM LUNAS'

  const notaLink = visit.publicToken ? `/n/${visit.publicToken}` : `/kunjungan`

  return (
    <div
      onClick={() => onSelect?.(visit)}
      className="bg-surface rounded-2xl border border-line p-4 shadow-2xs flex flex-col gap-3 active:scale-[0.99] transition-all cursor-pointer hover:border-line-strong"
    >
      {/* Baris Atas: Nama Warung & Status Badge */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-title-3 text-ink">
          {visit.partnerName}
          {visit.partnerArea && (
            <span className="font-normal text-ink-soft"> · {visit.partnerArea}</span>
          )}
        </h3>

        <StatusBadge status={statusLabel} />
      </div>

      {/* Baris Bawah: Tautan Nota & Total Tagihan */}
      <div className="flex items-end justify-between pt-0.5">
        <Link
          to={notaLink}
          onClick={(e) => e.stopPropagation()}
          className="text-caption font-semibold text-primary hover:underline pb-0.5"
        >
          Lihat nota
        </Link>

        <div className="text-right">
          <div className="text-title-3 font-bold text-ink tabular-nums">
            <Money amount={visit.total} />
          </div>
          <p className="text-caption text-ink-soft mt-0.5 font-normal">terjual {sold} bks</p>
        </div>
      </div>
    </div>
  )
}
