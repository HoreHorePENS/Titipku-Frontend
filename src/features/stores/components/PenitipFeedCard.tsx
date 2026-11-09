import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { rupiah } from '@/lib/format'
import type { PenitipBusiness } from '../penitip-businesses'
import { WhatsAppIcon } from './whatsapp'
import { whatsappLink } from '../whatsapp-link'

interface PenitipFeedCardProps {
  business: PenitipBusiness
  onOffer: (business: PenitipBusiness) => void
  onViewDetail: (business: PenitipBusiness) => void
}

const STATUS_BADGE: Partial<Record<PenitipBusiness['offerStatus'], string>> = {
  pending: 'Tawaran terkirim',
  incoming: 'Mengajukan ke tokomu',
  accepted: 'Mitra aktif',
  rejected: 'Tawaran ditolak',
}

/** Foto produk unggulan atau placeholder netral yang ringan. */
function ProducerCover({ business }: { business: PenitipBusiness }) {
  const [failed, setFailed] = useState(false)
  if (business.photoUrl && !failed) {
    return (
      <img
        src={business.photoUrl}
        alt={`Produk ${business.businessName}`}
        loading="lazy"
        className="w-full h-full object-cover"
        onError={() => setFailed(true)}
      />
    )
  }
  return (
    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-400">
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    </div>
  )
}

export function PenitipFeedCard({ business, onOffer, onViewDetail }: PenitipFeedCardProps) {
  const badge = STATUS_BADGE[business.offerStatus]
  const canOffer = business.offerStatus === 'none' || business.offerStatus === 'rejected'

  return (
    <article className="bg-white border border-line rounded-2xl overflow-hidden shadow-2xs hover:shadow-sm transition-shadow flex flex-col h-full">
      <button
        type="button"
        onClick={() => onViewDetail(business)}
        className="relative aspect-[16/9] w-full overflow-hidden border-b border-line cursor-pointer"
        aria-label={`Lihat detail ${business.businessName}`}
      >
        <ProducerCover business={business} />
        {badge && (
          <span className="absolute top-2 left-2 text-caption font-semibold px-2 py-0.5 rounded-full bg-white/95 text-ink border border-line">
            {badge}
          </span>
        )}
      </button>

      <div className="p-3.5 flex flex-col gap-3 flex-1">
        <div className="min-w-0">
          <h3 className="text-title-3 text-ink line-clamp-1">{business.businessName}</h3>
          <p className="text-caption text-ink-soft truncate">
            {business.ownerName}
            {business.address ? ` · ${business.address}` : ''}
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-caption text-ink-soft">
            {business.productCount} produk siap titip
          </span>
          {business.topProducts.slice(0, 2).map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-2 text-body">
              <span className="text-ink truncate">{item.name}</span>
              <span className="font-mono text-ink font-semibold shrink-0">{rupiah(item.consignPrice)}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-line">
          <Button
            variant={canOffer ? 'primary' : 'outline'}
            size="sm"
            onClick={() => (canOffer ? onOffer(business) : onViewDetail(business))}
            className="flex-1 rounded-xl min-h-[44px]"
          >
            {canOffer
              ? business.offerStatus === 'rejected'
                ? 'Tawari lagi'
                : 'Tawari penitip ini'
              : business.offerStatus === 'incoming'
                ? 'Lihat pengajuan'
                : 'Lihat detail'}
          </Button>
          {business.whatsapp && (
            <a
              href={whatsappLink(
                business.whatsapp,
                `Halo ${business.businessName}, saya pemilik toko di Titipku. Saya tertarik bekerja sama titip-jual produk Anda.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Chat WhatsApp ${business.businessName}`}
              className="w-11 h-11 rounded-xl border border-line flex items-center justify-center text-ink-soft hover:bg-slate-50 shrink-0"
            >
              <WhatsAppIcon />
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
