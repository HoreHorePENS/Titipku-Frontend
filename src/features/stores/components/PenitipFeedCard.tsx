import { Button } from '@/components/ui/Button'
import { rupiah } from '@/lib/format'
import type { PenitipBusiness } from '../penitip-businesses'

interface PenitipFeedCardProps {
  business: PenitipBusiness
  onOffer: (business: PenitipBusiness) => void
  onViewDetail: (business: PenitipBusiness) => void
}

export function PenitipFeedCard({ business, onOffer, onViewDetail }: PenitipFeedCardProps) {
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(
      `Halo ${business.businessName}, saya pemilik warung/toko ingin menawarkan kerja sama titip-jual produk Anda.`
    )}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const initials = business.businessName
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div
      onClick={() => onViewDetail(business)}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs hover:shadow-sm transition-all flex flex-col cursor-pointer group"
    >
      {/* Visual Header / Banner Kotak */}
      <div className="h-32 w-full bg-slate-900 text-white relative p-4 flex flex-col justify-between overflow-hidden">
        {/* Pattern Aksen Halus */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between gap-1">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white border border-white/30 uppercase tracking-wider">
            {business.category}
          </span>

          {business.offerStatus === 'pending' && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-slate-900 shadow-2xs">
              Tawaran Terkirim
            </span>
          )}
          {business.offerStatus === 'accepted' && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-900">
              Mitra Aktif
            </span>
          )}
        </div>

        {/* Inisial & Nama Bisnis */}
        <div className="relative z-10 flex items-end gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-white text-slate-900 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white leading-tight line-clamp-1 group-hover:underline">
              {business.businessName}
            </h3>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">
              {business.ownerName} · {business.city}
            </p>
          </div>
        </div>
      </div>

      {/* Konten & Deskripsi */}
      <div className="p-3.5 flex flex-col gap-2.5 flex-1 justify-between">
        <div>
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {business.description}
          </p>

          {/* Daftar Produk Unggulan Preview */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Produk Siap Titip:
            </span>
            {business.topProducts.slice(0, 2).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs py-0.5"
              >
                <span className="text-slate-800 font-medium truncate pr-2">
                  {item.name}
                </span>
                <span className="text-slate-900 font-bold shrink-0">
                  {rupiah(item.consignPrice)}
                </span>
              </div>
            ))}
            {business.topProducts.length > 2 && (
              <span className="text-[10px] text-slate-500 font-medium">
                +{business.topProducts.length - 2} produk lainnya
              </span>
            )}
          </div>
        </div>

        {/* Tombol Aksi */}
        <div
          className="flex items-center gap-1.5 pt-2 border-t border-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {business.offerStatus === 'none' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOffer(business)}
              className="flex-1 text-xs font-semibold rounded-xl min-h-[44px]"
            >
              Tawari Pebisnis Ini
            </Button>
          )}

          {business.offerStatus === 'pending' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetail(business)}
              className="flex-1 text-xs font-semibold rounded-xl min-h-[44px]"
            >
              Menunggu Respon
            </Button>
          )}

          {business.offerStatus === 'accepted' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetail(business)}
              className="flex-1 text-xs font-semibold rounded-xl min-h-[44px]"
            >
              Detail Pebisnis Mitra
            </Button>
          )}

          {/* Tombol WhatsApp */}
          <button
            type="button"
            onClick={handleWhatsApp}
            aria-label="Chat WhatsApp"
            className="w-11 h-11 rounded-xl border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
