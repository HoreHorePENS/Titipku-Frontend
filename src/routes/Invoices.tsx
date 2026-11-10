import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import {
  PageContainer,
  PageHeader,
  StatCard,
  StatCardGrid,
  FilterBar,
} from '@/components/shared'
import { InvoiceCardMobile } from '@/features/invoices/components/InvoiceCardMobile'
import { InvoiceTableDesktop } from '@/features/invoices/components/InvoiceTableDesktop'
import { PaymentRecordModal } from '@/features/invoices/components/PaymentRecordModal'
import { useInvoices, useCreatePayment } from '@/features/invoices/api'
import { usePartners } from '@/features/partner/api'
import { calculateInvoicesMetrics, filterInvoices } from '@/features/invoices/calc'
import { rupiah } from '@/lib/format'
import type { Invoice, InvoiceStatus, PaymentPayload, OverduePartner } from '@/features/invoices/types'

export default function InvoicesRoute() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | InvoiceStatus>('all')
  const [selectedPartnerIdFilter, setSelectedPartnerIdFilter] = useState<string>('')

  const navigate = useNavigate()

  // State Modal Bayar
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [modalPartnerId, setModalPartnerId] = useState<string>('')

  // Query Backend
  const { data: invoices = [], isLoading: isInvoicesLoading, isError: isInvoicesError, refetch } = useInvoices()
  const { data: partners = [] } = usePartners()
  const createPaymentMutation = useCreatePayment()

  // Ringkasan Finansial
  const metrics = useMemo(() => calculateInvoicesMetrics(invoices), [invoices])

  // Hitung jumlah per status untuk badge tab
  const counts = useMemo(() => {
    let unpaid = 0
    let partial = 0
    let paid = 0

    for (const inv of invoices) {
      if (inv.status === 'unpaid') unpaid++
      else if (inv.status === 'partial') partial++
      else if (inv.status === 'paid') paid++
    }

    return {
      all: invoices.length,
      unpaid,
      partial,
      paid,
    }
  }, [invoices])

  // Filter daftar tagihan
  const filteredInvoices = useMemo(() => {
    return filterInvoices(invoices, {
      search,
      statusFilter,
      partnerId: selectedPartnerIdFilter || undefined,
    })
  }, [invoices, search, statusFilter, selectedPartnerIdFilter])

  // Buka modal pencatatan pembayaran
  const handleOpenPayment = (partnerId?: string) => {
    setModalPartnerId(partnerId || selectedPartnerIdFilter || '')
    setIsPaymentModalOpen(true)
  }

  // Submit pembayaran ke API
  const handleSubmitPayment = async (payload: PaymentPayload) => {
    await createPaymentMutation.mutateAsync(payload)
    refetch()
  }

  // Kirim Ulang via WhatsApp
  const handleResendWA = (invoice: Invoice) => {
    const rawPhone = invoice.partnerWhatsApp?.replace(/\D/g, '') || ''
    let waPhone = rawPhone
    if (waPhone.startsWith('0')) {
      waPhone = '62' + waPhone.slice(1)
    }

    const origin = window.location.origin
    const invoiceUrl =
      invoice.publicInvoiceUrl || `${origin}/n/${invoice.visitNumber || invoice.id}`
    const text = encodeURIComponent(
      `Halo ${invoice.partnerName}, berikut salinan Nota Titipan #${invoice.visitNumber}:\n${invoiceUrl}\nTerima kasih!`
    )
    window.open(`https://wa.me/${waPhone}?text=${text}`, '_blank', 'noopener,noreferrer')
  }

  // Buka Detail Nota
  const handleViewDetail = (invoice: Invoice) => {
    const origin = window.location.origin
    const url = invoice.publicInvoiceUrl || `${origin}/n/${invoice.visitNumber || invoice.id}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Pilih mitra yang menunggak dari banner
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
    <PageContainer>
      {/* 1. Header Halaman Terstandarisasi */}
      <PageHeader
        title="Tagihan & Piutang"
        description="Pantau nota konsinyasi, pelunasan pembayaran, dan piutang toko mitra secara transparan."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/kunjungan/baru')}
              title="Tagihan terbit otomatis dari barang laku saat kunjungan dicatat"
              className="min-h-[44px] px-3.5 text-caption font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <span className="text-body font-bold">+</span>
              <span>Tagihan dari Kunjungan</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => handleOpenPayment()}
              className="min-h-[44px] px-4 text-caption font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span className="text-body font-bold">+</span>
              <span>Catat Pembayaran</span>
            </Button>
          </div>
        }
      />

      {/* 2. Ringkasan Finansial (StatCardGrid) */}
      <StatCardGrid columns={2}>
        <StatCard
          label="Belum Lunas"
          value={rupiah(metrics.totalUnpaidAmount)}
          tone="danger"
          hint={`dari ${metrics.totalUnpaidPartnersCount} warung (${metrics.totalUnpaidInvoicesCount} nota)`}
        />
        <StatCard
          label="Sudah Masuk Bulan Ini"
          value={rupiah(metrics.totalCollectedThisMonth)}
          tone="success"
          hint="Pelunasan tercatat periode berjalan"
        />
      </StatCardGrid>

      {/* 3. Banner Peringatan Menunggak > 14 Hari */}
      {metrics.overduePartners.length > 0 && (
        <div className="p-4 rounded-2xl bg-danger-soft/70 border border-danger/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs animate-in fade-in">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse shrink-0" />
              <span className="text-caption font-bold text-danger uppercase tracking-wider">
                Perhatian: {metrics.overduePartners.length} Warung Menunggak &gt; 14 Hari
              </span>
            </div>
            <p className="text-caption text-ink-soft">
              Segera prioritaskan kunjungan penagihan saat pengantaran barang berikutnya.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {metrics.overduePartners.map((op: OverduePartner) => (
              <Button
                key={op.partnerId}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSelectOverduePartner(op.partnerId)}
                className="text-caption font-bold border-danger/40 text-danger hover:bg-danger-soft min-h-[40px] cursor-pointer"
              >
                Tagih {op.partnerName} ({rupiah(op.amount)}) →
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Filter Tabs & Search Terpadu */}
      <FilterBar<'all' | InvoiceStatus>
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari nomor nota, warung, atau nama penerima..."
        activeTab={statusFilter}
        onTabChange={setStatusFilter}
        tabs={[
          { value: 'all', label: 'Semua', count: counts.all },
          { value: 'unpaid', label: 'Belum Lunas', count: counts.unpaid },
          { value: 'partial', label: 'Sebagian', count: counts.partial },
          { value: 'paid', label: 'Lunas', count: counts.paid },
        ]}
        extraActions={
          selectedPartnerIdFilter ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-raised border border-line text-caption">
              <span className="text-ink-soft">Filter mitra:</span>
              <strong className="text-ink">
                {partners.find((p) => p.id === selectedPartnerIdFilter)?.name || selectedPartnerIdFilter}
              </strong>
              <button
                type="button"
                onClick={() => setSelectedPartnerIdFilter('')}
                className="ml-1 text-ink-soft hover:text-ink font-bold cursor-pointer"
                aria-label="Hapus filter mitra"
              >
                ✕
              </button>
            </div>
          ) : undefined
        }
      />

      {/* 5. Konten Utama (Tabel di Desktop, Kartu di Mobile) */}
      {isInvoicesLoading ? (
        <div className="py-16 text-center text-caption text-ink-soft bg-surface rounded-2xl border border-line animate-pulse">
          Memuat daftar tagihan…
        </div>
      ) : isInvoicesError ? (
        <div className="p-8 text-center bg-danger-soft/40 rounded-2xl border border-danger/30 flex flex-col items-center gap-3">
          <p className="text-caption font-bold text-danger">Gagal memuat data tagihan dari server.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-caption font-bold">
            Coba Lagi
          </Button>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="py-16 text-center bg-surface rounded-2xl border border-line flex flex-col items-center justify-center p-6 text-caption text-ink-soft">
          <p className="font-bold text-ink text-body">Tidak ada tagihan yang cocok</p>
          <p className="mt-1">Coba sesuaikan kata kunci pencarian atau filter status nota Anda.</p>
          {(search || statusFilter !== 'all' || selectedPartnerIdFilter) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('')
                setStatusFilter('all')
                setSelectedPartnerIdFilter('')
              }}
              className="mt-4 text-caption font-bold"
            >
              Reset Semua Filter
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Tampilan Desktop: Tabel Lebar */}
          <div className="hidden md:block">
            <InvoiceTableDesktop
              invoices={filteredInvoices}
              onPay={(inv) => handleOpenPayment(inv.partnerId)}
              onResendWA={handleResendWA}
              onViewDetail={handleViewDetail}
            />
          </div>

          {/* Tampilan Mobile: Kartu Vertikal */}
          <div className="flex flex-col gap-3 md:hidden">
            {filteredInvoices.map((inv) => (
              <InvoiceCardMobile
                key={inv.id}
                invoice={inv}
                onPay={(item) => handleOpenPayment(item.partnerId)}
                onResendWA={handleResendWA}
                onViewDetail={handleViewDetail}
              />
            ))}
          </div>
        </>
      )}

      {/* Modal Catat Pembayaran */}
      <PaymentRecordModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        partners={partners}
        invoices={invoices}
        initialPartnerId={modalPartnerId}
        onSubmit={handleSubmitPayment}
        isLoading={createPaymentMutation.isPending}
      />
    </PageContainer>
  )
}
