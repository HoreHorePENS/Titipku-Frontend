import { rupiah } from '@/lib/format'
import type { InvoicesMetricSummary } from '../types'

export interface InvoiceSummaryCardsProps {
  metrics: InvoicesMetricSummary
  onSelectPartner?: (partnerId: string) => void
}

export function InvoiceSummaryCards({ metrics, onSelectPartner }: InvoiceSummaryCardsProps) {
  return (
    <div className="flex flex-col gap-3.5 w-full font-sans">
      {/* 1. Baris Kartu Angka Utama (Belum Lunas & Sudah Masuk Bulan Ini) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Kartu Belum Lunas */}
        <div className="p-4 md:p-5 rounded-2xl bg-surface border border-line shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-ink-soft uppercase tracking-wider block">
              Belum lunas
            </span>
            <div className="text-2xl md:text-3xl font-extrabold text-danger tabular-nums tracking-tight mt-1">
              {rupiah(metrics.totalUnpaidAmount)}
            </div>
          </div>
          <p className="text-xs text-ink-soft mt-2">
            dari <strong className="text-ink">{metrics.totalUnpaidPartnersCount} warung</strong> ({metrics.totalUnpaidInvoicesCount} nota)
          </p>
        </div>

        {/* Kartu Sudah Masuk Bulan Ini */}
        <div className="p-4 md:p-5 rounded-2xl bg-surface border border-line shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-ink-soft uppercase tracking-wider block">
              Sudah masuk bulan ini
            </span>
            <div className="text-2xl md:text-3xl font-extrabold text-success tabular-nums tracking-tight mt-1">
              {rupiah(metrics.totalCollectedThisMonth)}
            </div>
          </div>
          <p className="text-xs text-ink-soft mt-2">
            Pelunasan tercatat periode berjalan
          </p>
        </div>
      </div>

      {/* 2. Banner Peringatan Menunggak (Merah Bata Sesuai Mockup Slide 5) */}
      {metrics.overduePartners.length > 0 && (
        <div className="p-4 rounded-2xl bg-danger-soft/70 border border-danger/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs animate-fadeIn">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
              <h3 className="text-xs md:text-sm font-extrabold text-danger">
                {metrics.overduePartners.length} warung belum bayar &gt; 14 hari
              </h3>
              <span className="text-xs font-bold text-danger tabular-nums hidden sm:inline">
                · Total {rupiah(metrics.totalOverdueAmount)}
              </span>
            </div>

            {/* Chips Warung Menunggak */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {metrics.overduePartners.map((op) => (
                <button
                  key={op.partnerId}
                  type="button"
                  onClick={() => onSelectPartner?.(op.partnerId)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-danger/30 text-xs font-bold text-danger hover:bg-danger-soft active:scale-95 transition-all shadow-2xs"
                >
                  <span>{op.partnerName}</span>
                  <span className="text-[11px] font-normal text-danger/80">({op.days} hari)</span>
                </button>
              ))}
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs font-bold text-danger sm:hidden block tabular-nums">
              Total {rupiah(metrics.totalOverdueAmount)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
