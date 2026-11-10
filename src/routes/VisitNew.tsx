import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/Button'
import { PageContainer, PageHeader } from '@/components/shared'
import { toast } from '@/components/ui/toast-store'
import { ApiError } from '@/lib/api-client'
import { describeApiError } from '@/lib/api-errors'
import { stockToVisitItems, usePartnerStock } from '@/features/partner/stock-api'
import { ProductStockCard } from '@/features/visit/components/ProductStockCard'
import { VisitSummaryStep, type PaymentChoice } from '@/features/visit/components/VisitSummaryStep'
import { VisitSuccessCard } from '@/features/visit/components/VisitSuccessCard'
import { usePartnerOptions, useCreateVisit } from '@/features/visit/api'
import { calculateVisitTotals } from '@/features/visit/calc'
import { rupiah, formatJamWIB } from '@/lib/format'
import { generateUUID } from '@/lib/uuid'
import { useVisitDraft } from '@/features/visit/useVisitDraft'
import { visitFormSchema, type VisitFormData } from '@/features/visit/schema'
import type { VisitItemInput, CreatedVisitResult, PaymentMethod } from '@/features/visit/types'

type StepState = 'input_stock' | 'summary_payment' | 'success'

const VISIT_ERROR_MESSAGES: Record<string, string> = {
  STOCK_MISMATCH: 'Stok di rak sudah berubah sejak halaman dibuka. Stok terbaru sudah dimuat ulang, periksa lagi isianmu.',
  IDEMPOTENCY_MISMATCH: 'Kunjungan ini sudah pernah dikirim dengan isi berbeda. Coba simpan sekali lagi.',
  PARTNER_NOT_FOUND: 'Toko mitra ini tidak ditemukan atau sudah tidak aktif.',
  PRODUCT_NOT_FOUND: 'Ada produk yang sudah dinonaktifkan. Muat ulang halaman lalu coba lagi.',
  PAYMENT_EXCEEDS_RECEIVABLE: 'Nominal pembayaran melebihi total tagihan toko ini.',
  VISIT_QUANTITY_INVALID: 'Jumlah stok tidak boleh negatif.',
}

