import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { toast } from '@/components/ui/toast-store'
import { EmptyState } from '@/components/shared/EmptyState'
import { ApiErrorState } from '@/components/shared/ApiErrorState'
import { describeApiError } from '@/lib/api-errors'
import { useCatalogProducts } from '@/features/catalog/api'
import { getCategoryMeta } from '../constants'
import { useStoreOffers, type StoreOffer } from '../store-offers'
import { WhatsAppIcon } from './whatsapp'
import { whatsappLink } from '../whatsapp-link'

type OfferFilter = 'pending' | 'accepted' | 'all'

const STATUS_LABEL: Record<StoreOffer['status'], string> = {
  pending: 'Menunggu jawabanmu',
  accepted: 'Diterima',
  rejected: 'Ditolak',
}

function relativeTime(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StoreThumb({ offer }: { offer: StoreOffer }) {
  const meta = getCategoryMeta(offer.storeCategory)
  return (
    <div className="w-14 h-14 rounded-xl overflow-hidden border border-line bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
      {offer.storePhotoUrl ? (
        <img src={offer.storePhotoUrl} alt={offer.storeName} loading="lazy" className="w-full h-full object-cover" />
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={meta.svgPath} />
        </svg>
      )}
    </div>
  )
}

function OfferCard({
  offer,
  busy,
  onRespond,
}: {
  offer: StoreOffer
  busy: boolean
  onRespond: (offer: StoreOffer, accept: boolean) => void
}) {
  const meta = getCategoryMeta(offer.storeCategory)
  const details = [offer.shelfLocation && `Tempat: ${offer.shelfLocation}`, offer.estimatedCapacity && `Kapasitas: ${offer.estimatedCapacity}`]
    .filter(Boolean)
    .join(' · ')

  return (
    <li className="p-4 bg-white rounded-2xl border border-line flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <StoreThumb offer={offer} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-title-3 text-ink truncate">{offer.storeName}</h3>
            <span className="text-caption font-semibold px-2 py-0.5 rounded-full border border-line text-ink-soft">
              {STATUS_LABEL[offer.status]}
            </span>
          </div>
          <p className="text-caption text-ink-soft">
            {meta.label} · {offer.storeOwnerName} · {relativeTime(offer.offeredAt)}
          </p>
          <p className="text-caption text-ink-soft truncate">{offer.storeAddress}</p>
        </div>
      </div>

      {offer.message && <p className="text-body text-ink">{offer.message}</p>}
      {details && <p className="text-caption text-ink-soft">{details}</p>}

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line">
        <a
          href={whatsappLink(offer.storeWhatsapp, `Halo ${offer.storeOwnerName}, saya melihat tawaran ${offer.storeName} di Titipku.`)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Chat WhatsApp ${offer.storeName}`}
          className="w-11 h-11 rounded-xl border border-line flex items-center justify-center text-ink-soft hover:bg-slate-50"
        >
          <WhatsAppIcon />
        </a>
        {offer.status === 'pending' && (
          <>
            <Button variant="outline" size="sm" className="flex-1 rounded-xl min-h-[44px]" disabled={busy} onClick={() => onRespond(offer, false)}>
              Tolak
            </Button>
            <Button variant="primary" size="sm" className="flex-1 rounded-xl min-h-[44px]" loading={busy} onClick={() => onRespond(offer, true)}>
              Terima tawaran
            </Button>
          </>
        )}
      </div>
    </li>
  )
}

/** Tawaran masuk dari pemilik toko untuk penitip (data asli dari /v1/proposals). */
export function IncomingStoreOffers() {
  const navigate = useNavigate()
  const offersQuery = useStoreOffers()
  const { data: products, isLoading: isLoadingProducts } = useCatalogProducts(true)
  const [filter, setFilter] = useState<OfferFilter>('pending')

  const { offers, pendingCount, approveOffer, rejectOffer, respondingId } = offersQuery
  const counts = {
    pending: pendingCount,
    accepted: offers.filter((o) => o.status === 'accepted').length,
    all: offers.length,
  }
  const visible = useMemo(
    () => (filter === 'all' ? offers : offers.filter((o) => o.status === filter)),
    [offers, filter]
  )

  const handleRespond = async (offer: StoreOffer, accept: boolean) => {
    try {
      await (accept ? approveOffer(offer.id) : rejectOffer(offer.id))
      toast.show(
        accept
          ? { title: 'Tawaran diterima', description: `${offer.storeName} kini menjadi toko mitramu. Catat kunjungan saat menitipkan barang.`, type: 'success' }
          : { title: 'Tawaran ditolak', description: `Tawaran dari ${offer.storeName} sudah ditolak.`, type: 'info' }
      )
    } catch (err) {
      toast.show({ title: 'Tawaran belum bisa diproses', description: describeApiError(err).message, type: 'error' })
    }
  }

  const hasProducts = (products?.length ?? 0) > 0

  return (
    <section aria-labelledby="incoming-offers-title" className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h2 id="incoming-offers-title" className="text-title-2 text-ink">
            Tawaran masuk dari toko
          </h2>
          <p className="text-body text-ink-soft">Pemilik warung dan toko yang ingin menjual produkmu.</p>
        </div>
        {offers.length > 0 && (
          <div role="tablist" aria-label="Filter tawaran" className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-line self-start">
            {(['pending', 'accepted', 'all'] as const).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-label min-h-[36px] ${filter === key ? 'bg-white text-ink shadow-2xs' : 'text-ink-soft hover:text-ink'}`}
              >
                {key === 'pending' ? 'Menunggu' : key === 'accepted' ? 'Diterima' : 'Semua'} ({counts[key]})
              </button>
            ))}
          </div>
        )}
      </div>

      {offersQuery.isLoading || isLoadingProducts ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" aria-busy="true" aria-label="Memuat tawaran">
          <Skeleton variant="rect" className="h-40 w-full rounded-2xl" />
          <Skeleton variant="rect" className="h-40 w-full rounded-2xl hidden md:block" />
        </div>
      ) : offersQuery.isError ? (
        <ApiErrorState error={offersQuery.error} onRetry={() => offersQuery.refetch()} title="Tawaran belum bisa dimuat" />
      ) : offers.length === 0 ? (
        hasProducts ? (
          <EmptyState
            size="inline"
            title="Belum ada tawaran"
            description="Pemilik toko yang melihat produkmu bisa mengirim tawaran ke sini. Kamu juga bisa mengajukan titip-jual lebih dulu ke toko di peta."
            action={{ label: 'Cari toko di peta', onClick: () => navigate('/peta') }}
          />
        ) : (
          <EmptyState
            size="inline"
            title="Belum ada tawaran"
            description="Lengkapi produkmu agar pemilik toko bisa menemukanmu. Penitip baru tampil di katalog toko setelah punya minimal satu produk aktif."
            action={{ label: 'Tambah produk', onClick: () => navigate('/produk') }}
          />
        )
      ) : visible.length === 0 ? (
        <p className="py-8 text-center text-body text-ink-soft bg-white rounded-2xl border border-line">
          {filter === 'pending' ? 'Tidak ada tawaran yang menunggu jawabanmu.' : 'Belum ada tawaran yang diterima.'}
        </p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visible.map((offer) => (
            <OfferCard key={offer.id} offer={offer} busy={respondingId === offer.id} onRespond={handleRespond} />
          ))}
        </ul>
      )}
    </section>
  )
}
