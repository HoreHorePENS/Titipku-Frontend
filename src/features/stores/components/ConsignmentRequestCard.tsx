import { formatRupiah } from '@/lib/format'
import type { ConsignmentRequest } from '../consignment-requests'

interface ConsignmentRequestCardProps {
  request: ConsignmentRequest
  onClick: (request: ConsignmentRequest) => void
  onApprove?: (request: ConsignmentRequest) => void
  onReject?: (request: ConsignmentRequest) => void
  onCalculate?: (request: ConsignmentRequest) => void
}

export function ConsignmentRequestCard({
  request,
  onClick,
  onApprove,
  onReject,
  onCalculate,
}: ConsignmentRequestCardProps) {
  // Tampilan ringkas mirip nav warung untuk penitip yang telah disetujui
  if (request.status === 'accepted') {
    return (
      <div
        onClick={() => onClick(request)}
        className="w-full p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex items-center justify-between gap-3 shadow-2xs cursor-pointer"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
            {request.producerBusinessName.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {request.producerBusinessName}
              </h4>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">
                Disetujui
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <svg className="w-3.5 h-3.5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span className="truncate">
                {request.producerCity || 'Lokasi belum disetel'} · {request.producerOwnerName} ({request.items.length} produk)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          {onCalculate && (
            <button
              type="button"
              onClick={() => onCalculate(request)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shrink-0 transition-colors cursor-pointer min-h-[44px] flex items-center gap-1.5 shadow-2xs"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="2" width="16" height="20" rx="2"></rect>
                <line x1="8" y1="6" x2="16" y2="6"></line>
                <line x1="8" y1="10" x2="16" y2="10"></line>
                <line x1="8" y1="14" x2="12" y2="14"></line>
              </svg>
              <span>Hitung &amp; Buat Nota</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onClick(request)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-900 text-slate-900 text-xs font-semibold shrink-0 transition-colors cursor-pointer min-h-[44px] flex items-center justify-center bg-white"
          >
            Lihat Detail
          </button>
        </div>
      </div>
    )
  }

  const totalUnits = request.items.reduce((sum, item) => sum + item.qty, 0)
  const totalConsignValue = request.items.reduce(
    (sum, item) => sum + item.consignPrice * item.qty,
    0
  )

  const productNames = request.items.map((i) => i.productName).join(', ')

  return (
    <div
      onClick={() => onClick(request)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick(request)
        }
      }}
      className="w-full p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-400 hover:shadow-xs transition-all cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-3 group min-h-[64px]"
    >
      {/* Sisi Kiri: Profil Penitip & Produk Konsinyasi */}
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
          {request.producerBusinessName.charAt(0).toUpperCase()}
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-slate-950 truncate">
              {request.producerBusinessName}
            </h4>
            <span className="text-xs text-slate-500 font-medium truncate">
              · {request.producerOwnerName}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Role: Penitip
            </span>
          </div>

          <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
            <span className="font-medium text-slate-800">Produk:</span> {productNames}
          </p>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 flex-wrap">
            <span>{request.producerCity}</span>
            <span>•</span>
            <span>
              Pengajuan: {new Date(request.submittedAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })} WIB
            </span>
          </div>
        </div>
      </div>

      {/* Sisi Kanan: Nilai Titipan & Tombol Approval Cepat */}
      <div className="flex items-center justify-between lg:justify-end gap-3.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
        {/* Estimasi Nilai Titipan */}
        <div className="text-left lg:text-right shrink-0">
          <span className="text-xs font-bold text-slate-900 block">
            {formatRupiah(totalConsignValue)}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            {totalUnits} barang ({request.items.length} varian)
          </span>
        </div>

        {/* Action Buttons / Status */}
        <div className="flex items-center gap-2 shrink-0">
          {request.status === 'pending' ? (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {/* Tombol Tolak Cepat */}
              {onReject && (
                <button
                  type="button"
                  onClick={() => onReject(request)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer min-h-[44px]"
                  title="Tolak permohonan penitip ini"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  <span>Tolak</span>
                </button>
              )}

              {/* Tombol Setujui / Approve Cepat di Kanan Bar */}
              {onApprove && (
                <button
                  type="button"
                  onClick={() => onApprove(request)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer min-h-[44px]"
                  title="Setujui permohonan penitip ini"
                >
                  <svg
                    className="w-3.5 h-3.5 stroke-[2.5]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Setujui</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                Ditolak
              </span>
              {onApprove && (
                <button
                  type="button"
                  onClick={() => onApprove(request)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                  title="Setujui kembali"
                >
                  Setujui
                </button>
              )}
            </div>
          )}

          {/* Chevron untuk Melihat Detail */}
          <div
            className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors shrink-0"
            title="Klik baris untuk melihat rincian lengkap"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
