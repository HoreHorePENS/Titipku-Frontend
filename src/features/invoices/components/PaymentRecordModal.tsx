import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/shared/Modal'
import { MoneyInput } from '@/components/ui/MoneyInput'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/toast-store'
import { ApiError } from '@/lib/api-client'
import { rupiah } from '@/lib/format'
import { generateUUID } from '@/lib/uuid'
import { simulateFIFOAllocation } from '../calc'
import { paymentRecordSchema, type PaymentRecordFormData } from '../schema'
import type { Invoice, PaymentPayload, PaymentMethod } from '../types'
import type { Partner } from '@/features/partner/types'

export interface PaymentRecordModalProps {
  isOpen: boolean
  onClose: () => void
  partners: Partner[]
  invoices: Invoice[]
  initialPartnerId?: string
  onSubmit: (payload: PaymentPayload) => Promise<void>
  isLoading?: boolean
}

export function PaymentRecordModal({
  isOpen,
  onClose,
  partners,
  invoices,
  initialPartnerId,
  onSubmit,
  isLoading = false,
}: PaymentRecordModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<PaymentRecordFormData>({
    resolver: zodResolver(paymentRecordSchema),
    defaultValues: {
      partnerId: initialPartnerId || partners[0]?.id || '',
      amount: 0,
      method: 'cash',
      paidAtDate: new Date().toISOString().split('T')[0],
      note: '',
    },
  })

  const partnerId = watch('partnerId')
  const amount = watch('amount')
  const method = watch('method')

  useEffect(() => {
    if (isOpen) {
      const targetPartnerId = initialPartnerId || partners[0]?.id || ''
      reset({
        partnerId: targetPartnerId,
        amount: 0,
        method: 'cash',
        paidAtDate: new Date().toISOString().split('T')[0],
        note: '',
      })
    }
  }, [isOpen, initialPartnerId, partners, reset])

  const selectedPartner = useMemo(() => {
    return partners.find((p) => p.id === partnerId) || partners[0]
  }, [partners, partnerId])

  const partnerUnpaidInvoices = useMemo(() => {
    if (!selectedPartner) return []
    return invoices
      .filter((inv) => inv.partnerId === selectedPartner.id && inv.remaining > 0)
      .sort((a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime())
  }, [invoices, selectedPartner])

  const totalDebt = useMemo(() => {
    return partnerUnpaidInvoices.reduce((sum, inv) => sum + inv.remaining, 0)
  }, [partnerUnpaidInvoices])

  const fifoPreview = useMemo(() => {
    return simulateFIFOAllocation(amount || 0, partnerUnpaidInvoices)
  }, [amount, partnerUnpaidInvoices])

  if (!isOpen) return null

  const onValidSubmit = async (data: PaymentRecordFormData) => {
    if (!data.partnerId) return
    const finalMethod = (data.method || 'cash') as PaymentMethod

    try {
      await onSubmit({
        client_request_id: generateUUID(),
        partner_id: data.partnerId,
        amount: data.amount,
        method: finalMethod,
        note: data.note || undefined,
        paid_at: `${data.paidAtDate}T12:00:00Z`,
      })
      toast.show({
        title: 'Pembayaran Berhasil Dicatat',
        description: `Pelunasan ${rupiah(data.amount)} untuk ${selectedPartner?.name || 'warung'} telah disimpan.`,
        type: 'success',
      })
      onClose()
    } catch (err: unknown) {
      let desc = 'Terjadi kesalahan saat memproses pembayaran. Silakan coba kembali.'
      if (err instanceof ApiError) {
        if (err.status === 400 || err.code === 'PAYMENT_EXCEEDS_RECEIVABLE') {
          desc = `Nominal bayar melebihi total utang warung (${rupiah(totalDebt)}).`
          setError('amount', { type: 'manual', message: 'Nominal melebihi total utang' })
        } else if (err.status === 409) {
          desc = 'Transaksi ini sudah pernah dicatat (duplikat). Periksa riwayat pembayaran.'
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Pembayaran"
      description={
        selectedPartner
          ? `${selectedPartner.name} • utang ${rupiah(totalDebt)} dari ${partnerUnpaidInvoices.length} nota`
          : 'Pilih warung untuk melunasi tagihan'
      }
      maxWidth="lg"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl px-4 min-h-[48px]"
          >
            Batal
          </Button>
          <Button
            type="submit"
            form="payment-record-form"
            variant="primary"
            loading={isLoading}
            disabled={isLoading || (amount || 0) <= 0}
            className="rounded-xl px-5 min-h-[48px] font-bold"
          >
            Simpan Pembayaran
          </Button>
        </>
      }
    >
      <form id="payment-record-form" onSubmit={handleSubmit(onValidSubmit)} className="flex flex-col gap-4">
        {/* 1. Pilih Warung */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-ink">Pilih Warung Mitra</label>
          <select
            {...register('partnerId', {
              onChange: () => setValue('amount', 0, { shouldValidate: true }),
            })}
            className="w-full h-11 px-3 rounded-xl bg-surface border border-line text-xs font-semibold text-ink focus:outline-hidden focus:border-primary shadow-2xs"
          >
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Utang: {rupiah(p.receivable || 0)})
              </option>
            ))}
          </select>
          {errors.partnerId?.message && (
            <p className="text-xs text-danger font-semibold mt-0.5">{errors.partnerId.message}</p>
          )}
        </div>

        {/* 2. Input Nominal Bayar */}
        <div className="flex flex-col gap-2">
          <MoneyInput
            label="Nominal Pembayaran (Rp)"
            value={amount || 0}
            onChange={(val) => setValue('amount', val || 0, { shouldValidate: true })}
            max={totalDebt > 0 ? totalDebt : undefined}
          />

          {errors.amount?.message && (
            <p className="text-xs text-danger font-semibold mt-0.5">{errors.amount.message}</p>
          )}

          {/* Tombol Cepat Lunas */}
          {totalDebt > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-soft">Pilihan cepat:</span>
              <button
                type="button"
                onClick={() => setValue('amount', totalDebt, { shouldValidate: true })}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary-soft text-primary hover:bg-primary-soft/80"
              >
                Bayar Lunas ({rupiah(totalDebt)})
              </button>

              {totalDebt > 50000 && (
                <button
                  type="button"
                  onClick={() => setValue('amount', Math.round(totalDebt / 2), { shouldValidate: true })}
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
                onClick={() => setValue('method', m.id as PaymentMethod, { shouldValidate: true })}
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
            {...register('paidAtDate')}
            className="w-full h-11 px-3 rounded-xl bg-surface border border-line text-xs font-semibold text-ink focus:outline-hidden focus:border-primary shadow-2xs"
          />
          {errors.paidAtDate?.message && (
            <p className="text-xs text-danger font-semibold mt-0.5">{errors.paidAtDate.message}</p>
          )}
        </div>

        {/* 5. Catatan Opsional */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-ink">Catatan (opsional)</label>
          <input
            type="text"
            {...register('note')}
            placeholder="mis. dititipkan lewat anaknya"
            className="w-full h-11 px-3 rounded-xl bg-surface border border-line text-xs font-medium text-ink placeholder:text-ink-soft/70 focus:outline-hidden focus:border-primary shadow-2xs"
          />
        </div>

        {/* 6. Kotak Pratinjau Alokasi FIFO Real-time */}
        <div className="p-3.5 rounded-xl bg-primary-soft/50 border border-primary/30 flex flex-col gap-1 text-xs animate-fadeIn">
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
            PRATINJAU ALOKASI (FIFO)
          </span>
          <p className="font-semibold text-ink leading-relaxed">
            {fifoPreview.summaryText}
          </p>
        </div>
      </form>
    </Modal>
  )
}
