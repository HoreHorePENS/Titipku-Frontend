import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { rupiah } from '@/lib/format'
import type { CreatedVisitResult } from '../types'

export interface VisitSuccessCardProps {
  visit: CreatedVisitResult
  onNewVisit: () => void
}

export function VisitSuccessCard({ visit, onNewVisit }: VisitSuccessCardProps) {
  const notaUrl = visit.publicToken ? `/n/${visit.publicToken}` : `/kunjungan`

  const handleOpenWhatsApp = () => {
    if (visit.whatsappUrl) {
      window.open(visit.whatsappUrl, '_blank', 'noopener,noreferrer')
    } else {
      // Fallback pesan wa standar
      const phone = visit.partnerWhatsApp || ''
      const msg = encodeURIComponent(
        `Halo, ini nota titipan ${visit.businessName} nomor ${visit.number}. Total: ${rupiah(
          visit.total
        )}. Terima kasih!`
      )
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="max-w-md mx-auto bg-surface rounded-3xl border border-line p-6 shadow-xs flex flex-col items-center text-center font-sans animate-fadeIn">
      {/* Icon Centang Sukses & Badge Tersimpan */}
      <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center text-display font-bold mb-3">
        ✓
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/10 text-success font-bold text-caption uppercase tracking-wider mb-2">
        <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <span>Tersimpan</span>
      </div>

      <h2 className="text-title-2 text-ink">Kunjungan Berhasil Disimpan</h2>
      <p className="text-caption text-ink-soft mt-1">
        Nomor Nota: <strong className="text-ink">{visit.number}</strong>
      </p>

      {/* Ringkasan Singkat Kartu */}
      <div className="w-full my-5 p-4 rounded-2xl bg-surface-raised border border-line text-left text-caption flex flex-col gap-2">
        <div className="flex justify-between">
          <span className="text-ink-soft">Warung Mitra:</span>
          <strong className="text-ink">{visit.partnerName}</strong>
        </div>

        <div className="flex justify-between">
          <span className="text-ink-soft">Penerima:</span>
          <span className="text-ink font-semibold">{visit.receivedBy}</span>
        </div>

        <div className="pt-2 border-t border-line flex justify-between items-center">
          <span className="text-ink-soft font-bold">Total Tagihan:</span>
          <span className="text-title-3 font-bold text-primary tabular-nums">
            {rupiah(visit.total)}
          </span>
        </div>
      </div>

      {/* Tombol Aksi Utama: Kirim via WhatsApp -> */}
      <div className="w-full flex flex-col gap-2.5">
        <button
          type="button"
          onClick={handleOpenWhatsApp}
          className="w-full h-12 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:brightness-95 text-white font-bold text-body flex items-center justify-center gap-2 shadow-xs transition-all"
        >
          <span>💬</span>
          <span>Kirim via WhatsApp →</span>
        </button>

        <Link to={notaUrl} target="_blank" className="w-full">
          <Button variant="outline-primary" size="lg" fullWidth className="rounded-xl h-11 text-caption font-bold">
            Lihat Nota Digital ↗
          </Button>
        </Link>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line mt-2">
          <Link to="/kunjungan">
            <Button variant="secondary" size="md" fullWidth className="rounded-lg text-caption font-bold h-10">
              Daftar Kunjungan
            </Button>
          </Link>

          <Button
            variant="primary"
            size="md"
            onClick={onNewVisit}
            className="rounded-lg text-caption font-bold h-10 shadow-2xs"
          >
            Kunjungan Baru +
          </Button>
        </div>
      </div>
    </div>
  )
}
