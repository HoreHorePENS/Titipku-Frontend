import { Link } from 'react-router-dom'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Money } from '@/components/shared/Money'
import { Button } from '@/components/ui/Button'
import { formatDateWIB, rupiah } from '@/lib/format'
import { useVisitDetail } from '../api'
import type { VisitRecord } from '../types'

export interface VisitDetailModalProps {
  visit: VisitRecord | null
  onClose: () => void
}

export function VisitDetailModal({ visit: initialVisit, onClose }: VisitDetailModalProps) {
  const { data: detailedVisit } = useVisitDetail(initialVisit?.id)
  const visit = detailedVisit || initialVisit

  if (!visit) return null

  const statusLabel =
    visit.status === 'paid' ? 'LUNAS' : visit.status === 'partial' ? 'SEBAGIAN' : 'BELUM LUNAS'

  const notaLink = visit.publicToken ? `/n/${visit.publicToken}` : `/kunjungan`

  const handleOpenWhatsApp = () => {
    if (visit.whatsappUrl) {
      window.open(visit.whatsappUrl, '_blank', 'noopener,noreferrer')
    } else {
      const phone = visit.partnerWhatsApp || ''
      const msg = encodeURIComponent(
        `Halo, ini nota titipan nomor ${visit.number}. Total: ${rupiah(visit.total)}. Terima kasih!`
      )
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-fadeIn">
      <div
        className="relative w-full max-w-2xl bg-surface rounded-2xl border border-line shadow-xl max-h-[90vh] flex flex-col overflow-hidden font-sans"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header Modal */}
        <div className="p-5 border-b border-line flex items-start justify-between bg-surface">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 id="modal-title" className="text-lg font-bold text-ink">
                Nota {visit.number}
              </h2>
              <StatusBadge status={statusLabel} />
            </div>
            <p className="text-xs text-ink-soft mt-1">
              {formatDateWIB(visit.visitedAt)} · {visit.partnerName}{' '}
              {visit.partnerArea ? `(${visit.partnerArea})` : ''}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:bg-surface-raised hover:text-ink transition-colors"
            aria-label="Tutup dialog"
          >
            ✕
          </button>
        </div>

        {/* Konten Scrollable: Rincian Produk */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-xl bg-surface-raised border border-line">
            <div>
              <span className="text-ink-soft block">Diterima oleh:</span>
              <strong className="text-ink text-sm">{visit.receivedBy || '-'}</strong>
            </div>
            <div>
              <span className="text-ink-soft block">Mitra / Pemilik:</span>
              <strong className="text-ink text-sm">{visit.partnerOwnerName || visit.partnerName}</strong>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-ink-soft uppercase tracking-wider mb-2">
              Rincian Barang Titipan
            </h3>

            {visit.items.length === 0 ? (
              <p className="text-xs text-ink-soft py-3 text-center italic">
                Tidak ada rincian pergerakan barang pada kunjungan ini.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-line">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-surface-raised/60 text-[11px] font-bold text-ink-soft">
                      <th className="py-2.5 px-3">PRODUK</th>
                      <th className="py-2.5 px-2 text-right">SISA</th>
                      <th className="py-2.5 px-2 text-right">RETUR</th>
                      <th className="py-2.5 px-2 text-right">TERJUAL</th>
                      <th className="py-2.5 px-2 text-right">TITIP</th>
                      <th className="py-2.5 px-3 text-right">SUBTOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/70">
                    {visit.items.map((it, idx) => (
                      <tr key={it.id || idx} className="hover:bg-surface-raised/30">
                        <td className="py-2.5 px-3 font-semibold text-ink">{it.productName}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums">{it.remaining}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums text-danger">{it.returned}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums font-bold text-ink">{it.sold}</td>
                        <td className="py-2.5 px-2 text-right tabular-nums">{it.newDrop}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-bold text-ink">
                          {rupiah(it.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Ringkasan Pembayaran */}
          <div className="p-4 rounded-xl bg-surface-raised/50 border border-line flex flex-col gap-2 text-xs">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-ink">Total Tagihan:</span>
              <span className="font-extrabold text-primary tabular-nums">
                <Money amount={visit.total} />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ink-soft">Telah Dibayar:</span>
              <span className="font-bold text-ink tabular-nums">{rupiah(visit.paid)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-line/60">
              <span className="text-ink-soft">Sisa Piutang:</span>
              <span className="font-bold text-danger tabular-nums">
                {rupiah(Math.max(0, visit.total - visit.paid))}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Modal: Tombol Aksi */}
        <div className="p-4 border-t border-line bg-surface flex items-center justify-between gap-3">
          <Button variant="secondary" size="md" onClick={onClose} className="rounded-lg text-xs font-bold">
            Tutup
          </Button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="px-3.5 py-2 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
            >
              <span>💬</span>
              <span>WhatsApp</span>
            </button>

            <Link to={notaLink} target="_blank">
              <Button variant="primary" size="md" className="rounded-lg text-xs font-bold shadow-2xs">
                Buka Nota ↗
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
