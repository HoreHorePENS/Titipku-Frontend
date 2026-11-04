import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/Button'
import { rupiah, tanggalWIB } from '@/lib/format'
import type { Invoice } from '../types'

export interface InvoiceCardMobileProps {
  invoice: Invoice
  onPay: (invoice: Invoice) => void
  onResendWA: (invoice: Invoice) => void
  onViewDetail?: (invoice: Invoice) => void
}

export function InvoiceCardMobile({
  invoice,
  onPay,
  onResendWA,
  onViewDetail,
}: InvoiceCardMobileProps) {
  const statusLabel =
    invoice.status === 'paid' ? 'LUNAS' : invoice.status === 'partial' ? 'SEBAGIAN' : 'BELUM LUNAS'

  const isOverdue = invoice.status !== 'paid' && invoice.daysOverdue > 14
  const dateFormatted = tanggalWIB(invoice.issuedAt)

  return (
    <div
      onClick={() => onViewDetail?.(invoice)}
      className="p-4 rounded-2xl bg-surface border border-line shadow-2xs flex flex-col gap-3 active:scale-[0.99] transition-all cursor-pointer hover:border-line-strong font-sans"
    >
      {/* Baris Atas: Nama Warung & Status Badge */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-ink leading-snug">{invoice.partnerName}</h3>
          <p className="text-xs text-ink-soft mt-0.5">
            {invoice.visitNumber} · {dateFormatted}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <StatusBadge status={statusLabel} />
          {isOverdue && (
            <span className="text-[10px] font-bold text-danger bg-danger-soft px-1.5 py-0.5 rounded">
              {invoice.daysOverdue} hari belum bayar
            </span>
          )}
        </div>
      </div>

      {/* Baris Tengah: Sisa Tagihan & Total */}
      <div className="flex items-end justify-between pt-1 border-t border-line/60">
        <div>
          <span className="text-xs text-ink-soft block font-medium">Sisa tagihan:</span>
          <span className="text-base font-extrabold text-ink tabular-nums">
            {rupiah(invoice.remaining)}
          </span>
        </div>

        <div className="text-right text-xs text-ink-soft">
          <span>Total: {rupiah(invoice.total)}</span>
          {invoice.paid > 0 && (
            <span className="block text-success font-semibold">
              Terbayar: {rupiah(invoice.paid)}
            </span>
          )}
        </div>
      </div>

      {/* Baris Bawah: Tombol Aksi */}
      <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
        {invoice.status !== 'paid' && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onPay(invoice)}
            className="flex-1 rounded-xl h-9 text-xs font-bold shadow-2xs"
          >
            Catat bayar
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onResendWA(invoice)}
          className="flex-1 rounded-xl h-9 text-xs font-bold flex items-center justify-center gap-1"
        >
          <span>Kirim via WA</span>
          <span>↗</span>
        </Button>
      </div>
    </div>
  )
}
