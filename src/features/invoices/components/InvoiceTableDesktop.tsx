import { StatusBadge } from '@/components/shared/StatusBadge'
import { rupiah, tanggalWIB } from '@/lib/format'
import type { Invoice } from '../types'

export interface InvoiceTableDesktopProps {
  invoices: Invoice[]
  onPay: (invoice: Invoice) => void
  onResendWA: (invoice: Invoice) => void
  onViewDetail?: (invoice: Invoice) => void
}

export function InvoiceTableDesktop({
  invoices,
  onPay,
  onResendWA,
  onViewDetail,
}: InvoiceTableDesktopProps) {
  if (invoices.length === 0) {
    return (
      <div className="p-12 text-center text-caption text-ink-soft bg-surface rounded-2xl border border-line">
        Tidak ada nota tagihan yang sesuai dengan filter.
      </div>
    )
  }

  return (
    <div className="w-full bg-surface rounded-2xl border border-line shadow-2xs overflow-hidden font-sans">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-caption border-collapse">
          <thead>
            <tr className="border-b border-line bg-surface-raised/60 text-caption font-bold text-ink-soft select-none">
              <th className="py-3 px-4">NO. NOTA</th>
              <th className="py-3 px-4">WARUNG</th>
              <th className="py-3 px-4">TANGGAL</th>
              <th className="py-3 px-4 text-right">TAGIHAN</th>
              <th className="py-3 px-4 text-right">DIBAYAR</th>
              <th className="py-3 px-4 text-right">SISA</th>
              <th className="py-3 px-4">STATUS</th>
              <th className="py-3 px-4 text-right">AKSI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {invoices.map((inv) => {
              const statusLabel =
                inv.status === 'paid' ? 'LUNAS' : inv.status === 'partial' ? 'SEBAGIAN' : 'BELUM LUNAS'
              const isOverdue = inv.status !== 'paid' && inv.daysOverdue > 14
              const dateFormatted = tanggalWIB(inv.issuedAt)

              return (
                <tr
                  key={inv.id}
                  onClick={() => onViewDetail?.(inv)}
                  className="hover:bg-surface-raised/40 transition-colors cursor-pointer group"
                >
                  {/* No. Nota */}
                  <td className="py-3.5 px-4 font-bold text-primary group-hover:underline">
                    {inv.visitNumber}
                  </td>

                  {/* Warung */}
                  <td className="py-3.5 px-4">
                    <strong className="text-ink block font-bold">{inv.partnerName}</strong>
                    <span className="text-caption text-ink-soft">
                      {inv.receivedBy ? `Penerima: ${inv.receivedBy}` : 'Mitra'}
                    </span>
                  </td>

                  {/* Tanggal */}
                  <td className="py-3.5 px-4 text-ink-soft font-medium">
                    {dateFormatted}
                  </td>

                  {/* Tagihan */}
                  <td className="py-3.5 px-4 text-right tabular-nums font-semibold text-ink">
                    {rupiah(inv.total)}
                  </td>

                  {/* Dibayar */}
                  <td className="py-3.5 px-4 text-right tabular-nums font-semibold text-success">
                    {inv.paid > 0 ? rupiah(inv.paid) : '0'}
                  </td>

                  {/* Sisa */}
                  <td className="py-3.5 px-4 text-right tabular-nums font-bold text-ink">
                    {rupiah(inv.remaining)}
                  </td>

                  {/* Status & Overdue Tag */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col items-start gap-1">
                      <StatusBadge status={statusLabel} />
                      {isOverdue && (
                        <span className="text-caption font-bold text-danger">
                          {inv.daysOverdue} hari belum bayar
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Aksi */}
                  <td
                    className="py-3.5 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-2">
                      {inv.status !== 'paid' && (
                        <button
                          type="button"
                          onClick={() => onPay(inv)}
                          className="px-2.5 py-1 rounded-lg bg-primary text-white text-caption font-bold hover:bg-primary-hover active:scale-95 transition-all shadow-2xs"
                        >
                          Catat bayar
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onResendWA(inv)}
                        className="px-2.5 py-1 rounded-lg bg-surface border border-line text-ink text-caption font-semibold hover:bg-surface-raised active:scale-95 transition-all"
                      >
                        Kirim ulang
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
