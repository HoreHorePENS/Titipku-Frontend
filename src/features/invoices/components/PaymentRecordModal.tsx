import { useState, useMemo, useEffect } from 'react'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { ApiError } from '@/lib/api-client'
import { rupiah } from '@/lib/format'
import { generateUUID } from '@/lib/uuid'
import { simulateFIFOAllocation } from '../calc'
import type { Invoice, PaymentPayload, PaymentMethod } from '../types'
import type { Partner } from '@/features/partner/types'

export interface PaymentRecordModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: PaymentPayload) => Promise<void>
  invoices: Invoice[]
  partners: Partner[]
  initialPartnerId?: string
  isLoading?: boolean
}

export function PaymentRecordModal({
  isOpen,
  onClose,
  onSubmit,
  invoices,
  partners,
  initialPartnerId = '',
  isLoading = false,
}: PaymentRecordModalProps) {
  const [partnerId, setPartnerId] = useState(initialPartnerId)
  const [amount, setAmount] = useState(0)
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [paidAtDate, setPaidAtDate] = useState(() => new Date().toISOString().split('T')[0])
  const [note, setNote] = useState('')
  const [clientRequestId] = useState(() => generateUUID())

  useEffect(() => {
    if (initialPartnerId) {
      setPartnerId(initialPartnerId)
    } else if (partners.length > 0 && !partnerId) {
      setPartnerId(partners[0].id)
    }
  }, [initialPartnerId, partners, partnerId])

  // Warung yang dipilih
  const selectedPartner = useMemo(() => {
    return partners.find((p) => p.id === partnerId)
  }, [partners, partnerId])

  // Nota-nota belum lunas milik warung ini
  const partnerUnpaidInvoices = useMemo(() => {
    if (!partnerId) return []
    return invoices.filter(
      (inv) => inv.partnerId === partnerId && inv.status !== 'paid' && inv.remaining > 0
    )
  }, [invoices, partnerId])

  const totalDebt = useMemo(() => {
    return partnerUnpaidInvoices.reduce((sum, inv) => sum + inv.remaining, 0)
  }, [partnerUnpaidInvoices])

  // Simulasi FIFO real-time
  const fifoPreview = useMemo(() => {
    return simulateFIFOAllocation(amount, partnerUnpaidInvoices)
  }, [amount, partnerUnpaidInvoices])

  const isOverDebt = totalDebt > 0 && amount > totalDebt

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!partnerId || amount <= 0) return
    if (isOverDebt) {
      toast.show({
        title: 'Nominal Melebihi Piutang',
        description: `Nominal pembayaran (${rupiah(amount)}) tidak boleh melebihi total utang (${rupiah(totalDebt)}).`,
        type: 'error',
      })
      return
    }

    try {
      const payload: PaymentPayload = {
        client_request_id: clientRequestId,
        partner_id: partnerId,
        amount,
        method,
        paid_at: paidAtDate ? new Date(paidAtDate).toISOString() : new Date().toISOString(),
        note: note.trim() || undefined,
      }
      await onSubmit(payload)
      toast.show({
        title: 'Pembayaran Dicatat',
        description: `Pembayaran ${rupiah(amount)} berhasil dialokasikan.`,
        type: 'success',
      })
      onClose()
    } catch (err: unknown) {
      let desc = 'Terjadi kendala saat mencatat pembayaran. Silakan coba kembali.'
      if (err instanceof ApiError) {
        if (err.status === 409 || err.code === 'PAYMENT_EXCEEDS_RECEIVABLE') {
          desc = 'Nominal pembayaran melebihi sisa piutang warung pada sistem server.'
        } else if (err.code === 'VALIDATION_ERROR') {
          desc = 'Periksa kembali data pembayaran yang dimasukkan.'
        } else if (err.message) {
          desc = err.message
        }
      } else if (
        err instanceof TypeError ||
        (err instanceof Error &&
          (err.message.includes('fetch') ||
            err.message.includes('network') ||
            err.message.includes('Failed to fetch')))
      ) {
        desc = 'Koneksi internet terputus. Periksa jaringan Anda dan coba lagi.'
      }
      toast.show({
        title: 'Gagal Mencatat Pembayaran',
        description: desc,
        type: 'error',
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-fadeIn font-sans">
      <div
        className="relative w-full max-w-lg bg-surface rounded-2xl border border-line shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
      >
        {/* Header Modal */}
        <div className="p-5 border-b border-line flex items-center justify-between bg-surface">
          <div>
            <h2 id="payment-modal-title" className="text-lg font-extrabold text-ink">
              Catat Pembayaran
            </h2>
            <p className="text-xs text-ink-soft mt-0.5">
              {selectedPartner
                ? `${selectedPartner.name} · utang ${rupiah(totalDebt)} dari ${partnerUnpaidInvoices.length} nota`
                : 'Pilih warung untuk melunasi tagihan'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-soft hover:bg-surface-raised hover:text-ink transition-colors"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex flex-col gap-4">
          {/* 1. Pilih Warung */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink">Pilih Warung Mitra</label>
            <select
              value={partnerId}
              onChange={(e) => {
                setPartnerId(e.target.value)
                setAmount(0)
              }}
              className="w-full h-11 px-3 rounded-xl bg-surface border border-line text-xs font-semibold text-ink focus:outline-none focus:border-primary shadow-2xs"
            >
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Utang: {rupiah(p.receivable || 0)})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Input Nominal Bayar */}
          <div className="flex flex-col gap-2">
            <MoneyInput
              label="Nominal Pembayaran (Rp)"
              value={amount}
              onChange={(val) => setAmount(val || 0)}
              max={totalDebt > 0 ? totalDebt : undefined}
            />

            {isOverDebt && (
              <p className="text-xs text-danger font-semibold mt-0.5">
                Nominal pembayaran ({rupiah(amount)}) melebihi total utang ({rupiah(totalDebt)}).
              </p>
            )}

            {/* Quick chips nominal */}
            {totalDebt > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setAmount(totalDebt)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    amount === totalDebt
                      ? 'bg-primary text-white shadow-2xs'
                      : 'bg-surface-raised border border-line text-ink hover:border-primary'
                  }`}
                >
                  Bayar Penuh ({rupiah(totalDebt)})
                </button>

                {totalDebt > 50000 && (
                  <button
                    type="button"
                    onClick={() => setAmount(Math.round(totalDebt / 2))}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-raised border border-line text-ink-soft hover:text-ink"
                  >
                    50% ({rupiah(Math.round(totalDebt / 2))})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 3. Metode Pembayaran */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink">Metode Pembayaran</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: '💵 Tunai' },
                { id: 'transfer', label: '🏦 Transfer' },
                { id: 'qris', label: '📱 QRIS' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id as PaymentMethod)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                    method === m.id
                      ? 'border-primary bg-primary text-white shadow-xs'
                      : 'border-line bg-surface text-ink hover:border-line-strong'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Tanggal Pembayaran */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink">Tanggal Pembayaran</label>
            <input
              type="date"
              value={paidAtDate}
              onChange={(e) => setPaidAtDate(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-surface border border-line text-xs font-semibold text-ink focus:outline-none focus:border-primary shadow-2xs"
            />
          </div>

          {/* 5. Catatan Opsional */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-ink">Catatan (opsional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="mis. dititipkan lewat anaknya"
              className="w-full h-11 px-3 rounded-xl bg-surface border border-line text-xs font-medium text-ink placeholder:text-ink-soft/70 focus:outline-none focus:border-primary shadow-2xs"
            />
          </div>

          {/* 6. Kotak Pratinjau Alokasi FIFO Real-time (Sesuai Mockup Slide 5) */}
          <div className="p-3.5 rounded-xl bg-primary-soft/50 border border-primary/30 flex flex-col gap-1 text-xs animate-fadeIn">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              PRATINJAU ALOKASI (FIFO)
            </span>
            <p className="font-semibold text-ink leading-relaxed">
              {fifoPreview.summaryText}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-line mt-1">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 rounded-xl h-11 text-xs font-bold"
            >
              Batal
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isLoading || amount <= 0 || !partnerId || isOverDebt}
              className="flex-1 rounded-xl h-11 text-xs font-bold shadow-xs"
            >
              {isLoading ? 'Menyimpan…' : 'Simpan Pembayaran'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
