import { useState } from 'react'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/toast-store'
import { describeApiError } from '@/lib/api-errors'
import { downloadPdf } from '@/lib/simple-pdf'
import { formatDateWIB, formatRupiah } from '@/lib/format'
import { buildNotaPdf, notaPdfFilename } from '../nota-pdf'
import {
  STORE_NOTA_STATUS_LABEL,
  useStoreNota,
  useStoreNotas,
  type StoreNota,
  type StoreNotaPaymentStatus,
} from '../store-visits-api'

const STATUS_CLASS: Record<StoreNotaPaymentStatus, string> = {
  paid: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  partial: 'bg-amber-50 text-amber-800 border-amber-200',
  unpaid: 'bg-rose-50 text-rose-800 border-rose-200',
  no_invoice: 'bg-slate-100 text-slate-600 border-slate-200',
}

function StatusBadge({ status }: { status: StoreNotaPaymentStatus }) {
  return (
    <span className={`text-caption font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${STATUS_CLASS[status]}`}>
      {STORE_NOTA_STATUS_LABEL[status]}
    </span>
  )
}

export interface StoreNotaModalProps {
  isOpen: boolean
  onClose: () => void
  storeName: string
  /** Batasi daftar ke nota dari satu penitip (usaha penitip). */
  businessId?: string | null
  businessName?: string | null
  /** Langsung buka detail nota ini (mis. dari notifikasi). */
  initialNotaId?: string | null
}

/**
 * Detail nota penjualan untuk pemilik toko: daftar nota dari penitip (API),
 * rincian isi nota, dan unduh PDF. Toko tidak membuat/mengubah nota.
 */
