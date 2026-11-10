import { useEffect, useMemo } from 'react'
import { useProposals, type Proposal } from '../proposals-api'
import { formatRequestDate } from '../consignment-requests'
import { outgoingRequests } from '../outgoing-requests'

const STATUS_STYLE: Record<Proposal['status'], { label: string; className: string }> = {
  pending: { label: 'Menunggu jawaban', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  accepted: { label: 'Disetujui', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  rejected: { label: 'Ditolak', className: 'bg-rose-50 text-rose-800 border-rose-200' },
  cancelled: { label: 'Dibatalkan', className: 'bg-slate-100 text-slate-600 border-slate-200' },
}

export interface OutgoingRequestsSectionProps {
  /** Pengajuan yang disorot & digulir ke tampilan (dari notifikasi). */
  focusId?: string | null
}

export function OutgoingRequestsSection({ focusId }: OutgoingRequestsSectionProps) {
  const query = useProposals()
  const requests = useMemo(() => outgoingRequests(query.data ?? []), [query.data])

  // Gulir ke pengajuan yang dibuka dari notifikasi (sinkronisasi DOM, bukan state).
  useEffect(() => {
    if (!focusId || requests.length === 0) return
    document.getElementById(`pengajuan-${focusId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [focusId, requests.length])

  if (query.isLoading || (requests.length === 0 && !focusId)) return null

  return (
    <section id="pengajuan-saya" className="flex flex-col gap-3 scroll-mt-24" aria-labelledby="pengajuan-saya-title">
      <div>
        <h2 id="pengajuan-saya-title" className="text-title-3 text-ink">Pengajuan Titip Saya</h2>
        <p className="text-caption text-ink-soft mt-0.5">Status pengajuan titip-jual yang kamu kirim ke toko.</p>
      </div>

      {query.isError ? (
        <div className="p-4 rounded-2xl bg-slate-50 border border-line text-caption text-ink-soft">
          Daftar pengajuan belum bisa dimuat. Coba lagi sebentar lagi.
        </div>
      ) : requests.length === 0 ? (
        <div className="p-4 rounded-2xl bg-slate-50 border border-line text-caption text-ink-soft">
          Pengajuan ini sudah tidak tersedia.
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {requests.map((req) => {
            const status = STATUS_STYLE[req.status]
            const isFocused = req.id === focusId
            return (
              <li
                key={req.id}
                id={`pengajuan-${req.id}`}
                aria-current={isFocused ? 'true' : undefined}
                className={`p-4 rounded-2xl bg-surface border shadow-2xs flex flex-col gap-2 transition-shadow ${
                  isFocused ? 'border-ink ring-2 ring-ink/15' : 'border-line'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-label text-ink truncate">{req.store.name}</p>
                    <p className="text-caption text-ink-soft">
                      {req.store.address} · Dikirim {formatRequestDate(req.createdAt)}
                      {req.respondedAt ? ` · Dijawab ${formatRequestDate(req.respondedAt)}` : ''}
                    </p>
                  </div>
                  <span className={`text-caption font-bold px-2 py-0.5 rounded-full border shrink-0 ${status.className}`}>
                    {status.label}
                  </span>
                </div>
                {req.items.length > 0 && (
                  <p className="text-caption text-ink-soft">
                    {req.items.map((it) => `${it.name} (${it.qty})`).join(', ')}
                  </p>
                )}
                {req.message && <p className="text-caption text-ink italic">"{req.message}"</p>}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
