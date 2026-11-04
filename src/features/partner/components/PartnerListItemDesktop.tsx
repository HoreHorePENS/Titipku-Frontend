import { StatusBadge } from '@/components/shared/StatusBadge'
import { rupiah } from '@/lib/format'
import { calculatePartnerHealth } from '../calc'
import type { Partner } from '../types'
import type { VisitRecord } from '@/features/visit/types'

export interface PartnerListItemDesktopProps {
  partner: Partner
  visits?: VisitRecord[]
  isSelected: boolean
  onClick: () => void
}

export function PartnerListItemDesktop({
  partner,
  visits = [],
  isSelected,
  onClick,
}: PartnerListItemDesktopProps) {
  const health = calculatePartnerHealth(partner, visits)

  const partnerVisits = visits
    .filter((v) => v.partnerId === partner.id)
    .sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime())
  
  const lastVisitDate = partnerVisits.length > 0
    ? new Date(partnerVisits[0].visitedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '-'

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className={`p-3.5 rounded-xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${
        isSelected
          ? 'bg-primary-soft/40 border-primary shadow-xs'
          : 'bg-surface border-line hover:border-line-strong hover:bg-surface-raised/50'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-ink truncate leading-tight">
            {partner.name}
          </h3>
          <p className="text-[11px] text-ink-soft truncate mt-0.5">
            {partner.address ? partner.address.split(',')[0] : 'Mitra'} · terakhir {lastVisitDate}
          </p>
        </div>

        <StatusBadge status={health.label} className="shrink-0 scale-95 origin-top-right" />
      </div>

      <div className="flex items-center justify-between text-xs pt-1 border-t border-line/40">
        <span className="text-[11px] text-ink-soft truncate">
          {partner.ownerName || 'Mitra'}
        </span>

        {partner.receivable > 0 ? (
          <span className="text-xs font-bold text-danger tabular-nums shrink-0">
            {rupiah(partner.receivable)}
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-success shrink-0">Lunas</span>
        )}
      </div>
    </div>
  )
}