export function StoreNotaModal({ isOpen, onClose, storeName, businessId, businessName, initialNotaId }: StoreNotaModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialNotaId ?? null)
  // Sesuaikan pilihan saat modal dibuka dengan nota awal berbeda (tanpa effect).
  const [openedFor, setOpenedFor] = useState<string | null>(null)
  const openKey = isOpen ? `${initialNotaId ?? ''}|${businessId ?? ''}` : null
  if (openKey !== openedFor) {
    setOpenedFor(openKey)
    if (openKey !== null) setSelectedId(initialNotaId ?? null)
  }

  const listQuery = useStoreNotas(isOpen)
  const detailQuery = useStoreNota(isOpen ? selectedId : null)
  const notas = (listQuery.data ?? []).filter((n) => !businessId || n.businessId === businessId)

  const handleDownload = (nota: StoreNota) => {
    try {
      downloadPdf(buildNotaPdf(nota, storeName), notaPdfFilename(nota))
    } catch {
      toast.show({ title: 'PDF belum bisa dibuat', description: 'Coba lagi beberapa saat lagi.', type: 'error' })
    }
  }

  const nota = detailQuery.data

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedId ? 'Detail nota penjualan' : 'Nota penjualan'}
      description={
        selectedId
          ? nota
            ? `${nota.number} · dari ${nota.businessName}`
            : 'Memuat nota…'
          : businessName
            ? `Nota dari ${businessName} untuk ${storeName}`
            : `Nota dari penitip untuk ${storeName}`
      }
      maxWidth="2xl"
      footer={
        selectedId ? (
          <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:justify-between">
            <Button variant="outline" className="rounded-xl min-h-[44px]" onClick={() => setSelectedId(null)}>
              ← Semua nota
            </Button>
            <Button
              variant="primary"
              className="rounded-xl min-h-[44px]"
              disabled={!nota}
              onClick={() => nota && handleDownload(nota)}
            >
              Download nota (PDF)
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="py-2 font-sans text-slate-900">
        {selectedId ? (
          detailQuery.isLoading ? (
            <p className="py-10 text-center text-caption text-slate-500">Memuat rincian nota…</p>
          ) : detailQuery.isError || !nota ? (
            <div className="py-10 flex flex-col items-center gap-3 text-center text-caption text-slate-500">
              <span>{describeApiError(detailQuery.error).message}</span>
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => detailQuery.refetch()}>
                Coba lagi
              </Button>
            </div>
          ) : (
            <NotaDetail nota={nota} />
          )
        ) : listQuery.isLoading ? (
          <p className="py-10 text-center text-caption text-slate-500">Memuat daftar nota…</p>
        ) : listQuery.isError ? (
          <div className="py-10 flex flex-col items-center gap-3 text-center text-caption text-slate-500">
            <span>{describeApiError(listQuery.error).message}</span>
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => listQuery.refetch()}>
              Coba lagi
            </Button>
          </div>
        ) : notas.length === 0 ? (
          <div className="p-6 text-center text-caption text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
            Belum ada nota. Nota muncul di sini setelah penitip mencatat kunjungan ke tokomu.
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {notas.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(n.id)}
                  className="w-full text-left p-3.5 rounded-2xl border border-line bg-white hover:border-slate-400 transition-colors flex items-center justify-between gap-3 min-h-[44px] cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-label text-ink truncate">
                      {n.number} · {n.businessName}
                    </p>
                    <p className="text-caption text-ink-soft">{formatDateWIB(n.visitedAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-label tabular-nums">{formatRupiah(n.total)}</span>
                    <StatusBadge status={n.paymentStatus} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}

function NotaDetail({ nota }: { nota: StoreNota }) {
  const remaining = Math.max(0, nota.total - nota.paid)
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-caption">
        <div>
          <span className="text-slate-500">Penitip: </span>
          <strong>{nota.businessName}</strong>
          {nota.ownerName && nota.ownerName !== nota.businessName ? ` (${nota.ownerName})` : ''}
        </div>
        <div>
          <span className="text-slate-500">Tanggal: </span>
          <strong>{formatDateWIB(nota.visitedAt)}</strong>
        </div>
        <div>
          <span className="text-slate-500">Diterima oleh: </span>
          <strong>{nota.receivedBy || '-'}</strong>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Status:</span>
          <StatusBadge status={nota.paymentStatus} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-left text-caption border-collapse">
          <thead>
            <tr className="border-b border-line bg-slate-50 font-bold text-slate-500">
              <th className="py-2.5 px-3">PRODUK</th>
              <th className="py-2.5 px-3 text-right">SISA</th>
              <th className="py-2.5 px-3 text-right">RETUR</th>
              <th className="py-2.5 px-3 text-right">LAKU</th>
              <th className="py-2.5 px-3 text-right">TITIP BARU</th>
              <th className="py-2.5 px-3 text-right">SUBTOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {nota.items.map((it) => (
              <tr key={it.productId}>
                <td className="py-2.5 px-3 font-semibold">
                  {it.productName}
                  <span className="block text-slate-500 font-normal tabular-nums">{formatRupiah(it.unitPrice)} / bks</span>
                </td>
                <td className="py-2.5 px-3 text-right tabular-nums">{it.remaining}</td>
                <td className="py-2.5 px-3 text-right tabular-nums">{it.returned}</td>
                <td className="py-2.5 px-3 text-right tabular-nums font-bold">{it.sold}</td>
                <td className="py-2.5 px-3 text-right tabular-nums">{it.newDrop}</td>
                <td className="py-2.5 px-3 text-right tabular-nums font-bold whitespace-nowrap">{formatRupiah(it.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-1 text-caption self-end w-full sm:w-72">
        <div className="flex justify-between">
          <span className="text-slate-500">Total tagihan</span>
          <strong className="tabular-nums">{formatRupiah(nota.total)}</strong>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Dibayar</span>
          <span className="tabular-nums">{formatRupiah(nota.paid)}</span>
        </div>
        <div className="flex justify-between pt-1 border-t border-line">
          <span className="font-bold">Sisa tagihan</span>
          <strong className="tabular-nums">{formatRupiah(remaining)}</strong>
        </div>
      </div>

      {nota.publicInvoiceUrl && (
        <a
          href={nota.publicInvoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-caption font-semibold text-slate-700 underline underline-offset-2 self-start"
        >
          Buka nota online ↗
        </a>
      )}
    </div>
  )
}
