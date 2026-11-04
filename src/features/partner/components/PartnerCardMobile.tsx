import { StatusBadge } from '@/components/shared/StatusBadge'
import { rupiah } from '@/lib/format'
import { calculatePartnerHealth } from '../calc'
import type { Partner } from '../types'
import type { VisitRecord } from '@/features/visit/types'

export interface PartnerCardMobileProps {
  partner: Partner
  visits?: VisitRecord[]
  isSelected?: boolean
  onClick: () => void
}

export function PartnerCardMobile({
  partner,
  visits = [],
  isSelected = false,
  onClick,
}: PartnerCardMobileProps) {
  const health = calculatePartnerHealth(partner, visits)

  // Ambil tanggal kunjungan terakhir warung ini
  const partnerVisits = visits
    .filter((v) => v.partnerId === partner.id)
    .sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime())
  
  const lastVisitDate = partnerVisits.length > 0
    ? new Date(partnerVisits[0].visitedAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Belum ada kunjungan'

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
      className={`p-4 rounded-2xl bg-surface border transition-all text-left flex flex-col gap-2.5 shadow-2xs cursor-pointer active:scale-[0.99] ${
        isSelected
          ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
          : 'border-line hover:border-primary/60 hover:shadow-xs'
      }`}
    >
      {/* Baris Atas: Nama Warung & Status Badge Kesehatan */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-extrabold text-ink leading-snug">{partner.name}</h3>
          <p className="text-xs text-ink-soft mt-0.5">
            {partner.address ? partner.address.split(',')[0] : 'Mitra'} ·{' '}
            <span className="text-[11px]">terakhir {lastVisitDate}</span>
          </p>
        </div>

        <StatusBadge status={health.label} />
      </div>

      {/* Baris Bawah: Pemilik & Saldo Utang */}
      <div className="flex items-center justify-between pt-1 border-t border-line/60 text-xs">
        <span className="text-ink-soft font-medium">
          {partner.ownerName ? `Pemilik: ${partner.ownerName}` : 'Mitra aktif'}
        </span>

        <div className="text-right">
          {partner.receivable > 0 ? (
            <span className="text-sm font-extrabold text-danger tabular-nums">
              {rupiah(partner.receivable)}
            </span>
          ) : (
            <span className="text-xs font-bold text-success">Lunas (Rp0)</span>
          )}
        </div>
      </div>
    </div>
  )
}
