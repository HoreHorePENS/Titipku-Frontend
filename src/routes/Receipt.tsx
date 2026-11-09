import { useParams } from 'react-router-dom'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/Button'
import { usePublicInvoice } from '@/features/visit/api'
import { rupiah, formatDateWIB } from '@/lib/format'

export default function ReceiptRoute() {
  const { token } = useParams<{ token: string }>()
  const { data: invoice, isLoading, isError, refetch } = usePublicInvoice(token)

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 font-sans flex flex-col gap-4">
        <Skeleton variant="rect" className="h-28 w-full rounded-2xl" />
        <Skeleton variant="rect" className="h-64 w-full rounded-2xl" />
        <Skeleton variant="rect" className="h-32 w-full rounded-2xl" />
      </div>
    )
  }

  if (isError || !invoice) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 font-sans">
        <ErrorState
          title="Nota Tidak Ditemukan"
          description="Tautan nota digital ini tidak valid atau telah kadaluarsa. Pastikan tautan yang Anda buka sesuai dengan pesan WhatsApp."
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  const statusLabel =
    invoice.status === 'paid' ? 'LUNAS' : invoice.status === 'partial' ? 'SEBAGIAN' : 'BELUM LUNAS'

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-page py-6 px-4 md:py-10 md:px-6 font-sans">
      <div className="max-w-xl mx-auto bg-surface rounded-3xl border border-line p-5 md:p-8 shadow-sm print:border-none print:shadow-none print:p-0">
        {/* 1. Header Nota Resmi */}
        <div className="border-b border-line pb-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-caption font-bold text-primary uppercase tracking-wider">
                Nota Titipan Konsinyasi
              </span>
              <h1 className="text-title-1 text-ink mt-0.5">
                {invoice.business.name}
              </h1>
              <p className="text-caption text-ink-soft mt-0.5">
                Pemilik: {invoice.business.owner_name}{' '}
                {invoice.business.whatsapp ? `· WA: ${invoice.business.whatsapp}` : ''}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <StatusBadge status={statusLabel} />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-line/60 grid grid-cols-2 gap-2 text-caption">
            <div>
              <span className="text-ink-soft block">No. Nota:</span>
              <strong className="text-ink font-mono">{invoice.visit_number}</strong>
            </div>

            <div className="text-right">
              <span className="text-ink-soft block">Waktu Kunjungan:</span>
              <strong className="text-ink">{formatDateWIB(invoice.visit_date)}</strong>
            </div>

            <div className="mt-1">
              <span className="text-ink-soft block">Mitra Warung:</span>
              <strong className="text-ink">{invoice.partner.name}</strong>
            </div>

            <div className="mt-1 text-right">
              <span className="text-ink-soft block">Diterima oleh:</span>
              <strong className="text-ink">{invoice.received_by || invoice.partner.owner_name}</strong>
            </div>
          </div>
        </div>

        {/* 2. Rincian Barang Konsinyasi */}
        <div className="py-5">
          <h2 className="text-label text-ink-soft uppercase tracking-wider mb-3">
            Rincian Barang
          </h2>

          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-caption border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface-raised/50 text-caption font-bold text-ink-soft">
                  <th className="py-2.5 px-3">PRODUK</th>
                  <th className="py-2.5 px-2 text-right">SISA</th>
                  <th className="py-2.5 px-2 text-right">RETUR</th>
                  <th className="py-2.5 px-2 text-right">LAKU</th>
                  <th className="py-2.5 px-2 text-right">TITIP</th>
                  <th className="py-2.5 px-2 text-right">STOK JADI</th>
                  <th className="py-2.5 px-3 text-right">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {invoice.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-surface-raised/30">
                    <td className="py-3 px-3 font-bold text-ink">{it.product_name}</td>
                    <td className="py-3 px-2 text-right tabular-nums">{it.remaining}</td>
                    <td className="py-3 px-2 text-right tabular-nums text-danger">{it.returned}</td>
                    <td className="py-3 px-2 text-right tabular-nums font-bold text-ink">{it.sold}</td>
                    <td className="py-3 px-2 text-right tabular-nums">{it.new_drop}</td>
                    <td className="py-3 px-2 text-right tabular-nums font-bold text-primary">
                      {it.stock_after}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-bold text-ink">
                      {rupiah(it.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Ringkasan Total Tagihan & Pembayaran */}
        <div className="p-4 rounded-2xl bg-surface-raised border border-line flex flex-col gap-2.5 text-caption">
          <div className="flex justify-between items-center text-body">
            <span className="font-bold text-ink">Total Terjual Hari Ini:</span>
            <span className="font-bold text-primary tabular-nums text-title-3">
              {rupiah(invoice.total)}
            </span>
          </div>

          <div className="flex justify-between items-center text-ink-soft">
            <span>Uang Diserahkan / Dibayar:</span>
            <span className="font-bold text-ink tabular-nums">{rupiah(invoice.paid)}</span>
          </div>

          <div className="pt-2 border-t border-line flex justify-between items-center text-caption">
            <span className="font-bold text-ink">Sisa Piutang:</span>
            <span
              className={`font-bold tabular-nums ${
                invoice.remaining > 0 ? 'text-danger' : 'text-success'
              }`}
            >
              {rupiah(invoice.remaining)}
            </span>
          </div>
        </div>

        {/* 4. Footer & Tombol Cetak / Bagikan */}
        <div className="mt-6 pt-4 border-t border-line flex items-center justify-between gap-3 print:hidden">
          <p className="text-caption text-ink-soft">
            Bukti titipan konsinyasi sah yang dibuat secara otomatis oleh Titipku.
          </p>

          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            className="rounded-lg text-caption font-bold shrink-0"
          >
            🖨 Cetak Nota
          </Button>
        </div>
      </div>
    </div>
  )
}
