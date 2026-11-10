import { Button } from '@/components/ui/Button'
import { useProposals } from '@/features/stores/proposals-api'
import { consignedProducts, usePartnerStock } from '../stock-api'
import type { Partner } from '../types'

export interface PartnerDetailPanelProps {
  partner: Partner
  onEdit: (partner: Partner) => void
  onBackMobile?: () => void
}

/** "2027-01-02" -> "2 Jan 2027" (tanggal kalender, tanpa geser zona waktu). */
function formatExpiry(date: string | null): string {
  if (!date) return '-'
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return '-'
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function PartnerDetailPanel({
  partner,
  onEdit,
  onBackMobile,
}: PartnerDetailPanelProps) {
  const stockQuery = usePartnerStock(partner.id)
  const stockItems = consignedProducts(stockQuery.data ?? [])

  // Nama pemilik asli toko (akun pemilik toko) dari data proposal kemitraan;
  // partner manual tetap memakai nama pengelola yang diisi penitip.
  const { data: proposals = [] } = useProposals(Boolean(partner.storeId))
  const storeOwnerName = partner.storeId
    ? proposals.find((p) => p.store.id === partner.storeId)?.store.ownerName
    : undefined
  const ownerName = storeOwnerName || partner.ownerName

  const cleanPhone = (partner.whatsapp || '').replace(/\D/g, '')
  const formattedPhone = cleanPhone.startsWith('0')
    ? '62' + cleanPhone.slice(1)
    : cleanPhone

  const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
    `Halo ${ownerName || partner.name}, dari Titipku...`
  )}`

  const mapsQuery = encodeURIComponent(
    partner.address ? `${partner.name}, ${partner.address}` : partner.name
  )
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`

  return (
    <div className="flex flex-col gap-4 w-full font-sans pb-10 text-slate-900">
      {/* 1. Header Detail Warung Mitra */}
      <div className="p-5 rounded-2xl bg-surface border border-line shadow-2xs flex flex-col gap-3">
        {onBackMobile && (
          <button
            type="button"
            onClick={onBackMobile}
            className="md:hidden self-start flex items-center gap-1.5 text-caption font-bold text-slate-900 active:scale-95 transition-all -ml-1 -mt-1 cursor-pointer"
          >
            <span>←</span>
            <span>Kembali ke daftar</span>
          </button>
        )}

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-title-2 text-slate-900 truncate">
                {partner.name}
              </h2>
              {partner.isActive !== false ? (
                <span className="text-caption font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Tersedia
                </span>
              ) : (
                <span className="text-caption font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Tidak Tersedia
                </span>
              )}
            </div>

            <p className="text-caption text-slate-500 mt-1">
              Pemilik / Pengelola: <strong className="text-slate-800">{ownerName || '-'}</strong>
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(partner)}
            className="text-caption font-semibold rounded-xl h-9 shrink-0 cursor-pointer"
          >
            Ubah Data
          </Button>
        </div>
      </div>

      {/* 2. Lokasi & Kontak */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Lokasi / Alamat */}
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-2xs flex flex-col justify-between gap-3">
          <div>
            <span className="text-caption font-bold text-slate-500 uppercase tracking-wider block">
              LOKASI TOKO MITRA
            </span>
            <p className="text-caption font-semibold text-slate-900 mt-1 leading-relaxed">
              {partner.address || 'Alamat lokasi belum diatur'}
            </p>
          </div>

          {partner.address && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-caption font-semibold transition-colors min-h-[40px] cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
              <span>Buka di Google Maps ↗</span>
            </a>
          )}
        </div>

        {/* Kontak WhatsApp */}
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-2xs flex flex-col justify-between gap-3">
          <div>
            <span className="text-caption font-bold text-slate-500 uppercase tracking-wider block">
              KONTAK WHATSAPP
            </span>
            <p className="text-body font-bold text-slate-900 tabular-nums mt-1">
              {partner.whatsapp || '-'}
            </p>
          </div>

          {partner.whatsapp && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-caption font-semibold transition-colors min-h-[40px] cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>Hubungi via WhatsApp ↗</span>
            </a>
          )}
        </div>
      </div>

      {/* 3. Daftar Produk yang Kita Titipi SAJA */}
      <div className="p-5 rounded-2xl bg-surface border border-line shadow-2xs flex flex-col gap-3">
        <div>
          <h3 className="text-title-3 text-slate-900">Daftar Produk yang Kita Titipi</h3>
          <p className="text-caption text-slate-500 mt-0.5">
            Daftar seluruh item produk konsinyasi yang dititipkan di toko mitra ini
          </p>
        </div>

        {stockQuery.isLoading ? (
          <div className="p-6 text-center text-caption text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
            Memuat stok di rak…
          </div>
        ) : stockQuery.isError ? (
          <div className="p-6 text-center text-caption text-slate-500 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center gap-2">
            <span>Stok di toko ini belum bisa dimuat.</span>
            <Button variant="outline" size="sm" onClick={() => stockQuery.refetch()} className="rounded-xl">
              Coba lagi
            </Button>
          </div>
        ) : stockItems.length === 0 ? (
          <div className="p-6 text-center text-caption text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
            Belum ada produk yang dititipkan ke toko ini. Catat kunjungan untuk mulai menitipkan barang.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-caption border-collapse">
              <thead>
                <tr className="border-b border-line bg-slate-50 text-caption font-bold text-slate-500">
                  <th className="py-2.5 px-4">NAMA PRODUK</th>
                  <th className="py-2.5 px-4 text-right">STOK DI RAK</th>
                  <th className="py-2.5 px-4 text-right whitespace-nowrap">KEDALUWARSA TERDEKAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {stockItems.map((st) => (
                  <tr key={st.productId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {st.productName}
                      {!st.isActive && <span className="ml-1.5 text-slate-400 font-medium">(nonaktif)</span>}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-bold text-slate-900 whitespace-nowrap">
                      {st.onShelf} bungkus
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-600 whitespace-nowrap">
                      {st.onShelf > 0 ? formatExpiry(st.nearestExpiry) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
