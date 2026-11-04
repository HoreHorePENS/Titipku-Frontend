import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { ApiError } from '@/lib/api-client'
import { ProductStockCard } from '@/features/visit/components/ProductStockCard'
import { VisitSummaryStep, type PaymentChoice } from '@/features/visit/components/VisitSummaryStep'
import { VisitSuccessCard } from '@/features/visit/components/VisitSuccessCard'
import { usePartnerOptions, useProducts, useVisits, useCreateVisit } from '@/features/visit/api'
import { calculateVisitTotals } from '@/features/visit/calc'
import { rupiah } from '@/lib/format'
import { generateUUID } from '@/lib/uuid'
import type { VisitItemInput, CreatedVisitResult, PaymentMethod } from '@/features/visit/types'

type StepState = 'input_stock' | 'summary_payment' | 'success'

export default function VisitNewRoute() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialPartnerId = searchParams.get('partnerId') || searchParams.get('warung_id') || ''

  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(initialPartnerId)
  const [currentStep, setCurrentStep] = useState<StepState>('input_stock')
  const [receivedBy, setReceivedBy] = useState<string>('')
  const [createdVisit, setCreatedVisit] = useState<CreatedVisitResult | null>(null)
  const [clientRequestId] = useState<string>(() => generateUUID())

  // Ambil daftar mitra & produk dari backend
  const { data: partnerOptions = [], isLoading: isPartnersLoading } = usePartnerOptions()
  const { data: products = [], isLoading: isProductsLoading } = useProducts()
  const { data: partnerVisits = [] } = useVisits(selectedPartnerId)

  const createVisitMutation = useCreateVisit()

  // Ambil detail warung yang sedang aktif
  const selectedPartner = useMemo(() => {
    return partnerOptions.find((p) => p.id === selectedPartnerId)
  }, [partnerOptions, selectedPartnerId])

  // Petakan stok terakhir (stock_after) per produk di warung ini
  const prevStockMap = useMemo(() => {
    const map = new Map<string, number>()
    // Urutkan kunjungan warung dari terbaru
    const sorted = [...partnerVisits].sort(
      (a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime()
    )
    if (sorted.length > 0) {
      const latest = sorted[0]
      for (const it of latest.items || []) {
        map.set(it.productId, it.stockAfter ?? 0)
      }
    }
    return map
  }, [partnerVisits])

  // Inisialisasi item input berdasarkan produk aktif
  const [customItems, setCustomItems] = useState<VisitItemInput[] | null>(null)

  const items = useMemo(() => {
    if (customItems !== null) return customItems
    if (products.length === 0) return []
    return products.map((prod) => {
      const prevStock = prevStockMap.get(prod.id) ?? 0
      return {
        productId: prod.id,
        productName: prod.name,
        consignPrice: prod.consignPrice,
        prevStock,
        remaining: prevStock,
        returned: 0,
        newDrop: 0,
      }
    })
  }, [customItems, products, prevStockMap])

  // Diterima oleh default ke kontak warung
  const effectiveReceivedBy =
    receivedBy !== ''
      ? receivedBy
      : selectedPartner
      ? selectedPartner.ownerName || selectedPartner.name
      : ''

  const handleUpdateItem = (index: number, updated: VisitItemInput) => {
    const next = [...items]
    next[index] = updated
    setCustomItems(next)
  }

  // Akumulasi total
  const totals = useMemo(() => {
    return calculateVisitTotals(items, selectedPartner?.receivable || 0)
  }, [items, selectedPartner])

  // Reset form untuk kunjungan baru berikutnya
  const handleResetForNew = () => {
    setSelectedPartnerId('')
    setCurrentStep('input_stock')
    setCreatedVisit(null)
    setCustomItems(null)
    setReceivedBy('')
    navigate('/kunjungan/baru')
  }

  // Handle submit final ke backend
  const handleSubmitVisit = async (paymentData: {
    status: PaymentChoice
    amount: number
    method: PaymentMethod
  }) => {
    if (!selectedPartnerId) return

    try {
      const payloadItems = items.map((it) => ({
        product_id: it.productId,
        remaining: it.remaining,
        returned: it.returned,
        new_drop: it.newDrop,
      }))

      const payload = {
        client_request_id: clientRequestId,
        partner_id: selectedPartnerId,
        received_by: effectiveReceivedBy.trim() || selectedPartner?.ownerName || selectedPartner?.name,
        items: payloadItems,
        payment:
          paymentData.amount > 0
            ? {
                client_request_id: generateUUID(),
                amount: paymentData.amount,
                method: paymentData.method,
              }
            : undefined,
      }

      const res = await createVisitMutation.mutateAsync(payload)
      setCreatedVisit(res)
      setCurrentStep('success')
    } catch (err: unknown) {
      let title = 'Gagal Menyimpan Kunjungan'
      let desc = 'Terjadi kendala saat menyimpan kunjungan. Silakan coba kembali.'

      if (err instanceof ApiError) {
        if (err.status === 409 && (err.code === 'STOCK_MISMATCH' || err.message?.includes('stock'))) {
          desc = 'Perhitungan stok fisik tidak sesuai dengan catatan batch stok di server.'
        } else if (err.code === 'IDEMPOTENCY_MISMATCH') {
          desc = 'ID transaksi sudah digunakan dengan rincian berbeda.'
        } else if (err.code === 'VALIDATION_ERROR') {
          desc = 'Periksa kembali kelengkapan jumlah stok dan penerima kunjungan.'
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
        title = 'Koneksi Terputus'
        desc = 'Koneksi internet terputus. Data kunjungan Anda tetap aman di formulir.'
      }

      toast.show({
        title,
        description: desc,
        type: 'error',
      })
    }
  }

  // 1. Jika belum memilih warung mitra: Tampilkan pemilihan warung
  if (!selectedPartnerId || !selectedPartner) {
    const availablePartners = partnerOptions.filter((p) => p.id !== 'all')

    return (
      <div className="px-4 py-5 md:px-8 md:py-8 max-w-2xl mx-auto flex flex-col gap-5 font-sans">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-ink tracking-tight">Pilih Warung Mitra</h1>
          <Button variant="secondary" size="sm" onClick={() => navigate('/kunjungan')} className="text-xs font-bold">
            Batal
          </Button>
        </div>

        <p className="text-caption text-ink-soft -mt-2">
          Pilih warung mitra yang Anda kunjungi untuk mencatat sisa stok dan titip baru.
        </p>

        {isPartnersLoading ? (
          <div className="py-12 text-center text-caption text-ink-soft">Memuat daftar warung…</div>
        ) : availablePartners.length === 0 ? (
          <div className="py-12 text-center text-caption text-ink-soft">
            Belum ada mitra warung yang terdaftar.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {availablePartners.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedPartnerId(p.id)
                  setCustomItems(null)
                  setReceivedBy(p.ownerName || p.name)
                }}
                className="p-4 rounded-2xl bg-surface border border-line hover:border-primary/80 transition-all text-left flex items-center justify-between shadow-2xs group active:scale-[0.99]"
              >
                <div>
                  <h2 className="text-base font-bold text-ink group-hover:text-primary transition-colors">
                    {p.name}
                  </h2>
                  <p className="text-xs text-ink-soft mt-0.5">
                    {p.ownerName ? `Pemilik: ${p.ownerName}` : ''}{' '}
                    {p.area ? `· ${p.area}` : ''}
                  </p>
                </div>

                <div className="text-right">
                  {p.receivable && p.receivable > 0 ? (
                    <span className="text-xs font-bold text-danger block tabular-nums">
                      Piutang: {rupiah(p.receivable)}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-success block">Lunas</span>
                  )}
                  <span className="text-xs text-primary font-bold mt-1 inline-block">Pilih →</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // 2. Jika sukses tersimpan: Tampilkan layar sukses
  if (currentStep === 'success' && createdVisit) {
    return (
      <div className="px-4 py-8 max-w-lg mx-auto">
        <VisitSuccessCard visit={createdVisit} onNewVisit={handleResetForNew} />
      </div>
    )
  }

  // 3. Tampilan Step Ringkasan & Pembayaran
  if (currentStep === 'summary_payment') {
    return (
      <div className="px-4 py-5 md:px-8 md:py-8 max-w-3xl mx-auto flex flex-col gap-5 font-sans">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Langkah 2 dari 2</span>
            <h1 className="text-2xl font-extrabold text-ink tracking-tight mt-0.5">
              Ringkasan & Pembayaran
            </h1>
          </div>
        </div>

        <VisitSummaryStep
          partner={selectedPartner}
          totals={totals}
          receivedBy={effectiveReceivedBy}
          onReceivedByChange={setReceivedBy}
          onBack={() => setCurrentStep('input_stock')}
          onSubmit={handleSubmitVisit}
          isSubmitting={createVisitMutation.isPending}
        />
      </div>
    )
  }

  // 4. Tampilan Step 1: Input Stepper Stok per Produk
  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-3xl mx-auto flex flex-col gap-5 font-sans pb-6">
      {/* Header Warung Terpilih */}
      <div className="flex items-start justify-between gap-3 bg-surface rounded-2xl border border-line p-4 md:p-5 shadow-2xs">
        <div>
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Langkah 1 dari 2</span>
          <h1 className="text-xl md:text-2xl font-extrabold text-ink tracking-tight mt-0.5">
            {selectedPartner.name}
          </h1>
          <p className="text-xs text-ink-soft mt-0.5">
            {selectedPartner.ownerName ? `Penjaga: ${selectedPartner.ownerName}` : ''}{' '}
            {selectedPartner.area ? `· ${selectedPartner.area}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedPartner.receivable && selectedPartner.receivable > 0 ? (
            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-ink-soft block font-medium">Piutang Lama</span>
              <span className="text-xs font-bold text-danger tabular-nums">
                {rupiah(selectedPartner.receivable)}
              </span>
            </div>
          ) : null}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSelectedPartnerId('')
              setCustomItems(null)
            }}
            className="rounded-lg text-xs font-semibold h-8"
          >
            Ganti Warung
          </Button>
        </div>
      </div>

      {/* Daftar Kartu Produk */}
      {isProductsLoading ? (
        <div className="py-12 text-center text-caption text-ink-soft">Memuat katalog produk…</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-caption text-ink-soft">
          Tidak ada produk aktif dalam katalog bisnis Anda.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item, idx) => (
            <ProductStockCard
              key={item.productId}
              item={item}
              onChange={(updated) => handleUpdateItem(idx, updated)}
            />
          ))}
        </div>
      )}

      {/* Spacer pas (~100px) agar kartu terbawah pas di atas bottom bar tanpa celah berlebihan */}
      <div className="h-24 md:h-28 shrink-0 pointer-events-none" aria-hidden="true" />

      {/* Sticky Bottom Bar Navigasi Lanjut (Mobile-First Thumb-Zone, Menghindari Tab/Sidebar Desktop) */}
      <div className="fixed bottom-0 left-0 md:left-[84px] right-0 p-4 bg-surface/95 backdrop-blur-md border-t border-line shadow-lg z-40">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-ink-soft block font-medium">Estimasi Terjual:</span>
            <div className="flex items-center gap-2">
              <span className="text-lg md:text-xl font-extrabold text-ink tabular-nums">
                {rupiah(totals.todayTotal)}
              </span>
              <span className="text-xs text-ink-soft">({totals.totalSold} bks)</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={() => setCurrentStep('summary_payment')}
            disabled={totals.hasInvalidItems}
            className="rounded-xl px-6 h-12 text-sm font-bold shadow-xs flex items-center gap-1.5"
          >
            <span>Lanjut Pembayaran</span>
            <span>→</span>
          </Button>
        </div>

        {totals.hasInvalidItems && (
          <div className="max-w-3xl mx-auto mt-2 text-center text-danger text-xs font-semibold animate-fadeIn">
            ⚠ Perbaiki kartu produk yang melebihi stok kemarin sebelum melanjutkan.
          </div>
        )}
      </div>
    </div>
  )
}
