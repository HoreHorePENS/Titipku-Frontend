import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/ui/Button'
import { rupiah } from '@/lib/format'
import type { PenitipBusiness } from '../penitip-businesses'

interface PenitipDetailModalProps {
  business: PenitipBusiness | null
  isOpen: boolean
  onClose: () => void
  onOffer: (business: PenitipBusiness) => void
  onCancelOffer?: (businessId: string) => void
}

export function PenitipDetailModal({
  business,
  isOpen,
  onClose,
  onOffer,
  onCancelOffer,
}: PenitipDetailModalProps) {
  if (!business) return null

  const handleWhatsApp = () => {
    const url = `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(
      `Halo ${business.businessName} (${business.ownerName}), saya pemilik toko ingin berdiskusi mengenai titip-jual produk Anda di warung kami.`
    )}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Profil Produsen Penitip UMKM"
      className="max-w-xl"
    >
      <div className="flex flex-col gap-4 font-sans text-slate-900">
        {/* Header Bisnis */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shrink-0">
            {business.businessName.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                {business.category.toUpperCase()}
              </span>
              {business.offerStatus === 'pending' && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300">
                  Tawaran Terkirim
                </span>
              )}
              {business.offerStatus === 'accepted' && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-900 text-white border border-slate-800">
                  Sudah Bermitra
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">{business.businessName}</h3>
            <p className="text-xs text-slate-500">
              {business.ownerName} · {business.city}
            </p>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">{business.description}</p>
          </div>
        </div>

        {/* Informasi Kontak & Lokasi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-slate-500 block font-medium">Alamat Produksi:</span>
            <span className="font-semibold text-slate-900 mt-0.5 block">{business.address}</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <span className="text-slate-500 block font-medium">Nomor WhatsApp:</span>
            <span className="font-semibold text-slate-900 mt-0.5 block">{business.whatsapp}</span>
          </div>
        </div>

        {/* Daftar Produk yang Ditawarkan untuk Titip Jual */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            Katalog Produk Siap Titip ({business.topProducts.length} Produk)
          </h4>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {business.topProducts.map((product) => (
              <div
                key={product.id}
                className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">
                    {product.category}
                  </span>
                  <p className="text-xs font-bold text-slate-900 truncate mt-0.5">{product.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Daya tahan: {product.shelfLife}</p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-slate-900">
                    {rupiah(product.consignPrice)}
                    <span className="text-[10px] font-normal text-slate-500">
                      {' '}
                      / {product.unit}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Tawaran Aktif */}
        {business.offerStatus === 'pending' && business.offerMessage && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="font-semibold text-slate-700 block">Pesan Tawaran Terkirim:</span>
            <p className="text-slate-600 mt-0.5 italic">"{business.offerMessage}"</p>
          </div>
        )}

        {/* Tombol Aksi */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={handleWhatsApp}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px] flex items-center gap-1.5 shrink-0"
          >
            <span>Hubungi WA</span>
          </button>

          {business.offerStatus === 'none' && (
            <Button
              type="button"
              variant="primary"
              className="flex-1 rounded-xl font-semibold min-h-[44px]"
              onClick={() => {
                onClose()
                onOffer(business)
              }}
            >
              Tawari Pebisnis Ini
            </Button>
          )}

          {business.offerStatus === 'pending' && onCancelOffer && (
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl font-semibold min-h-[44px]"
              onClick={() => {
                onCancelOffer(business.id)
                onClose()
              }}
            >
              Batalkan Tawaran
            </Button>
          )}

          {business.offerStatus === 'accepted' && (
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl font-semibold min-h-[44px]"
              disabled
            >
              Sudah Menjadi Mitra
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
