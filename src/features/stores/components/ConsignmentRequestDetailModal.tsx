import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/toast-store'
import { describeApiError } from '@/lib/api-errors'
import { rupiah } from '@/lib/format'
import { REQUEST_STATUS_LABEL, formatRequestDate, type ConsignmentRequest } from '../consignment-requests'
import { WhatsAppIcon } from './whatsapp'
import { whatsappLink } from '../whatsapp-link'

interface ConsignmentRequestDetailModalProps {
  request: ConsignmentRequest | null
  isOpen: boolean
  onClose: () => void
  onUpdateStatus: (requestId: string, status: 'accepted' | 'rejected') => Promise<unknown>
  isUpdating?: boolean
  onCreateInvoice?: (request: ConsignmentRequest) => void
}

export function ConsignmentRequestDetailModal({
  request,
  isOpen,
  onClose,
  onUpdateStatus,
  isUpdating = false,
  onCreateInvoice,
}: ConsignmentRequestDetailModalProps) {
  if (!request) return null

  const totalUnits = request.items.reduce((sum, item) => sum + item.qty, 0)
  const totalValue = request.items.reduce((sum, item) => sum + item.qty * item.consignPrice, 0)

  const respond = async (status: 'accepted' | 'rejected') => {
    try {
      await onUpdateStatus(request.id, status)
      toast.show(
        status === 'accepted'
          ? { title: 'Pengajuan disetujui', description: `${request.producerBusinessName} kini mitra tokomu. Hubungi penitip untuk jadwal antar barang.`, type: 'success' }
          : { title: 'Pengajuan ditolak', description: `Pengajuan dari ${request.producerBusinessName} sudah ditolak.`, type: 'info' }
      )
      onClose()
    } catch (err) {
      toast.show({ title: 'Pengajuan belum bisa diproses', description: describeApiError(err).message, type: 'error' })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={request.producerBusinessName}
      description={`${REQUEST_STATUS_LABEL[request.status]} · diajukan ${formatRequestDate(request.submittedAt)}`}
      maxWidth="xl"
    >
      <div className="flex flex-col gap-4 text-ink">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl border border-line">
            <dt className="text-caption text-ink-soft">Pemilik</dt>
            <dd className="text-body mt-0.5">{request.producerOwnerName}</dd>
          </div>
          <div className="p-3 rounded-xl border border-line">
            <dt className="text-caption text-ink-soft">Alamat</dt>
            <dd className="text-body mt-0.5">{request.producerAddress || 'Belum diisi penitip'}</dd>
          </div>
        </dl>

        {request.note && (
          <div className="p-3 rounded-xl border border-line bg-slate-50">
            <p className="text-label">Pesan dari penitip</p>
            <p className="text-body text-ink-soft mt-0.5">{request.note}</p>
          </div>
        )}

        <section>
          <h3 className="text-title-3 mb-2">
            {request.items.length > 0 ? `Rencana titipan (${request.items.length} produk)` : 'Rencana titipan'}
          </h3>
          {request.items.length === 0 ? (
            <p className="text-body text-ink-soft">
              {request.origin === 'offer'
                ? 'Kemitraan ini berawal dari tawaran tokomu. Jumlah barang dicatat penitip saat mengantar.'
                : 'Penitip belum mencantumkan produk. Tanyakan rinciannya lewat WhatsApp.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {request.items.map((item) => (
                <li key={item.id} className="p-2.5 rounded-xl border border-line flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-line bg-slate-50 shrink-0">
                    {item.photoUrl && <img src={item.photoUrl} alt={item.productName} loading="lazy" className="w-full h-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-semibold truncate">{item.productName}</p>
                    <p className="text-caption text-ink-soft">
                      {item.qty} pcs · tahan {item.shelfLifeDays} hari · jual {rupiah(item.suggestedRetailPrice)}
                    </p>
                  </div>
                  <p className="text-body font-mono font-semibold shrink-0">{rupiah(item.consignPrice)}</p>
                </li>
              ))}
            </ul>
          )}
          {request.items.length > 0 && (
            <p className="text-body mt-2 flex justify-between">
              <span className="text-ink-soft">{totalUnits} pcs · total nilai titip</span>
              <span className="font-mono font-semibold">{rupiah(totalValue)}</span>
            </p>
          )}
        </section>

        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-line">
          {request.producerWhatsapp && (
            <a
              href={whatsappLink(request.producerWhatsapp, `Halo ${request.producerOwnerName} (${request.producerBusinessName}), saya pemilik toko di Titipku tentang titip-jual produk Anda.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 rounded-xl border border-line text-button hover:bg-slate-50 min-h-[44px]"
            >
              <WhatsAppIcon />
              WhatsApp
            </a>
          )}
          {request.status === 'pending' && (
            <>
              <Button variant="outline" className="flex-1 rounded-xl min-h-[44px]" disabled={isUpdating} onClick={() => respond('rejected')}>
                Tolak
              </Button>
              <Button variant="primary" className="flex-1 rounded-xl min-h-[44px]" loading={isUpdating} onClick={() => respond('accepted')}>
                Setujui pengajuan
              </Button>
            </>
          )}
          {request.status === 'accepted' && onCreateInvoice && (
            <Button
              variant="primary"
              className="flex-1 rounded-xl min-h-[44px]"
              onClick={() => {
                onClose()
                onCreateInvoice(request)
              }}
            >
              Buat nota penjualan
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
