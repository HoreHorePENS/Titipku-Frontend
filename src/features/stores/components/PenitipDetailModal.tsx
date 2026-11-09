import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/toast-store'
import { describeApiError } from '@/lib/api-errors'
import { rupiah } from '@/lib/format'
import type { PenitipBusiness } from '../penitip-businesses'
import { WhatsAppIcon } from './whatsapp'
import { whatsappLink } from '../whatsapp-link'

interface PenitipDetailModalProps {
  business: PenitipBusiness | null
  isOpen: boolean
  onClose: () => void
  onOffer: (business: PenitipBusiness) => void
  onCancelOffer: (business: PenitipBusiness) => Promise<unknown>
  isCancelling?: boolean
  /** Buka daftar pengajuan masuk (bila penitip sudah mengajukan ke toko ini). */
  onOpenRequests?: () => void
}

function ProductThumb({ url, name }: { url: string | null; name: string }) {
  return (
    <div className="w-12 h-12 rounded-lg overflow-hidden border border-line bg-slate-50 shrink-0 flex items-center justify-center text-slate-400">
      {url ? (
        <img src={url} alt={name} loading="lazy" className="w-full h-full object-cover" />
      ) : (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )}
    </div>
  )
}

export function PenitipDetailModal({
  business,
  isOpen,
  onClose,
  onOffer,
  onCancelOffer,
  isCancelling = false,
  onOpenRequests,
}: PenitipDetailModalProps) {
  if (!business) return null

  const handleCancel = async () => {
    try {
      await onCancelOffer(business)
      toast.show({ title: 'Tawaran dibatalkan', description: `Tawaran ke ${business.businessName} sudah dibatalkan.`, type: 'info' })
      onClose()
    } catch (err) {
      toast.show({ title: 'Tawaran belum bisa dibatalkan', description: describeApiError(err).message, type: 'error' })
    }
  }

  const canOffer = business.offerStatus === 'none' || business.offerStatus === 'rejected'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={business.businessName} description={`Pemilik: ${business.ownerName}`} maxWidth="xl">
      <div className="flex flex-col gap-4 text-ink">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl border border-line">
            <dt className="text-caption text-ink-soft">Alamat</dt>
            <dd className="text-body text-ink mt-0.5">{business.address || 'Belum diisi penitip'}</dd>
          </div>
          <div className="p-3 rounded-xl border border-line">
            <dt className="text-caption text-ink-soft">WhatsApp</dt>
            <dd className="text-body text-ink mt-0.5 font-mono">{business.whatsapp || 'Belum diisi penitip'}</dd>
          </div>
        </dl>

        <section>
          <h3 className="text-title-3 text-ink mb-2">Produk siap titip ({business.productCount})</h3>
          <ul className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
            {business.topProducts.map((product) => (
              <li key={product.id} className="p-2.5 rounded-xl border border-line flex items-center gap-3">
                <ProductThumb url={product.photoUrl} name={product.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-body font-semibold text-ink truncate">{product.name}</p>
                  <p className="text-caption text-ink-soft">Tahan {product.shelfLifeDays} hari</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-body font-mono font-semibold text-ink">{rupiah(product.consignPrice)}</p>
                  <p className="text-caption text-ink-soft">Jual {rupiah(product.suggestedRetailPrice)}</p>
                </div>
              </li>
            ))}
          </ul>
          {business.productCount > business.topProducts.length && (
            <p className="text-caption text-ink-soft mt-1.5">
              +{business.productCount - business.topProducts.length} produk lainnya
            </p>
          )}
        </section>

        {business.offerStatus === 'pending' && business.offerMessage && (
          <div className="p-3 rounded-xl border border-line bg-slate-50">
            <p className="text-label text-ink">Pesan tawaranmu</p>
            <p className="text-body text-ink-soft mt-0.5">{business.offerMessage}</p>
          </div>
        )}
        {business.offerStatus === 'incoming' && (
          <p className="p-3 rounded-xl border border-line bg-slate-50 text-body text-ink">
            Penitip ini sudah mengajukan titip-jual ke tokomu. Setujui atau tolak di daftar pengajuan masuk.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-line">
          {business.whatsapp && (
            <a
              href={whatsappLink(business.whatsapp, `Halo ${business.ownerName} (${business.businessName}), saya pemilik toko di Titipku. Saya ingin berdiskusi tentang titip-jual produk Anda.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 rounded-xl border border-line text-button text-ink hover:bg-slate-50 min-h-[44px]"
            >
              <WhatsAppIcon />
              Hubungi lewat WhatsApp
            </a>
          )}
          {canOffer && (
            <Button
              variant="primary"
              className="flex-1 rounded-xl min-h-[44px]"
              onClick={() => {
                onClose()
                onOffer(business)
              }}
            >
              {business.offerStatus === 'rejected' ? 'Tawari lagi' : 'Tawari penitip ini'}
            </Button>
          )}
          {business.offerStatus === 'pending' && (
            <Button variant="outline" className="flex-1 rounded-xl min-h-[44px]" loading={isCancelling} onClick={handleCancel}>
              Batalkan tawaran
            </Button>
          )}
          {business.offerStatus === 'incoming' && onOpenRequests && (
            <Button variant="primary" className="flex-1 rounded-xl min-h-[44px]" onClick={onOpenRequests}>
              Buka pengajuan masuk
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
