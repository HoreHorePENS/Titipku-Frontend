import { Button } from '@/components/ui/Button'
import { rupiah } from '@/lib/format'
import { REQUEST_STATUS_LABEL, formatRequestDate, type ConsignmentRequest } from '../consignment-requests'

interface ConsignmentRequestCardProps {
  request: ConsignmentRequest
  onClick: (request: ConsignmentRequest) => void
  onApprove?: (request: ConsignmentRequest) => void
  onReject?: (request: ConsignmentRequest) => void
  /** Buka daftar nota penjualan dari penitip ini (hanya-baca). */
  onViewNotas?: (request: ConsignmentRequest) => void
  /** true saat aksi setuju/tolak untuk kartu ini sedang diproses. */
  busy?: boolean
}

export function ConsignmentRequestCard({ request, onClick, onApprove, onReject, onViewNotas, busy = false }: ConsignmentRequestCardProps) {
  const totalUnits = request.items.reduce((sum, item) => sum + item.qty, 0)
  const totalValue = request.items.reduce((sum, item) => sum + item.qty * item.consignPrice, 0)
  const summary =
    request.items.length > 0
      ? `${request.items.length} produk · ${totalUnits} pcs · nilai titip ${rupiah(totalValue)}`
      : request.origin === 'offer'
        ? 'Bermitra lewat tawaran tokomu'
        : 'Tanpa rincian produk'

  return (
    <article className="p-4 bg-white rounded-2xl border border-line hover:border-line-strong transition-colors flex flex-col gap-3">
      <button type="button" onClick={() => onClick(request)} className="min-w-0 w-full text-left cursor-pointer">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-title-3 text-ink truncate">{request.producerBusinessName}</h3>
          <span className="text-caption font-semibold px-2 py-0.5 rounded-full border border-line text-ink-soft">
            {REQUEST_STATUS_LABEL[request.status]}
          </span>
        </div>
        <p className="text-caption text-ink-soft mt-0.5 truncate">
          {request.producerOwnerName}
          {request.producerAddress ? ` · ${request.producerAddress}` : ''} · {formatRequestDate(request.submittedAt)}
        </p>
        <p className="text-body text-ink mt-1 truncate">{summary}</p>
      </button>

      {/* Tombol selalu di baris bawah agar tidak menimpa nama penitip di layar sempit. */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-line">
        {request.status === 'pending' && onReject && (
          <Button variant="outline" size="sm" className="rounded-xl min-h-[44px]" disabled={busy} onClick={() => onReject(request)}>
            Tolak
          </Button>
        )}
        {request.status === 'pending' && onApprove && (
          <Button variant="primary" size="sm" className="rounded-xl min-h-[44px]" loading={busy} onClick={() => onApprove(request)}>
            Setujui
          </Button>
        )}
        {request.status === 'accepted' && onViewNotas && (
          <Button variant="primary" size="sm" className="rounded-xl min-h-[44px]" onClick={() => onViewNotas(request)}>
            Nota penjualan
          </Button>
        )}
        <Button variant="outline" size="sm" className="rounded-xl min-h-[44px]" onClick={() => onClick(request)}>
          Detail
        </Button>
      </div>
    </article>
  )
}
