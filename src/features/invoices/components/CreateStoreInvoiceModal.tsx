import { useState, useId, useEffect } from 'react'
import { Modal } from '@/components/shared/Modal'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/toast-store'
import { formatRupiah, formatDateWIB } from '@/lib/format'
import { useQueryClient } from '@tanstack/react-query'
import { createStoreDigitalInvoice } from '../digital-invoices'
import { ProductStockCard } from '@/features/visit/components/ProductStockCard'
import { calculateVisitTotals } from '@/features/visit/calc'
import { useConsignmentRequests, type ConsignmentRequest } from '@/features/stores'
import type { VisitRecord, PaymentStatus, VisitItemInput } from '@/features/visit/types'

export interface CreateStoreInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  initialPenitip?: ConsignmentRequest | null
  storeName?: string
}

type StepState = 'calculate' | 'payment' | 'success'

export function CreateStoreInvoiceModal({
  isOpen,
  onClose,
  initialPenitip = null,
  storeName = 'Warung Mitra',
}: CreateStoreInvoiceModalProps) {
  const queryClient = useQueryClient()
  const { requests } = useConsignmentRequests()

  const partnerSelectId = useId()
  const paymentStatusSelectId = useId()
  const paymentMethodSelectId = useId()
  const notesTextareaId = useId()

  const acceptedRequests = requests.filter((r) => r.status === 'accepted')
  // Nota hanya untuk penitip yang sudah menjadi mitra aktif toko.
  const selectablePenitip = acceptedRequests

  const [step, setStep] = useState<StepState>('calculate')
  const [selectedPenitipId, setSelectedPenitipId] = useState<string>(
    initialPenitip?.id || selectablePenitip[0]?.id || ''
  )

  const activePenitip =
    selectablePenitip.find((p) => p.id === selectedPenitipId) ||
    initialPenitip ||
    selectablePenitip[0]

  // Inisialisasi item produk titipan untuk dihitung stoknya
  const [items, setItems] = useState<VisitItemInput[]>(() => {
    if (!activePenitip) return []
    return activePenitip.items.map((it) => ({
      productId: it.id,
      productName: it.productName,
      consignPrice: it.consignPrice,
      prevStock: it.qty, // Stok yang dititipkan sebelumnya
      remaining: it.qty, // Default utuh (belum laku)
      returned: 0,
      newDrop: 0,
    }))
  })

  // Sinkronisasi saat initialPenitip berubah atau modal dibuka ulang
  useEffect(() => {
    if (initialPenitip) {
      setSelectedPenitipId(initialPenitip.id)
      setItems(
        initialPenitip.items.map((it) => ({
          productId: it.id,
          productName: it.productName,
          consignPrice: it.consignPrice,
          prevStock: it.qty,
          remaining: it.qty,
          returned: 0,
          newDrop: 0,
        }))
      )
      setStep('calculate')
    } else if (selectablePenitip.length > 0 && !selectedPenitipId) {
      const first = selectablePenitip[0]
      setSelectedPenitipId(first.id)
      setItems(
        first.items.map((it) => ({
          productId: it.id,
          productName: it.productName,
          consignPrice: it.consignPrice,
          prevStock: it.qty,
          remaining: it.qty,
          returned: 0,
          newDrop: 0,
        }))
      )
      setStep('calculate')
    }
  }, [initialPenitip, isOpen])

  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'qris'>('cash')
  const [notes, setNotes] = useState('')
  const [createdInvoice, setCreatedInvoice] = useState<VisitRecord | null>(null)

  // Ketika pilihan mitra penitip diganti
  const handleSelectPenitip = (id: string) => {
    setSelectedPenitipId(id)
    const pen = selectablePenitip.find((p) => p.id === id)
    if (pen) {
      setItems(
        pen.items.map((it) => ({
          productId: it.id,
          productName: it.productName,
          consignPrice: it.consignPrice,
          prevStock: it.qty,
          remaining: it.qty,
          returned: 0,
          newDrop: 0,
        }))
      )
    }
  }

  // Update item kalkulasi stok
  const handleUpdateItem = (index: number, updated: VisitItemInput) => {
    setItems((prev) => prev.map((it, idx) => (idx === index ? updated : it)))
  }

  // Hitung total hasil penjualan
  const totals = calculateVisitTotals(items, 0)

  // Selesaikan perhitungan dan terbitkan nota resmi
  const handleGenerateInvoice = () => {
    if (!activePenitip) {
      toast.show({
        title: 'Pilih Penitip',
        description: 'Silakan pilih mitra produsen/penitip terlebih dahulu.',
        type: 'error',
      })
      return
    }

    if (totals.totalSold <= 0) {
      toast.show({
        title: 'Belum Ada Barang Terjual',
        description: 'Kurangi sisa di rak atau masukkan barang terjual minimal 1 unit untuk menerbitkan nota penjualan.',
        type: 'error',
      })
      return
    }

    const newRecord = createStoreDigitalInvoice({
      partnerId: activePenitip.id,
      partnerName: `${activePenitip.producerBusinessName} (${activePenitip.producerOwnerName})`,
      partnerWhatsApp: activePenitip.producerWhatsapp ?? undefined,
      businessName: storeName,
      receivedBy: storeName,
      status: paymentStatus,
      notes: notes.trim()
        ? `${notes.trim()} (Metode: ${paymentMethod.toUpperCase()})`
        : `Metode: ${paymentMethod.toUpperCase()}`,
      items: items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        unitPrice: it.consignPrice,
        sold: Math.max(0, it.prevStock - it.remaining - it.returned),
        returned: it.returned,
        remaining: it.remaining,
      })),
    })

    // Invalidate TanStack query
    queryClient.invalidateQueries({ queryKey: ['visits'] })
    queryClient.invalidateQueries({ queryKey: ['invoices'] })

    setCreatedInvoice(newRecord)
    setStep('success')

    toast.show({
      title: 'Nota Digital Berhasil Diterbitkan',
      description: `Nota ${newRecord.number} untuk ${newRecord.partnerName} telah tersimpan.`,
      type: 'success',
    })
  }

  const handleClose = () => {
    setStep('calculate')
    setCreatedInvoice(null)
    onClose()
  }

  // ─── STEP 3: SUKSES (NOTA DIGITAL TERBIT) ──────────────────────────────────
  if (step === 'success' && createdInvoice) {
    const cleanPhone = (createdInvoice.partnerWhatsApp || '').replace(/\D/g, '')
    const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone
    const itemsSummary = createdInvoice.items
      .map(
        (it) =>
          `• ${it.productName}: ${it.sold} terjual x ${formatRupiah(it.unitPrice)} = ${formatRupiah(
            it.subtotal
          )}`
      )
      .join('%0A')

    const waText = `Halo ${createdInvoice.partnerName},%0AKami dari *${storeName}* telah menerbitkan *Nota Penjualan Konsinyasi Digital*.%0A%0A*No. Nota:* ${
      createdInvoice.number
    }%0A*Tanggal:* ${formatDateWIB(createdInvoice.visitedAt)}%0A*Status Pembayaran:* ${
      createdInvoice.status === 'paid' ? 'LUNAS' : 'BELUM LUNAS / TAGIHAN'
    }%0A%0A*Rincian Penjualan:*%0A${itemsSummary}%0A%0A*Total Bersih:* ${formatRupiah(
      createdInvoice.total
    )}%0A%0ATerima kasih!`
    const waUrl = `https://wa.me/${waPhone}?text=${waText}`

    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Nota Penjualan Berhasil Diterbitkan"
        description="Bukti nota digital resmi telah tercatat di sistem Titipku dan langsung sinkron ke akun penitip."
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-end w-full gap-2">
            <Button variant="outline" size="md" onClick={handleClose} className="rounded-xl min-h-[44px]">
              Tutup
            </Button>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-caption hover:bg-slate-800 transition-all min-h-[44px]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span>Kirim Nota via WhatsApp</span>
            </a>
          </div>
        }
      >
        <div className="flex flex-col gap-4 py-2 font-sans">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-caption text-slate-500">Nomor Nota:</span>
              <span className="text-caption font-mono font-bold text-slate-900">{createdInvoice.number}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-caption text-slate-500">Mitra Penitip:</span>
              <span className="text-caption font-bold text-slate-900">{createdInvoice.partnerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-caption text-slate-500">Status Pembayaran:</span>
              <span
                className={`text-caption font-bold px-2 py-0.5 rounded-full ${
                  createdInvoice.status === 'paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {createdInvoice.status === 'paid' ? 'LUNAS' : 'BELUM LUNAS'}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2 mt-1 flex items-center justify-between">
              <span className="text-caption font-semibold text-slate-700">Total Penjualan:</span>
              <span className="text-title-3 font-bold text-slate-900">{formatRupiah(createdInvoice.total)}</span>
            </div>
          </div>
          <p className="text-caption text-slate-500">
            Penitip dapat melihat bukti nota ini di menu <strong>Bukti Nota</strong> pada akun mereka secara langsung tanpa perlu nota kertas manual.
          </p>
        </div>
      </Modal>
    )
  }

  // ─── STEP 2: KONFIRMASI PEMBAYARAN ─────────────────────────────────────────
  if (step === 'payment') {
    return (
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Konfirmasi Pembayaran Nota"
        description={`Tentukan status pembayaran hasil penjualan untuk ${activePenitip?.producerBusinessName || 'Penitip'}.`}
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={() => setStep('calculate')}
              className="rounded-xl min-h-[44px]"
            >
              ← Kembali Hitung
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleGenerateInvoice}
              className="rounded-xl min-h-[44px] font-semibold"
            >
              Terbitkan Nota ({formatRupiah(totals.todayTotal)})
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 py-2 font-sans">
          {/* Ringkasan Hasil Penjualan */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-caption text-slate-500">Mitra Penitip:</span>
              <span className="text-caption font-bold text-slate-900">
                {activePenitip?.producerBusinessName} ({activePenitip?.producerOwnerName})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-caption text-slate-500">Total Barang Terjual:</span>
              <span className="text-caption font-bold text-slate-900">{totals.totalSold} bungkus / pcs</span>
            </div>
            {totals.totalReturned > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-caption text-slate-500">Total Barang Retur:</span>
                <span className="text-caption font-semibold text-rose-700">{totals.totalReturned} bks</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-2 mt-1 flex items-center justify-between">
              <span className="text-caption font-bold text-slate-700">Total Modal / Tagihan Terjual:</span>
              <span className="text-title-2 font-bold text-slate-900">{formatRupiah(totals.todayTotal)}</span>
            </div>
          </div>

          {/* Pilihan Status Pembayaran */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={paymentStatusSelectId} className="text-caption font-semibold text-slate-700">
              Status Pembayaran ke Penitip
            </label>
            <select
              id={paymentStatusSelectId}
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
              className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-caption font-semibold text-slate-900 focus:outline-none focus:border-slate-900"
            >
              <option value="paid">Lunas (Langsung Dibayarkan Hari Ini)</option>
              <option value="unpaid">Belum Lunas (Dicatat Sebagai Tagihan / Piutang Penitip)</option>
            </select>
          </div>

          {paymentStatus === 'paid' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={paymentMethodSelectId} className="text-caption font-semibold text-slate-700">
                Metode Pembayaran
              </label>
              <select
                id={paymentMethodSelectId}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'transfer' | 'qris')}
                className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-caption font-semibold text-slate-900 focus:outline-none focus:border-slate-900"
              >
                <option value="cash">Tunai (Cash)</option>
                <option value="transfer">Transfer Bank</option>
                <option value="qris">QRIS</option>
              </select>
            </div>
          )}

          {/* Catatan Tambahan */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={notesTextareaId} className="text-caption font-semibold text-slate-700">
              Catatan Tambahan (Opsional)
            </label>
            <textarea
              id={notesTextareaId}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Penjualan laku lancar selama akhir pekan."
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-caption text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 resize-none"
            />
          </div>
        </div>
      </Modal>
    )
  }

  // ─── STEP 1: HITUNG STOK FISIK & PENJUALAN (CARD DENGAN STEPPER DARI GAMBAR USER) ──
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Hitung Penjualan & Buat Nota Digital"
      description="Hitung sisa produk di rak warung, barang retur, dan stok baru untuk menentukan total barang konsinyasi yang terjual."
      maxWidth="2xl"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
          <div className="text-caption text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              Terjual: <strong className="text-slate-900">{totals.totalSold} bks</strong>
            </span>
            <span>•</span>
            <span>
              Total: <strong className="text-slate-900 font-bold">{formatRupiah(totals.todayTotal)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button variant="outline" size="md" onClick={handleClose} className="rounded-xl min-h-[44px] shrink-0">
              Batal
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={totals.hasInvalidItems || totals.totalSold <= 0}
              onClick={() => setStep('payment')}
              className="rounded-xl min-h-[44px] font-semibold flex-1 sm:flex-none min-w-0"
            >
              <span className="truncate">
                Lanjut ke pembayaran<span className="hidden sm:inline"> ({formatRupiah(totals.todayTotal)})</span>
              </span>
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4 py-2 font-sans">
        {/* Pilihan Mitra Penitip jika belum dipilih khusus */}
        {selectablePenitip.length > 1 && !initialPenitip && (
          <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-200">
            <label htmlFor={partnerSelectId} className="text-caption font-semibold text-slate-700">
              Pilih Mitra Produsen / Penitip:
            </label>
            <select
              id={partnerSelectId}
              value={selectedPenitipId}
              onChange={(e) => handleSelectPenitip(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-caption font-semibold text-slate-900 focus:outline-none focus:border-slate-900"
            >
              {selectablePenitip.map((pen) => (
                <option key={pen.id} value={pen.id}>
                  {pen.producerBusinessName} ({pen.producerOwnerName}) — {pen.producerAddress || 'Alamat belum diisi'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Info Singkat Penitip yang Sedang Dihitung */}
        {activePenitip && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-caption">
            <div className="flex flex-wrap items-center gap-x-2 min-w-0">
              <span className="font-bold text-slate-900">{activePenitip.producerBusinessName}</span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600">{activePenitip.producerOwnerName}</span>
            </div>
            <span className="text-slate-500 font-medium">{activePenitip.producerAddress || 'Alamat belum diisi'}</span>
          </div>
        )}

        {/* Daftar Kartu Produk (ProductStockCard dengan Stepper Sisa di Rak, Retur, Titip Baru) */}
        <div className="flex flex-col gap-3">
          {items.length === 0 ? (
            <div className="p-6 text-center text-caption text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
              Tidak ada produk yang terdaftar untuk mitra penitip ini.
            </div>
          ) : (
            items.map((item, idx) => (
              <ProductStockCard
                key={item.productId}
                item={item}
                onChange={(updated) => handleUpdateItem(idx, updated)}
              />
            ))
          )}
        </div>
      </div>
    </Modal>
  )
}
