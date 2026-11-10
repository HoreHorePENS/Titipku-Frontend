import { useState, useEffect } from 'react'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/ui/Button'
import { Stepper } from '@/components/ui/Stepper'
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
  onUpdateStatus: (
    requestId: string,
    status: 'accepted' | 'rejected',
    items?: { productId: string; qty: number }[]
  ) => Promise<unknown>
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  useEffect(() => {
    if (request) {
      setSelectedIds(new Set(request.items.map((it) => it.id)))
      const initialQty: Record<string, number> = {}
      request.items.forEach((it) => {
        initialQty[it.id] = it.qty
      })
      setQuantities(initialQty)
    }
  }, [request, isOpen])

  if (!request) return null

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const setItemQty = (id: string, qty: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, Math.min(qty, 100000)),
    }))
  }

  const activeItems = request.items.filter((it) => selectedIds.has(it.id))
  const totalUnits = activeItems.reduce((sum, item) => sum + (quantities[item.id] ?? item.qty), 0)
  const totalValue = activeItems.reduce(
    (sum, item) => sum + (quantities[item.id] ?? item.qty) * item.consignPrice,
    0
  )

  const respond = async (status: 'accepted' | 'rejected') => {
    try {
      let approvedItemsPayload: { productId: string; qty: number }[] | undefined
      if (status === 'accepted' && request.items.length > 0) {
        if (selectedIds.size === 0) {
          toast.show({
            title: 'Pilih produk',
            description: 'Pilih minimal satu produk untuk disetujui, atau tolak pengajuan.',
            type: 'error',
          })
          return
        }
        approvedItemsPayload = activeItems.map((it) => ({
          productId: it.id,
          qty: quantities[it.id] ?? it.qty,
        }))
      }

      await onUpdateStatus(request.id, status, approvedItemsPayload)
      toast.show(
        status === 'accepted'
          ? {
              title: 'Pengajuan disetujui',
              description: `${request.producerBusinessName} kini mitra tokomu (${activeItems.length} produk disetujui).`,
              type: 'success',
            }
          : {
              title: 'Pengajuan ditolak',
              description: `Pengajuan dari ${request.producerBusinessName} sudah ditolak.`,
              type: 'info',
            }
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
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-title-3">
              {request.items.length > 0 ? `Rencana titipan (${request.items.length} produk)` : 'Rencana titipan'}
            </h3>
            {request.status === 'pending' && request.items.length > 0 && (
              <span className="text-caption text-ink-soft">
                Pilih & sesuaikan jumlah barang yang disetujui
              </span>
            )}
          </div>

          {request.items.length === 0 ? (
            <p className="text-body text-ink-soft">
              {request.origin === 'offer'
                ? 'Kemitraan ini berawal dari tawaran tokomu. Jumlah barang dicatat penitip saat mengantar.'
                : 'Penitip belum mencantumkan produk. Tanyakan rinciannya lewat WhatsApp.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
              {request.items.map((item) => {
                const isSelected = selectedIds.has(item.id)
                const currentQty = quantities[item.id] ?? item.qty

                return (
                  <li
                    key={item.id}
                    className={`p-3 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected ? 'border-line bg-white' : 'border-slate-200 bg-slate-50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {request.status === 'pending' && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleItem(item.id)}
                          aria-label={`Pilih ${item.productName}`}
                          className="w-5 h-5 rounded border-line text-slate-900 focus:ring-0 cursor-pointer shrink-0"
                        />
                      )}
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-line bg-slate-50 shrink-0">
                        {item.photoUrl && (
                          <img
                            src={item.photoUrl}
                            alt={item.productName}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-body font-semibold truncate">{item.productName}</p>
                        <p className="text-caption text-ink-soft">
                          Modal {rupiah(item.consignPrice)} · Jual {rupiah(item.suggestedRetailPrice)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line">
                      {request.status === 'pending' && isSelected ? (
                        <div className="flex items-center gap-2">
                          <span className="text-caption text-ink-soft">Jumlah:</span>
                          <Stepper
                            value={currentQty}
                            min={1}
                            max={100000}
                            onChange={(val) => setItemQty(item.id, val)}
                          />
                        </div>
                      ) : (
                        <span className="text-body font-medium text-ink-soft">
                          {currentQty} pcs
                        </span>
                      )}
                      <p className="text-body font-mono font-semibold shrink-0">
                        {rupiah(item.consignPrice * currentQty)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          {request.items.length > 0 && (
            <p className="text-body mt-2 flex justify-between">
              <span className="text-ink-soft">{totalUnits} pcs disetujui · total nilai titip</span>
              <span className="font-mono font-semibold">{rupiah(totalValue)}</span>
            </p>
          )}
        </section>

        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-line">
          {request.producerWhatsapp && (
            <a
              href={whatsappLink(
                request.producerWhatsapp,
                `Halo ${request.producerOwnerName} (${request.producerBusinessName}), saya pemilik toko di Titipku tentang titip-jual produk Anda.`
              )}
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
              <Button
                variant="outline"
                className="flex-1 rounded-xl min-h-[44px]"
                disabled={isUpdating}
                onClick={() => respond('rejected')}
              >
                Tolak
              </Button>
              <Button
                variant="primary"
                className="flex-1 rounded-xl min-h-[44px]"
                loading={isUpdating}
                onClick={() => respond('accepted')}
              >
                {selectedIds.size < request.items.length && request.items.length > 0
                  ? `Setujui ${selectedIds.size} produk`
                  : 'Setujui semua'}
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
