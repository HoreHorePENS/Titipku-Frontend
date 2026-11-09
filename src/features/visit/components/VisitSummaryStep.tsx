import { useState } from 'react'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { rupiah } from '@/lib/format'
import type { PartnerOption, PaymentMethod } from '../types'
import type { VisitTotalsResult } from '../calc'

export type PaymentChoice = 'lunas' | 'sebagian' | 'belum_bayar'

export interface VisitSummaryStepProps {
  partner: PartnerOption
  totals: VisitTotalsResult
  receivedBy: string
  onReceivedByChange: (val: string) => void
  onBack: () => void
  onSubmit: (paymentData: {
    status: PaymentChoice
    amount: number
    method: PaymentMethod
  }) => void
  isSubmitting: boolean
}

export function VisitSummaryStep({
  partner,
  totals,
  receivedBy,
  onReceivedByChange,
  onBack,
  onSubmit,
  isSubmitting,
}: VisitSummaryStepProps) {
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>('lunas')
  const [partialAmount, setPartialAmount] = useState<number>(Math.round(totals.todayTotal / 2))
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')

  const effectiveAmount =
    paymentChoice === 'lunas'
      ? totals.todayTotal
      : paymentChoice === 'sebagian'
      ? Math.max(0, Math.min(partialAmount, totals.todayTotal))
      : 0

  const remainingBill = Math.max(0, totals.todayTotal - effectiveAmount)

  const handleConfirm = () => {
    onSubmit({
      status: paymentChoice,
      amount: effectiveAmount,
      method: paymentMethod,
    })
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto font-sans pb-10">
      {/* 1. Header Ringkasan Tagihan */}
      <div className="bg-surface rounded-2xl border border-line p-5 shadow-2xs">
        <h2 className="text-title-3 text-ink mb-1">Ringkasan Tagihan</h2>
        <p className="text-caption text-ink-soft">
          Warung: <strong className="text-ink">{partner.name}</strong> ({partner.ownerName || 'Mitra'})
        </p>

        <div className="mt-4 pt-4 border-t border-line flex flex-col gap-2.5 text-body">
          <div className="flex items-center justify-between text-ink">
            <span>Barang terjual hari ini ({totals.totalSold} bks)</span>
            <span className="font-bold tabular-nums">{rupiah(totals.todayTotal)}</span>
          </div>

          {totals.oldDebt > 0 && (
            <div className="flex items-center justify-between text-danger">
              <span>Saldo piutang lama</span>
              <span className="font-bold tabular-nums">+{rupiah(totals.oldDebt)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-line/60 flex items-center justify-between font-bold text-title-3 text-ink">
            <span>Total Kewajiban</span>
            <span className="text-title-2 tabular-nums text-primary">{rupiah(totals.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* 2. Pilihan Status Pembayaran */}
      {totals.todayTotal > 0 ? (
        <div className="bg-surface rounded-2xl border border-line p-5 shadow-2xs flex flex-col gap-4">
          <div>
            <h3 className="text-title-3 text-ink">Pilihan Pembayaran Hari Ini</h3>
            <p className="text-caption text-ink-soft mt-0.5">
              Pilih jumlah uang yang diserahkan oleh warung mitra
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* Opsi Lunas */}
            <button
              type="button"
              onClick={() => setPaymentChoice('lunas')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[72px] ${
                paymentChoice === 'lunas'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-line bg-surface hover:border-line-strong'
              }`}
            >
              <span className="text-caption font-bold text-ink">Lunas</span>
              <span className="text-body font-bold text-primary tabular-nums">
                {rupiah(totals.todayTotal)}
              </span>
            </button>

            {/* Opsi Sebagian */}
            <button
              type="button"
              onClick={() => setPaymentChoice('sebagian')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[72px] ${
                paymentChoice === 'sebagian'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'border-line bg-surface hover:border-line-strong'
              }`}
            >
              <span className="text-caption font-bold text-ink">Sebagian</span>
              <span className="text-caption font-medium text-ink-soft">Cicil / DP</span>
            </button>

            {/* Opsi Belum Bayar */}
            <button
              type="button"
              onClick={() => setPaymentChoice('belum_bayar')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[72px] ${
                paymentChoice === 'belum_bayar'
                  ? 'border-danger bg-danger/5 ring-2 ring-danger/20'
                  : 'border-line bg-surface hover:border-line-strong'
              }`}
            >
              <span className="text-caption font-bold text-ink">Belum Bayar</span>
              <span className="text-caption text-danger font-semibold">Rp0</span>
            </button>
          </div>

          {/* Input Nominal Pembayaran Sebagian */}
          {paymentChoice === 'sebagian' && (
            <div className="p-4 rounded-xl bg-surface-raised border border-line flex flex-col gap-3 animate-fadeIn">
              <MoneyInput
                label="Nominal yang Diserahkan (Rp)"
                value={partialAmount}
                onChange={(val) => setPartialAmount(val || 0)}
                max={totals.todayTotal}
              />

              <div className="text-caption flex items-center justify-between text-ink-soft">
                <span>Sisa piutang baru:</span>
                <span className="font-bold text-danger tabular-nums">{rupiah(remainingBill)}</span>
              </div>
            </div>
          )}

          {/* Pilihan Metode Bayar (Muncul jika ada uang diserahkan) */}
          {paymentChoice !== 'belum_bayar' && (
            <div className="pt-2">
              <label className="text-caption font-bold text-ink block mb-2">Metode Pembayaran</label>
              <div className="flex gap-2">
                {[
                  { id: 'cash', label: '💵 Tunai' },
                  { id: 'transfer', label: '🏦 Transfer' },
                  { id: 'qris', label: '📱 QRIS' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                    className={`flex-1 py-2 px-3 rounded-lg border text-caption font-bold transition-all ${
                      paymentMethod === m.id
                        ? 'border-primary bg-primary text-white shadow-xs'
                        : 'border-line bg-surface text-ink hover:border-line-strong'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-accent/10 border border-accent/30 text-accent text-caption font-semibold">
          Kunjungan ini tidak memiliki penjualan (titip stok awal). Bagian pembayaran dinonaktifkan secara otomatis.
        </div>
      )}

      {/* 3. Diterima Oleh (Sesuai FLOW.MD: Terisi Otomatis) */}
      <div className="bg-surface rounded-2xl border border-line p-5 shadow-2xs">
        <Input
          label="Diterima oleh (Nama Penjaga/Pemilik Warung)"
          value={receivedBy}
          onChange={(e) => onReceivedByChange(e.target.value)}
          placeholder="Nama penerima barang..."
          hint="Terisi otomatis dari data kontak warung, ubah bila diterima orang lain"
          className="text-body font-semibold"
        />
      </div>

      {/* 4. Tombol Aksi Simpan */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 rounded-xl h-12 text-body font-bold"
        >
          ← Ubah Stok
        </Button>

        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={handleConfirm}
          disabled={isSubmitting || !receivedBy.trim()}
          className="flex-1 rounded-xl h-12 text-body font-bold shadow-xs flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <span>Menyimpan Kunjungan…</span>
          ) : (
            <span>Simpan Kunjungan ✓</span>
          )}
        </Button>
      </div>
    </div>
  )
}
