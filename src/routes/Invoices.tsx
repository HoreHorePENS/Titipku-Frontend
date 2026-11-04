import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { InvoiceSummaryCards } from '@/features/invoices/components/InvoiceSummaryCards'
import { InvoiceFilterTabs } from '@/features/invoices/components/InvoiceFilterTabs'
import { InvoiceTableDesktop } from '@/features/invoices/components/InvoiceTableDesktop'
import { InvoiceCardMobile } from '@/features/invoices/components/InvoiceCardMobile'
import { PaymentRecordModal } from '@/features/invoices/components/PaymentRecordModal'
import { useInvoices, useCreatePayment } from '@/features/invoices/api'
import { usePartners } from '@/features/partner/api'
import { calculateInvoicesMetrics, filterInvoices } from '@/features/invoices/calc'
import { rupiah } from '@/lib/format'
import type { Invoice, InvoiceStatus, PaymentPayload } from '@/features/invoices/types'

export default function InvoicesRoute() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all')
  const [selectedPartnerIdFilter, setSelectedPartnerIdFilter] = useState<string>('')
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [modalInitialPartnerId, setModalInitialPartnerId] = useState<string>('')

  // 1. Ambil data tagihan dan mitra dari backend
  const { data: invoices = [], isLoading: isInvoicesLoading, isError: isInvoicesError, refetch } = useInvoices()
  const { data: partners = [], isLoading: isPartnersLoading } = usePartners()
  const createPaymentMutation = useCreatePayment()

  // 2. Hitung metrik ringkasan (Belum lunas, masuk bulan ini, daftar menunggak)
  const metrics = useMemo(() => {
    return calculateInvoicesMetrics(invoices)
  }, [invoices])

  // 3. Filter data berdasarkan tab status dan input pencarian
  const filteredInvoices = useMemo(() => {
    return filterInvoices(invoices, {
      search,
      statusFilter,
      partnerId: selectedPartnerIdFilter || undefined,
    })
  }, [invoices, search, statusFilter, selectedPartnerIdFilter])

  // 4. Hitung jumlah per tab
  const counts = useMemo(() => {
    const list = selectedPartnerIdFilter
      ? invoices.filter((i) => i.partnerId === selectedPartnerIdFilter)
      : invoices

    return {
      all: list.length,
      unpaid: list.filter((i) => i.status === 'unpaid').length,
      partial: list.filter((i) => i.status === 'partial').length,
      paid: list.filter((i) => i.status === 'paid').length,
    }
  }, [invoices, selectedPartnerIdFilter])

  // 5. Handler Buka Modal Pembayaran
  const handleOpenPayment = (partnerId = '') => {
    setModalInitialPartnerId(partnerId)
    setIsPaymentModalOpen(true)
  }

  // 6. Handler Submit Pembayaran FIFO
  const handleSubmitPayment = async (payload: PaymentPayload) => {
    await createPaymentMutation.mutateAsync(payload)
  }

  // 7. Handler Kirim Ulang via WhatsApp
  const handleResendWA = (invoice: Invoice) => {
    const rawPhone = invoice.partnerWhatsApp?.replace(/\D/g, '') || ''
    let waPhone = rawPhone
    if (waPhone.startsWith('0')) {
      waPhone = '62' + waPhone.slice(1)
    }

    const origin = window.location.origin
    const invoiceUrl =
      invoice.publicInvoiceUrl ||
      `${origin}/n/${invoice.visitNumber || invoice.id}`

    const messageText = `Halo ${invoice.partnerName},\n\nBerikut rincian nota tagihan konsinyasi ${invoice.visitNumber}:\n• Total Tagihan: ${rupiah(invoice.total)}\n• Sudah Dibayar: ${rupiah(invoice.paid)}\n• Sisa Belum Lunas: ${rupiah(invoice.remaining)}\n\nBuka nota digital lengkap di:\n${invoiceUrl}\n\nTerima kasih.`

    const waLink = waPhone
      ? `https://wa.me/${waPhone}?text=${encodeURIComponent(messageText)}`
      : `https://wa.me/?text=${encodeURIComponent(messageText)}`

    window.open(waLink, '_blank', 'noopener,noreferrer')
  }

  // 8. Handler Filter Cepat dari Banner Menunggak
  const handleSelectOverduePartner = (partnerId: string) => {
    const partner = partners.find((p) => p.id === partnerId)
    if (partner) {
      setSearch(partner.name)
      setStatusFilter('unpaid')
    } else {
      setSelectedPartnerIdFilter(partnerId)
    }
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-7xl mx-auto flex flex-col gap-6 font-sans pb-24 md:pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
            Tagihan & Piutang
          </h1>
          <p className="text-xs md:text-sm text-ink-soft mt-1">
            Pantau nota konsinyasi, alokasi FIFO pelunasan otomatis, dan piutang warung mitra.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => handleOpenPayment()}
          className="rounded-xl px-5 font-bold shadow-xs flex items-center gap-2 shrink-0 self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>Catat Pembayaran</span>
        </Button>
      </div>

      {/* Ringkasan Angka & Banner Menunggak > 14 Hari */}
      <InvoiceSummaryCards
        metrics={metrics}
        onSelectPartner={handleSelectOverduePartner}
      />

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-4">
        {selectedPartnerIdFilter && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-raised border border-line text-xs self-start">
            <span className="text-ink-soft">Filter mitra:</span>
            <strong className="text-ink">
              {partners.find((p) => p.id === selectedPartnerIdFilter)?.name || selectedPartnerIdFilter}
            </strong>
            <button
              type="button"
              onClick={() => setSelectedPartnerIdFilter('')}
              className="ml-1 text-ink-soft hover:text-ink font-bold"
              aria-label="Hapus filter mitra"
            >
              ✕
            </button>
          </div>
        )}

        <InvoiceFilterTabs
          search={search}
          onSearchChange={setSearch}
          activeStatus={statusFilter}
          onStatusChange={setStatusFilter}
          counts={counts}
        />
      </div>

      {/* Konten Utama (Tabel di Desktop, Kartu di Mobile) */}
      {isInvoicesLoading ? (
        <div className="py-16 text-center text-xs text-ink-soft bg-surface rounded-2xl border border-line animate-pulse">
          Memuat daftar tagihan…
        </div>
      ) : isInvoicesError ? (
        <div className="p-8 text-center bg-danger-soft rounded-2xl border border-danger/30 flex flex-col items-center gap-3">
          <p className="text-xs font-bold text-danger">Gagal memuat data tagihan dari server.</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Coba Lagi
          </Button>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="p-12 text-center bg-surface rounded-2xl border border-line flex flex-col items-center gap-2">
          <p className="text-sm font-bold text-ink">Tidak ada nota tagihan yang sesuai.</p>
          <p className="text-xs text-ink-soft">
            {search || statusFilter !== 'all' || selectedPartnerIdFilter
              ? 'Coba ganti filter status atau kata kunci pencarian.'
              : 'Belum ada kunjungan bertagihan yang tercatat.'}
          </p>
          {(search || statusFilter !== 'all' || selectedPartnerIdFilter) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('')
                setStatusFilter('all')
                setSelectedPartnerIdFilter('')
              }}
              className="mt-2 text-xs"
            >
              Reset Filter
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Tampilan Desktop: Tabel Padat */}
          <div className="hidden md:block">
            <InvoiceTableDesktop
              invoices={filteredInvoices}
              onPay={(inv) => handleOpenPayment(inv.partnerId)}
              onResendWA={handleResendWA}
              onViewDetail={(inv) => {
                const origin = window.location.origin
                const url = inv.publicInvoiceUrl || `${origin}/n/${inv.visitNumber || inv.id}`
                window.open(url, '_blank', 'noopener,noreferrer')
              }}
            />
          </div>

          {/* Tampilan Mobile: Kartu Responsif */}
          <div className="flex md:hidden flex-col gap-3">
            {filteredInvoices.map((inv) => (
              <InvoiceCardMobile
                key={inv.id}
                invoice={inv}
                onPay={(item) => handleOpenPayment(item.partnerId)}
                onResendWA={handleResendWA}
                onViewDetail={(item) => {
                  const origin = window.location.origin
                  const url = item.publicInvoiceUrl || `${origin}/n/${item.visitNumber || item.id}`
                  window.open(url, '_blank', 'noopener,noreferrer')
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Floating Action Button untuk Mobile */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <button
          type="button"
          onClick={() => handleOpenPayment()}
          className="h-14 w-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-primary-hover active:scale-95 transition-all focus:outline-none focus:ring-4 focus:ring-primary/20"
          aria-label="Catat Pembayaran Baru"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Modal / Bottom Sheet Catat Pembayaran FIFO */}
      <PaymentRecordModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmit={handleSubmitPayment}
        invoices={invoices}
        partners={partners}
        initialPartnerId={modalInitialPartnerId}
        isLoading={createPaymentMutation.isPending || isPartnersLoading}
      />
    </div>
  )
}
