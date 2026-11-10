import { useParams, useNavigate } from 'react-router-dom'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { Button } from '@/components/ui/Button'
import { Money } from '@/components/shared/Money'
import { usePublicInvoice } from '@/features/visit/api'
import { formatDateWIB } from '@/lib/format'
import { getAuthToken } from '@/lib/api-client'

export default function ReceiptRoute() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { data: invoice, isLoading, isError, refetch } = usePublicInvoice(token)

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(getAuthToken() ? '/kunjungan' : '/landing')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleWhatsApp = () => {
    if (!invoice) return
    const phone = invoice.partner.whatsapp || invoice.business.whatsapp || ''
    const cleanPhone = phone.replace(/\D/g, '')
    const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone
    const msg = encodeURIComponent(
      `Halo, ini bukti Nota Titipan nomor ${invoice.visit_number}. Total: ${invoice.total}. Terima kasih!`
    )
    window.open(`https://wa.me/${waPhone}?text=${msg}`, '_blank', 'noopener,noreferrer')
  }

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
        <div className="mb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="rounded-xl min-h-[48px] text-caption font-bold flex items-center gap-2 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Kembali</span>
          </Button>
        </div>
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

  return (
    <div className="min-h-screen bg-page py-6 px-4 md:py-10 md:px-6 font-sans print:bg-white print:p-0 print:m-0">
      {/* 0. Top Bar Navigasi Kembali & Aksi Cepat (Disembunyikan saat Cetak) */}
      <div className="max-w-xl mx-auto mb-4 flex items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Kembali ke halaman sebelumnya"
          className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-caption font-bold text-ink hover:text-primary hover:bg-surface border border-line bg-surface/80 transition-all cursor-pointer min-h-[48px] shadow-2xs active:scale-[0.98]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Kembali</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="rounded-xl text-caption font-bold min-h-[48px] px-3.5 flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9V2h12v7" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span className="hidden sm:inline">Cetak</span>
          </Button>
        </div>
      </div>

      {/* Kontainer Utama Nota (Menyelaraskan Desain Resmi Titipku & Modal Cetak PDF) */}
      <div className="max-w-xl mx-auto bg-surface rounded-3xl border border-line p-5 md:p-8 shadow-xs print:border-none print:shadow-none print:p-0 print:max-w-none">
        {/* 1. Header Nota Resmi */}
        <div className="border-b border-line pb-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-caption font-bold text-primary uppercase tracking-wider block">
                Nota Titipan Konsinyasi
              </span>
              <h1 className="text-title-1 font-bold text-ink mt-0.5">
                Nota {invoice.visit_number}
              </h1>
              <p className="text-caption text-ink-soft mt-0.5">
                {formatDateWIB(invoice.visit_date)} • {invoice.partner.name}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <StatusBadge status={statusLabel} />
            </div>
          </div>

          {/* Kartu Ringkasan Pihak Terlibat (2 Kolom Bersih, Identik dengan Modal) */}
          <div className="mt-4 grid grid-cols-2 gap-3 text-caption p-3.5 rounded-2xl bg-surface-raised border border-line">
            <div>
              <span className="text-ink-soft block font-medium">Diterima oleh:</span>
              <strong className="text-ink text-body font-semibold">
                {invoice.received_by || invoice.partner.owner_name || '-'}
              </strong>
            </div>

            <div>
              <span className="text-ink-soft block font-medium">Mitra Warung:</span>
              <strong className="text-ink text-body font-semibold">
                {invoice.partner.name}
              </strong>
              {invoice.partner.whatsapp && (
                <span className="text-ink-soft block text-[11px] font-mono mt-0.5">
                  WA: {invoice.partner.whatsapp}
                </span>
              )}
            </div>

            {invoice.business?.name && (
              <div className="col-span-2 pt-2 border-t border-line/60 flex flex-wrap items-center justify-between text-caption text-ink-soft">
                <span>
                  Penitip: <strong className="text-ink">{invoice.business.name}</strong>
                  {invoice.business.owner_name ? ` (${invoice.business.owner_name})` : ''}
                </span>
                {invoice.business.whatsapp && (
                  <span className="font-mono text-[11px]">WA: {invoice.business.whatsapp}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. Rincian Barang Titipan Konsinyasi (6 Kolom Identik dengan Modal & Istilah Baku) */}
        <div className="py-5">
          <h2 className="text-label text-ink-soft uppercase tracking-wider mb-3">
            Rincian Barang Titipan
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-left text-caption border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface-raised/60 text-caption font-bold text-ink-soft">
                  <th className="py-2.5 px-3">PRODUK</th>
                  <th className="py-2.5 px-2 text-right">SISA</th>
                  <th className="py-2.5 px-2 text-right">RETUR</th>
                  <th className="py-2.5 px-2 text-right">TERJUAL</th>
                  <th className="py-2.5 px-2 text-right">TITIP</th>
                  <th className="py-2.5 px-3 text-right">SUBTOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {invoice.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-ink-soft italic">
                      Tidak ada rincian pergerakan barang pada kunjungan ini.
                    </td>
                  </tr>
                ) : (
                  invoice.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-surface-raised/30 transition-colors">
                      <td className="py-3 px-3 font-semibold text-ink">{it.product_name}</td>
                      <td className="py-3 px-2 text-right tabular-nums">{it.remaining}</td>
                      <td className="py-3 px-2 text-right tabular-nums font-semibold text-danger">{it.returned}</td>
                      <td className="py-3 px-2 text-right tabular-nums font-bold text-ink">{it.sold}</td>
                      <td className="py-3 px-2 text-right tabular-nums">{it.new_drop}</td>
                      <td className="py-3 px-3 text-right tabular-nums font-bold text-ink">
                        <Money amount={it.subtotal} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Ringkasan Total Tagihan & Pembayaran (Identik dengan Modal) */}
        <div className="p-4 rounded-2xl bg-surface-raised/50 border border-line flex flex-col gap-2.5 text-caption">
          <div className="flex justify-between items-center text-body">
            <span className="font-bold text-ink">Total Tagihan:</span>
            <span className="font-bold text-primary tabular-nums text-title-3">
              <Money amount={invoice.total} />
            </span>
          </div>

          <div className="flex justify-between items-center text-ink-soft">
            <span>Telah Dibayar:</span>
            <span className="font-bold text-ink tabular-nums">
              <Money amount={invoice.paid} />
            </span>
          </div>

          <div className="pt-2 border-t border-line/60 flex justify-between items-center text-caption">
            <span className="text-ink-soft font-semibold">Sisa Piutang:</span>
            <span
              className={`font-bold tabular-nums ${
                invoice.remaining > 0 ? 'text-danger' : 'text-success'
              }`}
            >
              <Money amount={invoice.remaining} />
            </span>
          </div>
        </div>

        {/* 4. Footer & Tombol Aksi (Print & WhatsApp) */}
        <div className="mt-6 pt-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
          <p className="text-caption text-ink-soft text-center sm:text-left">
            Dokumen ini merupakan bukti titipan konsinyasi sah yang diterbitkan oleh sistem Titipku.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {(invoice.partner.whatsapp || invoice.business.whatsapp) && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleWhatsApp}
                className="rounded-xl px-3.5 min-h-[48px] text-caption font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                <span>WhatsApp</span>
              </Button>
            )}

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handlePrint}
              className="rounded-xl px-4 min-h-[48px] text-caption font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9V2h12v7" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              <span>Export PDF / Cetak</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
