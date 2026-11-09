import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/toast-store'
import { formatRupiah } from '@/lib/format'
import type { ConsignmentRequest } from '../consignment-requests'

interface ConsignmentRequestDetailModalProps {
  request: ConsignmentRequest | null
  isOpen: boolean
  onClose: () => void
  onUpdateStatus: (requestId: string, status: 'accepted' | 'rejected') => void
  onCreateInvoice?: (request: ConsignmentRequest) => void
}

export function ConsignmentRequestDetailModal({
  request,
  isOpen,
  onClose,
  onUpdateStatus,
  onCreateInvoice,
}: ConsignmentRequestDetailModalProps) {
  if (!request) return null

  const totalUnits = request.items.reduce((sum, item) => sum + item.qty, 0)
  const totalConsignValue = request.items.reduce(
    (sum, item) => sum + item.consignPrice * item.qty,
    0
  )

  const cleanWaNumber = request.producerWhatsapp.replace(/\D/g, '')
  const formattedWa = cleanWaNumber.startsWith('0')
    ? '62' + cleanWaNumber.slice(1)
    : cleanWaNumber.startsWith('62')
    ? cleanWaNumber
    : '62' + cleanWaNumber

  const whatsappMessage = encodeURIComponent(
    `Halo ${request.producerOwnerName} (${request.producerBusinessName}), kami dari pemilik warung telah melihat permohonan titip-jual barang dagangan Anda melalui Titipku.`
  )
  const waUrl = `https://wa.me/${formattedWa}?text=${whatsappMessage}`

  const handleAccept = () => {
    onUpdateStatus(request.id, 'accepted')
    toast.show({
      title: 'Permintaan Titipan Diterima',
      description: `Anda telah menyetujui penitipan dari ${request.producerBusinessName}. Silakan hubungi produsen untuk koordinasi drop barang.`,
      type: 'success',
    })
    onClose()
  }

  const handleReject = () => {
    onUpdateStatus(request.id, 'rejected')
    toast.show({
      title: 'Permintaan Ditolak',
      description: `Permintaan dari ${request.producerBusinessName} telah ditandai ditolak.`,
      type: 'info',
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian User Penitip & Barang Titipan"
      maxWidth="lg"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-900 bg-white hover:bg-slate-50 text-slate-900 text-xs font-semibold shadow-2xs transition-all w-full sm:w-auto min-h-[44px]"
          >
            <svg
              className="w-4 h-4 text-emerald-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            <span>Hubungi via WhatsApp</span>
          </a>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {request.status === 'pending' ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={handleReject}
                  className="rounded-xl min-h-[44px] text-xs font-semibold text-rose-700 hover:text-rose-900 border-rose-200 hover:bg-rose-50"
                >
                  Tolak Permintaan
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleAccept}
                  className="rounded-xl min-h-[44px] text-xs font-semibold"
                >
                  Setujui Titipan (Approve)
                </Button>
              </>
            ) : request.status === 'accepted' ? (
              <>
                {onCreateInvoice && (
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={() => {
                      onClose()
                      onCreateInvoice(request)
                    }}
                    className="rounded-xl min-h-[44px] text-xs font-semibold"
                  >
                    + Buat Nota Penjualan
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={onClose}
                  className="rounded-xl min-h-[44px] text-xs font-semibold"
                >
                  Tutup
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleAccept}
                  className="rounded-xl min-h-[44px] text-xs font-semibold"
                >
                  Setujui Penitip Ini
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={onClose}
                  className="rounded-xl min-h-[44px] text-xs font-semibold"
                >
                  Tutup Detail
                </Button>
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-5 text-slate-800 font-sans">
        {/* Header Produsen & Role */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-2xs">
              {request.producerBusinessName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {request.producerBusinessName}
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 border border-slate-300">
                  Role: Penitip
                </span>
                {request.status === 'pending' && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                    Menunggu Approval
                  </span>
                )}
                {request.status === 'accepted' && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">
                    ✓ Telah Disetujui (Aktif)
                  </span>
                )}
                {request.status === 'rejected' && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    Ditolak
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemilik / Produsen: <span className="font-semibold text-slate-800">{request.producerOwnerName}</span> · {request.producerCity}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Kontak WhatsApp: <span className="font-mono text-slate-700">{request.producerWhatsapp}</span>
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[11px] text-slate-400 block">Waktu Pengajuan:</span>
            <span className="text-xs font-semibold text-slate-800">
              {new Date(request.submittedAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              WIB
            </span>
          </div>
        </div>

        {/* Catatan / Pesan dari Produsen */}
        {request.note && (
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 flex flex-col gap-1 shadow-2xs">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-slate-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              Catatan Pengajuan dari Penitip:
            </span>
            <p className="italic text-slate-600 pl-5">"{request.note}"</p>
          </div>
        )}

        {/* Banner Aksi Hitung Penjualan & Buat Nota (Khusus Penitip Disetujui) */}
        {request.status === 'accepted' && onCreateInvoice && (
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="2" width="16" height="20" rx="2"></rect>
                  <line x1="8" y1="6" x2="16" y2="6"></line>
                  <line x1="8" y1="10" x2="16" y2="10"></line>
                  <line x1="8" y1="14" x2="12" y2="14"></line>
                </svg>
                <span>Hitung Penjualan &amp; Terbitkan Nota</span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Hitung sisa produk di rak, barang retur, dan stok baru untuk menentukan total barang terjual.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose()
                onCreateInvoice(request)
              }}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold shrink-0 transition-colors cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <span>Mulai Hitung Stok</span>
              <span>→</span>
            </button>
          </div>
        )}

        {/* Tabel Rincian Barang Konsinyasi */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Daftar Barang Titipan ({request.items.length} Macam)
            </h4>
            <span className="text-xs text-slate-500 font-medium">{totalUnits} total unit</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Nama Produk</th>
                  <th className="py-2.5 px-3">Kategori</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Harga Titip (Modal)</th>
                  <th className="py-2.5 px-3 text-right">Subtotal Modal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {request.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-900">{item.productName}</td>
                    <td className="py-2.5 px-3 text-slate-500">{item.category}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                      {item.qty} {item.unit}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-800">
                      {formatRupiah(item.consignPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      {formatRupiah(item.consignPrice * item.qty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ringkasan Modal Bersih */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Total Modal Barang Titipan:</span>
            <span className="text-sm font-bold text-slate-900">{formatRupiah(totalConsignValue)}</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}
