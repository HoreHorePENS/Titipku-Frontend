import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/toast-store'
import { getCategoryMeta } from '../constants'
import { useStoreOffers, type StoreOffer } from '../store-offers'
import { useNotifications } from '@/features/notifications/notification-store'

interface IncomingStoreOffersProps {
  onPartnerAdded?: (storeId: string) => void
}

export function IncomingStoreOffers({ onPartnerAdded }: IncomingStoreOffersProps) {
  const { offers, pendingOffers, approveOffer, rejectOffer } = useStoreOffers()
  const { addNotification } = useNotifications('pemilik_toko')
  const [filter, setFilter] = useState<'pending' | 'all' | 'accepted'>('pending')

  const filteredOffers = useMemo(() => {
    if (filter === 'pending') return offers.filter((o) => o.status === 'pending')
    if (filter === 'accepted') return offers.filter((o) => o.status === 'accepted')
    return offers
  }, [offers, filter])

  const handleApprove = (offer: StoreOffer) => {
    approveOffer(offer.id)
    if (onPartnerAdded) {
      onPartnerAdded(offer.storeId)
    }

    // Beri notifikasi ke role pemilik toko bahwa tawarannya disetujui (titik merah pada lonceng toko)
    addNotification({
      role: 'pemilik_toko',
      title: 'Tawaran Toko Disetujui!',
      message: `Produsen penitip ${offer.targetBusinessName} telah menyetujui tawaran toko Anda (${offer.storeName}). Siap drop barang titipan!`,
      timeAgo: 'Baru saja',
      type: 'offer_accepted',
      dataId: offer.id,
    })

    toast.show({
      title: 'Tawaran Toko Disetujui',
      description: `Toko "${offer.storeName}" telah disetujui dan kini resmi menjadi mitra konsinyasi Anda.`,
      type: 'success',
    })
  }

  const handleReject = (offer: StoreOffer) => {
    rejectOffer(offer.id)

    // Beri notifikasi ke pemilik toko bahwa tawaran ditolak
    addNotification({
      role: 'pemilik_toko',
      title: 'Tawaran Toko Ditolak',
      message: `Produsen penitip belum dapat menerima kerja sama dengan toko "${offer.storeName}".`,
      timeAgo: 'Baru saja',
      type: 'offer_rejected',
      dataId: offer.id,
    })

    toast.show({
      title: 'Tawaran Ditolak',
      description: `Tawaran dari "${offer.storeName}" telah ditolak.`,
      type: 'info',
    })
  }

  const handleWhatsApp = (offer: StoreOffer) => {
    const url = `https://wa.me/${offer.storeWhatsapp}?text=${encodeURIComponent(
      `Halo ${offer.storeName} (${offer.storeOwnerName}), kami produsen penitip tertarik dengan tawaran titip-jual di toko Anda.`
    )}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Jika tidak ada tawaran pending dan user di tab pending, tampilkan ringkas jika total tawaran ada
  if (offers.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col gap-4 font-sans">
      {/* Header Seksi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
              Tawaran Dua Arah
            </span>
            {pendingOffers.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                {pendingOffers.length} Perlu Persetujuan
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Tawaran Masuk dari Pemilik Warung &amp; Toko
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pemilik toko di bawah ini menawarkan gerai dan raknya agar Anda menitipkan barang dagangan Anda ke toko mereka.
          </p>
        </div>

        {/* Tab Filter Tawaran */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] cursor-pointer ${
              filter === 'pending'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Menunggu Approval ({pendingOffers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({offers.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('accepted')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] cursor-pointer ${
              filter === 'accepted'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Disetujui
          </button>
        </div>
      </div>

      {/* List Card Tawaran Toko */}
      {filteredOffers.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs font-semibold text-slate-700">Tidak ada tawaran pada kategori ini</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Semua tawaran dari pemilik toko akan tercatat secara transparan di sini.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredOffers.map((offer) => {
            const meta = getCategoryMeta(offer.storeCategory)
            const isPending = offer.status === 'pending'
            const isAccepted = offer.status === 'accepted'
            const isRejected = offer.status === 'rejected'

            return (
              <div
                key={offer.id}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isPending
                    ? 'bg-slate-50 border-slate-300 shadow-2xs'
                    : isAccepted
                    ? 'bg-white border-slate-200'
                    : 'bg-white border-slate-200 opacity-60'
                }`}
              >
                {/* Info Toko Pengirim Tawaran */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={meta.svgPath}></path>
                    </svg>
                  </div>

                  <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {offer.storeName}
                      </h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {meta.label}
                      </span>
                      {isPending && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          Menunggu Approval Anda
                        </span>
                      )}
                      {isAccepted && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                          Mitra Aktif
                        </span>
                      )}
                      {isRejected && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                          Ditolak
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500">
                      {offer.storeOwnerName} · {offer.storeAddress}
                    </p>

                    {/* Pesan Tawaran Toko */}
                    <div className="mt-1 p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
                      <p className="italic">"{offer.message}"</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 font-medium">
                        <span>Penempatan: <strong className="text-slate-800">{offer.shelfLocation}</strong></span>
                        <span>·</span>
                        <span>Kapasitas Awal: <strong className="text-slate-800">{offer.estimatedCapacity}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tombol Aksi Approval & Komunikasi */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => handleWhatsApp(offer)}
                    className="h-11 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span>Chat WA</span>
                  </button>

                  {isPending && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleReject(offer)}
                        className="h-11 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        Tolak
                      </button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApprove(offer)}
                        className="text-xs font-semibold rounded-xl min-h-[44px]"
                      >
                        Terima Tawaran
                      </Button>
                    </>
                  )}

                  {isAccepted && (
                    <span className="text-xs font-semibold text-slate-900 px-3 py-2 bg-slate-100 rounded-xl">
                      Mitra Konsinyasi Resmi
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