export default function VisitNewRoute() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialPartnerId = searchParams.get('partnerId') || searchParams.get('warung_id') || ''

  const [currentStep, setCurrentStep] = useState<StepState>('input_stock')
  const [createdVisit, setCreatedVisit] = useState<CreatedVisitResult | null>(null)
  const [activeClientRequestId, setActiveClientRequestId] = useState<string>(() => generateUUID())

  // Draf kunjungan persisten (Offline-First)
  const { draft, saveDraft, clearDraft } = useVisitDraft()
  const [hasPromptedDraft, setHasPromptedDraft] = useState(false)

  // React Hook Form terintegrasi Zod
  const {
    watch,
    setValue,
    trigger,
    reset,
  } = useForm<VisitFormData>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: {
      partnerId: initialPartnerId,
      receivedBy: '',
      items: [],
    },
  })

  const selectedPartnerId = watch('partnerId')
  const formReceivedBy = watch('receivedBy')

  // Ambil daftar mitra dari backend
  const { data: partnerOptions = [], isLoading: isPartnersLoading } = usePartnerOptions()

  const createVisitMutation = useCreateVisit()

  // Ambil detail warung yang sedang aktif
  const selectedPartner = useMemo(() => {
    return partnerOptions.find((p) => p.id === selectedPartnerId)
  }, [partnerOptions, selectedPartnerId])

  // Produk aktif penitip + stok di rak warung ini (sisa batch di server = "stok kemarin")
  const stockQuery = usePartnerStock(selectedPartner ? selectedPartnerId : null)
  const stockItems = useMemo(() => stockToVisitItems(stockQuery.data ?? []), [stockQuery.data])

  // Isian pengguna (atau draf yang dipulihkan); null = belum diubah
  const [customItems, setCustomItems] = useState<VisitItemInput[] | null>(null)

  const items = useMemo(() => {
    if (customItems === null) return stockItems
    if (!stockQuery.data) return customItems
    // Selaraskan isian/draf dengan stok terbaru di server agar tidak STOCK_MISMATCH.
    const byProduct = new Map(customItems.map((it) => [it.productId, it]))
    return stockItems.map((base) => {
      const custom = byProduct.get(base.productId)
      if (!custom) return base
      return {
        ...custom,
        productName: base.productName,
        consignPrice: base.consignPrice,
        prevStock: base.prevStock,
        remaining: Math.min(custom.remaining, base.prevStock),
        returned: Math.min(custom.returned, Math.max(0, base.prevStock - Math.min(custom.remaining, base.prevStock))),
      }
    })
  }, [customItems, stockItems, stockQuery.data])

  // Sinkronisasi items ke RHF saat terinisialisasi
  useEffect(() => {
    if (items.length > 0) {
      setValue('items', items)
    }
  }, [items, setValue])

  // Diterima oleh default ke kontak warung
  const effectiveReceivedBy =
    formReceivedBy !== ''
      ? formReceivedBy
      : selectedPartner
      ? selectedPartner.ownerName || selectedPartner.name
      : ''

  const handleUpdateItem = (index: number, updated: VisitItemInput) => {
    const next = [...items]
    next[index] = updated
    setCustomItems(next)
    setValue('items', next)
  }

  // Akumulasi total
  const totals = useMemo(() => {
    return calculateVisitTotals(items, selectedPartner?.receivable || 0)
  }, [items, selectedPartner])

  // Simpan otomatis draf kunjungan ke localStorage persisten (debounce 400ms)
  useEffect(() => {
    if (!selectedPartnerId || items.length === 0 || currentStep === 'success') return
    const timer = setTimeout(() => {
      saveDraft({
        partnerId: selectedPartnerId,
        receivedBy: effectiveReceivedBy,
        items,
        step: currentStep,
        clientRequestId: activeClientRequestId,
      })
    }, 400)
    return () => clearTimeout(timer)
  }, [selectedPartnerId, items, effectiveReceivedBy, currentStep, activeClientRequestId, saveDraft])

  // Reset form untuk kunjungan baru berikutnya
  const handleResetForNew = () => {
    clearDraft()
    reset({
      partnerId: '',
      receivedBy: '',
      items: [],
    })
    setCurrentStep('input_stock')
    setCreatedVisit(null)
    setCustomItems(null)
    setActiveClientRequestId(generateUUID())
    navigate('/kunjungan/baru')
  }

  // Handle submit final ke backend
  const handleSubmitVisit = async (paymentData: {
    status: PaymentChoice
    amount: number
    method: PaymentMethod
  }) => {
    if (!selectedPartnerId) return

    // Validasi skema Zod sebelum submit
    setValue('receivedBy', effectiveReceivedBy)
    const isValid = await trigger()
    if (!isValid) {
      toast.show({
        title: 'Form Belum Lengkap',
        description: 'Periksa kembali data stok dan nama penerima barang.',
        type: 'error',
      })
      return
    }

    try {
      const payloadItems = items.map((it) => ({
        product_id: it.productId,
        remaining: it.remaining,
        returned: it.returned,
        new_drop: it.newDrop,
      }))

      const payload = {
        client_request_id: activeClientRequestId,
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
      clearDraft()
      setCreatedVisit(res)
      setCurrentStep('success')
    } catch (err: unknown) {
      const friendly = describeApiError(err, { codeMessages: VISIT_ERROR_MESSAGES })

      if (friendly.kind === 'network') {
        toast.show({
          title: 'Koneksi Terputus',
          description: 'Kunjungan belum terkirim, tapi isianmu tetap tersimpan sebagai draf di HP ini.',
          type: 'error',
          action: {
            label: 'Coba Lagi',
            onClick: () => {
              handleSubmitVisit(paymentData)
            },
          },
        })
        return
      }

      if (err instanceof ApiError && err.code === 'STOCK_MISMATCH') {
        // Stok di server berubah (mis. nota dari toko): muat ulang lalu kembali ke langkah stok.
        stockQuery.refetch()
        setCurrentStep('input_stock')
      }
      if (err instanceof ApiError && err.code === 'IDEMPOTENCY_MISMATCH') {
        setActiveClientRequestId(generateUUID())
      }

      toast.show({
        title: 'Gagal Menyimpan Kunjungan',
        description: friendly.message,
        type: 'error',
      })
    }
  }

  // Lanjut ke ringkasan hanya bila ada perubahan stok yang valid
  const handleContinueToSummary = () => {
    if (totals.hasInvalidItems) return
    const hasMovement = items.some((it) => it.newDrop > 0 || it.returned > 0 || it.remaining !== it.prevStock)
    if (!hasMovement) {
      toast.show({
        title: 'Belum Ada Perubahan Stok',
        description: 'Isi sisa di rak, retur, atau titip baru minimal untuk satu produk.',
        type: 'error',
      })
      return
    }
    setCurrentStep('summary_payment')
  }

  // 1. Jika belum memilih warung mitra: Tampilkan pemilihan warung
  if (!selectedPartnerId || !selectedPartner) {
    const availablePartners = partnerOptions.filter((p) => p.id !== 'all')

    return (
      <PageContainer maxWidth="2xl">
        <PageHeader
          title="Pilih Warung Mitra"
          description="Pilih warung mitra yang Anda kunjungi untuk mencatat sisa stok dan titip baru."
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/kunjungan')}
              className="text-caption font-bold"
            >
              Batal
            </Button>
          }
        />

        {/* Banner Draf Kunjungan Persisten Offline-First */}
        {draft && !hasPromptedDraft && (
          <div className="p-4 rounded-2xl bg-accent-soft border border-accent/40 flex flex-col gap-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-accent font-bold text-caption uppercase tracking-wider flex items-center gap-1.5">
                <span>📋</span>
                <span>Draf Kunjungan Tersimpan</span>
              </span>
              <span className="text-caption text-ink-soft font-mono">
                {formatJamWIB(draft.updatedAt)} WIB
              </span>
            </div>
            <p className="text-caption text-ink">
              Ditemukan draf kunjungan lapangan yang belum diselesaikan ({draft.items.length} item produk). Lanjutkan draf?
            </p>
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setValue('partnerId', draft.partnerId)
                  setValue('receivedBy', draft.receivedBy || '')
                  setValue('items', draft.items)
                  setCustomItems(draft.items)
                  setCurrentStep(draft.step || 'input_stock')
                  setActiveClientRequestId(draft.clientRequestId)
                  setHasPromptedDraft(true)
                  toast.show({
                    title: 'Draf Dipulihkan',
                    description: 'Melanjutkan draf kunjungan sebelumnya.',
                    type: 'info',
                  })
                }}
                className="text-caption font-bold px-3 py-1.5 h-8 rounded-lg"
              >
                Lanjutkan Draf
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  clearDraft()
                  setHasPromptedDraft(true)
                  toast.show({
                    title: 'Draf Dihapus',
                    description: 'Memulai kunjungan baru dari awal.',
                    type: 'default',
                  })
                }}
                className="text-caption font-bold px-3 py-1.5 h-8 rounded-lg"
              >
                Buang Draf
              </Button>
            </div>
          </div>
        )}

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
                  setValue('partnerId', p.id)
                  setValue('receivedBy', p.ownerName || p.name)
                  setCustomItems(null)
                }}
                className="p-4 rounded-2xl bg-surface border border-line hover:border-primary/80 transition-all text-left flex items-center justify-between shadow-2xs group active:scale-[0.99]"
              >
                <div>
                  <h2 className="text-title-3 text-ink group-hover:text-primary transition-colors">
                    {p.name}
                  </h2>
                  <p className="text-caption text-ink-soft mt-0.5">
                    {p.ownerName ? `Pemilik: ${p.ownerName}` : ''}{' '}
                    {p.area ? `· ${p.area}` : ''}
                  </p>
                </div>

                <div className="text-right">
                  {p.receivable && p.receivable > 0 ? (
                    <span className="text-caption font-bold text-danger block tabular-nums">
                      Piutang: {rupiah(p.receivable)}
                    </span>
                  ) : (
                    <span className="text-caption font-semibold text-success block">Lunas</span>
                  )}
                  <span className="text-caption text-primary font-bold mt-1 inline-block">Pilih →</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </PageContainer>
    )
  }

  // 2. Jika sukses tersimpan: Tampilkan layar sukses
  if (currentStep === 'success' && createdVisit) {
    return (
      <PageContainer maxWidth="2xl">
        <VisitSuccessCard visit={createdVisit} onNewVisit={handleResetForNew} />
      </PageContainer>
    )
  }

  // 3. Tampilan Step Ringkasan & Pembayaran
  if (currentStep === 'summary_payment') {
    return (
      <PageContainer maxWidth="3xl">
        <PageHeader
          title="Ringkasan & Pembayaran"
          description={`Langkah 2 dari 2 · Kunjungan ke ${selectedPartner.name}`}
        />

        <VisitSummaryStep
          partner={selectedPartner}
          totals={totals}
          receivedBy={effectiveReceivedBy}
          onReceivedByChange={(val) => setValue('receivedBy', val)}
          onBack={() => setCurrentStep('input_stock')}
          onSubmit={handleSubmitVisit}
          isSubmitting={createVisitMutation.isPending}
        />
      </PageContainer>
    )
  }

  // 4. Tampilan Step 1: Input Stepper Stok per Produk
  return (
    <PageContainer maxWidth="3xl">
      {/* Header Warung Terpilih */}
      <div className="flex items-start justify-between gap-3 bg-surface rounded-2xl border border-line p-4 md:p-5 shadow-2xs">
        <div>
          <span className="text-caption font-bold text-primary uppercase tracking-wider">Langkah 1 dari 2</span>
          <h1 className="text-title-1 text-ink mt-0.5">
            {selectedPartner.name}
          </h1>
          <p className="text-caption text-ink-soft mt-0.5">
            {selectedPartner.ownerName ? `Penjaga: ${selectedPartner.ownerName}` : ''}{' '}
            {selectedPartner.area ? `· ${selectedPartner.area}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedPartner.receivable && selectedPartner.receivable > 0 ? (
            <div className="text-right hidden sm:block">
              <span className="text-caption text-ink-soft block font-medium">Piutang Lama</span>
              <span className="text-caption font-bold text-danger tabular-nums">
                {rupiah(selectedPartner.receivable)}
              </span>
            </div>
          ) : null}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setValue('partnerId', '')
              setCustomItems(null)
            }}
            className="rounded-lg text-caption font-semibold h-8"
          >
            Ganti Warung
          </Button>
        </div>
      </div>

      {/* Daftar Kartu Produk */}
      {stockQuery.isLoading ? (
        <div className="py-12 text-center text-caption text-ink-soft">Memuat produk & stok di rak…</div>
      ) : stockQuery.isError ? (
        <div className="py-12 flex flex-col items-center gap-3 text-center text-caption text-ink-soft">
          <span>{describeApiError(stockQuery.error).message}</span>
          <Button variant="outline" size="sm" onClick={() => stockQuery.refetch()} className="rounded-xl">
            Coba lagi
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 flex flex-col items-center gap-3 text-center text-caption text-ink-soft">
          <span>Belum ada produk aktif. Tambahkan produk dulu sebelum mencatat kunjungan.</span>
          <Button variant="outline" size="sm" onClick={() => navigate('/produk')} className="rounded-xl">
            Buka menu Produk
          </Button>
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
            <span className="text-caption text-ink-soft block font-medium">Estimasi Terjual:</span>
            <div className="flex items-center gap-2">
              <span className="text-title-2 md:text-title-1 font-bold text-ink tabular-nums">
                {rupiah(totals.todayTotal)}
              </span>
              <span className="text-caption text-ink-soft">({totals.totalSold} bks)</span>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={handleContinueToSummary}
            disabled={totals.hasInvalidItems || stockQuery.isLoading || items.length === 0}
            className="rounded-xl px-6 h-12 text-body font-bold shadow-xs flex items-center gap-1.5"
          >
            <span>Lanjut Pembayaran</span>
            <span>→</span>
          </Button>
        </div>

        {totals.hasInvalidItems && (
          <div className="max-w-3xl mx-auto mt-2 text-center text-danger text-caption font-semibold animate-fadeIn">
            ⚠ Perbaiki kartu produk yang melebihi stok kemarin sebelum melanjutkan.
          </div>
        )}
      </div>
    </PageContainer>
  )
}
