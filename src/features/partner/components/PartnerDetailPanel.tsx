import { useNavigate } from 'react-router-dom'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/Button'
import { rupiah } from '@/lib/format'
import { calculatePartnerHealth, derivePartnerStock, derivePartnerSuggestion } from '../calc'
import type { Partner } from '../types'
import type { VisitRecord } from '@/features/visit/types'

export interface PartnerDetailPanelProps {
  partner: Partner
  visits?: VisitRecord[]
  onEdit: (partner: Partner) => void
  onBackMobile?: () => void
}

export function PartnerDetailPanel({
  partner,
  visits = [],
  onEdit,
  onBackMobile,
}: PartnerDetailPanelProps) {
  const navigate = useNavigate()

  const health = calculatePartnerHealth(partner, visits)
  const stockItems = derivePartnerStock(partner.id, visits)
  const suggestion = derivePartnerSuggestion(partner, stockItems)

  const partnerVisits = visits
    .filter((v) => v.partnerId === partner.id)
    .sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime())

  const cleanPhone = partner.whatsapp.replace(/\D/g, '')
  const formattedPhone = cleanPhone.startsWith('0')
    ? '62' + cleanPhone.slice(1)
    : cleanPhone

  const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
    `Halo ${partner.ownerName || partner.name}, dari Titipku (Keripik Pisang Rina)...`
  )}`

  const mapsQuery = encodeURIComponent(
    partner.address ? `${partner.name}, ${partner.address}` : partner.name
  )
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`

  const handleStartVisit = () => {
    navigate(`/kunjungan/baru?partnerId=${partner.id}`)
  }

  const handleRecordPayment = () => {
    navigate(`/tagihan?partnerId=${partner.id}`)
  }

  return (
    <div className="flex flex-col gap-5 w-full font-sans pb-16">
      {/* 1. Header Detail Warung */}
      <div className="p-5 rounded-2xl bg-surface border border-line shadow-2xs flex flex-col gap-4">
        {onBackMobile && (
          <button
            type="button"
            onClick={onBackMobile}
            className="md:hidden self-start flex items-center gap-1.5 text-xs font-bold text-primary active:scale-95 transition-all -ml-1 -mt-1"
          >
            <span>←</span>
            <span>Kembali ke daftar</span>
          </button>
        )}

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl md:text-2xl font-extrabold text-ink tracking-tight">
                {partner.name}
              </h2>
              <StatusBadge status={health.label} />
            </div>

            <p className="text-xs text-ink-soft mt-1">
              {partner.address ? partner.address.split(',')[0] : 'Mitra'} · titip sejak Mar 2025
            </p>

            <p className="text-xs font-semibold text-primary mt-1.5 flex items-center gap-1.5">
              <span>●</span>
              <span>{health.reason}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(partner)}
              className="text-xs font-bold rounded-xl h-9"
            >
              Ubah Data
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleStartVisit}
              className="text-xs font-bold rounded-xl h-9 shadow-2xs flex items-center gap-1.5"
            >
              <span>+</span>
              <span>Catat Kunjungan</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Kartu Utang Saat Ini */}
      <div className="p-5 rounded-2xl bg-surface border border-line shadow-2xs flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs text-ink-soft block font-medium">Utang saat ini</span>
            <div className="text-2xl font-extrabold text-ink tabular-nums mt-0.5">
              {rupiah(partner.receivable)}
            </div>
            {partner.receivable > 0 && (
              <p className="text-xs text-danger font-medium mt-1">
                2 nota aktif belum terselesaikan
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {partner.receivable > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRecordPayment}
                className="text-xs font-bold rounded-xl h-9"
              >
                Catat Pembayaran
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleStartVisit}
              className="text-xs font-bold rounded-xl h-9 shadow-xs"
            >
              Catat Kunjungan
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Kontak WhatsApp & Alamat Maps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* WhatsApp Card */}
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-2xs flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider block">
              WHATSAPP
            </span>
            <p className="text-sm font-extrabold text-ink tabular-nums truncate mt-0.5">
              {partner.whatsapp || '-'}
            </p>
            <p className="text-xs text-ink-soft truncate">
              {partner.ownerName ? `${partner.ownerName} (pemilik)` : 'Kontak warung'}
            </p>
          </div>

          {partner.whatsapp && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-2xs hover:bg-primary-hover active:scale-95 transition-all shrink-0 flex items-center gap-1"
            >
              <span>Chat</span>
              <span>↗</span>
            </a>
          )}
        </div>

        {/* Alamat & Maps Card */}
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-2xs flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider block">
              ALAMAT
            </span>
            <p className="text-xs font-bold text-ink line-clamp-2 mt-0.5">
              {partner.address || 'Alamat belum diatur'}
            </p>
          </div>

          {partner.address && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-surface-raised border border-line text-ink text-xs font-bold hover:bg-surface-raised/80 active:scale-95 transition-all shrink-0 flex items-center gap-1"
            >
              <span>Buka Maps</span>
              <span>↗</span>
            </a>
          )}
        </div>
      </div>

      {/* 4. Stok yang Sedang Dititip & Basi Terdekat */}
      <div className="p-5 rounded-2xl bg-surface border border-line shadow-2xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-ink">Stok yang sedang dititip</h3>
            <p className="text-xs text-ink-soft mt-0.5">
              {partnerVisits.length > 0
                ? `per ${new Date(partnerVisits[0].visitedAt).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}`
                : 'Estimasi awal'}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-surface-raised/60 text-[11px] font-bold text-ink-soft">
                <th className="py-2.5 px-3">PRODUK</th>
                <th className="py-2.5 px-3 text-right">DI RAK</th>
                <th className="py-2.5 px-3 text-right">LAKU/HARI</th>
                <th className="py-2.5 px-3 text-right">BASI TERDEKAT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {stockItems.map((st) => (
                <tr key={st.productId} className="hover:bg-surface-raised/30 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-ink">{st.productName}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-bold text-ink">
                    {st.onShelf} bks
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-ink-soft font-semibold">
                    ±{st.dailySales}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-bold text-accent">
                    {st.nearestExpiry}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Saran Kunjungan Berikutnya */}
      <div className="p-4 rounded-2xl bg-accent-soft/40 border border-accent/20 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div>
          <span className="text-[11px] font-bold text-accent uppercase tracking-wider block">
            {suggestion.title}
          </span>
          <p className="text-sm font-extrabold text-ink mt-0.5">{suggestion.content}</p>
          <p className="text-xs text-ink-soft mt-0.5">{suggestion.subtext}</p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleStartVisit}
          className="rounded-xl text-xs font-bold h-9 shrink-0 self-start md:self-center shadow-xs"
        >
          Pakai saran →
        </Button>
      </div>

      {/* 6. Riwayat Kunjungan Warung Ini */}
      <div className="p-5 rounded-2xl bg-surface border border-line shadow-2xs flex flex-col gap-3">
        <h3 className="text-sm font-bold text-ink">Riwayat kunjungan</h3>

        {partnerVisits.length === 0 ? (
          <p className="text-xs text-ink-soft py-4 text-center italic">
            Belum ada riwayat kunjungan di warung ini.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-line/60">
            {partnerVisits.slice(0, 5).map((v) => {
              const statusTone =
                v.status === 'paid' ? 'LUNAS' : v.status === 'partial' ? 'SEBAGIAN' : 'BELUM LUNAS'
              const dateStr = new Date(v.visitedAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })

              const totalSold = (v.items || []).reduce((acc, i) => acc + (i.sold || 0), 0)
              const totalRetur = (v.items || []).reduce((acc, i) => acc + (i.returned || 0), 0)
              const totalNewDrop = (v.items || []).reduce((acc, i) => acc + (i.newDrop || 0), 0)

              return (
                <div key={v.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <strong className="text-ink text-sm block">{dateStr}</strong>
                    <p className="text-ink-soft mt-0.5">
                      Laku {totalSold} · retur {totalRetur} · titip {totalNewDrop}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="font-extrabold text-ink block tabular-nums text-sm">
                      {rupiah(v.total)}
                    </span>
                    <StatusBadge status={statusTone} className="mt-1 scale-90 origin-right" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
