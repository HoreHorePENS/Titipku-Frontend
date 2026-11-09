import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { SalesChart } from '@/components/shared/SalesChart'
import { PageContainer, PageHeader } from '@/components/shared'
import { toast } from '@/components/ui/toast-store'
import { useDashboard, usePartners } from '@/features/dashboard/api'
import { useVisits } from '@/features/visit/api'
import { useCurrentAccount } from '@/features/auth'
import { CreateStoreInvoiceModal } from '@/features/invoices'
import {
  useMyStore,
  useSetMyStoreActive,
  useStores,
  getCategoryMeta,
  STORE_CATEGORIES_META,
  StoreFeedGrid,
  ConsignModal,
  usePenitipBusinesses,
  PenitipFeedGrid,
  OfferStoreModal,
  PenitipDetailModal,
  useConsignmentRequests,
  IncomingStoreOffers,
  type PenitipBusiness,
} from '@/features/stores'
import {
  generate30DaysSales,
} from '@/features/dashboard/calc'
import { rupiah, tanggalWIB } from '@/lib/format'
import type { Store } from '@/features/stores'

// ─── Komponen Dashboard Pemilik Toko ────────────────────────────────────────

function PemilikTokoDashboard({
  userName,
  todayFormatted,
}: {
  userName: string
  todayFormatted: string
}) {
  const navigate = useNavigate()
  const { data: store, isLoading, isError, refetch } = useMyStore()
  const setActiveMutation = useSetMyStoreActive()

  // Hook Bisnis Produsen Penitip & Fitur Tawaran Dua Arah
  const {
    businesses,
    sendOfferToPenitip,
    cancelOffer,
    pendingOffersCount,
  } = usePenitipBusinesses()

  // Permintaan titipan masuk dari sisi produsen
  const { requests, pendingCount: incomingRequestsCount } = useConsignmentRequests()

  const [selectedPenitip, setSelectedPenitip] = useState<PenitipBusiness | null>(null)
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false)

  const handleOpenOffer = (business: PenitipBusiness) => {
    setSelectedPenitip(business)
    setIsOfferModalOpen(true)
  }

  const handleOpenDetail = (business: PenitipBusiness) => {
    setSelectedPenitip(business)
    setIsDetailModalOpen(true)
  }

  const handleToggleActive = async () => {
    if (!store) return
    try {
      await setActiveMutation.mutateAsync(!store.isActive)
      toast.show({
        title: store.isActive ? 'Toko Dinonaktifkan' : 'Toko Diaktifkan',
        description: store.isActive
          ? 'Toko Anda disembunyikan sementara dari peta titip jual.'
          : 'Toko Anda kini terlihat kembali di peta bagi para produsen penitip.',
        type: 'success',
      })
    } catch {
      toast.show({
        title: 'Gagal Mengubah Status',
        description: 'Terjadi kendala saat mengubah status toko.',
        type: 'error',
      })
    }
  }

  if (isError) {
    return (
      <PageContainer>
        <ErrorState
          title="Gagal Memuat Informasi Toko"
          description="Terjadi kendala saat mengambil data toko fisik Anda dari server Titipku."
          onRetry={() => refetch()}
        />
      </PageContainer>
    )
  }

  const categoryMeta = store ? getCategoryMeta(store.category) : null

  return (
    <PageContainer maxWidth="full">
      <PageHeader
        title={`Selamat datang, ${userName}`}
        description={`${store?.name || 'Toko Mitra Titipku'} · ${todayFormatted}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsCreateInvoiceOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold rounded-xl min-h-[44px]"
            >
              <span className="font-bold">+</span>
              <span>Buat Nota Penjualan</span>
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/penitip')}
              className="flex items-center gap-1.5 text-xs font-semibold rounded-xl min-h-[44px]"
            >
              <span>Permohonan Masuk</span>
              {incomingRequestsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-white text-[10px] font-bold">
                  {incomingRequestsCount}
                </span>
              )}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/toko-saya')}
              className="flex items-center gap-1.5 text-xs font-semibold rounded-xl min-h-[44px]"
            >
              <span>Kelola Toko Saya</span>
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-5">
          <Skeleton variant="rect" className="h-28 w-full rounded-2xl" />
          <Skeleton variant="rect" className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="flex flex-col gap-8 font-sans">
          {/* Card Status Toko Fisik Ringkas */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path
                    d={
                      categoryMeta?.svgPath ||
                      'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'
                    }
                  ></path>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-bold text-slate-900">
                    {store?.name || 'Toko Anda'}
                  </h2>
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                    {categoryMeta?.label || 'Toko Mitra'}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      store?.isActive
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {store?.isActive ? '● Menerima Titipan di Peta' : '○ Tutup Sementara'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                  {store?.address || 'Alamat toko belum diatur'}
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Koordinat: {store?.latitude.toFixed(4)}, {store?.longitude.toFixed(4)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant={store?.isActive ? 'outline' : 'primary'}
                size="sm"
                onClick={handleToggleActive}
                loading={setActiveMutation.isPending}
                className="text-xs font-semibold rounded-xl min-h-[44px]"
              >
                {store?.isActive ? 'Tutup Titipan Sementara' : 'Buka & Terima Titipan'}
              </Button>
            </div>
          </div>

          {/* ── SEKSI UTAMA: MARKETPLACE FEED PRODUSEN PENITIP (CARD KOTAK SHOPEE-LIKE) ── */}
          <section className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-900 text-white">
                    Marketplace Konsinyasi
                  </span>
                  {pendingOffersCount > 0 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {pendingOffersCount} Tawaran Anda Dikirim
                    </span>
                  )}
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  Jelajahi Produsen UMKM &amp; Penitip
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih produsen UMKM potensial di sekitar Anda dan tawarkan toko Anda untuk menitipkan barang dagangan mereka (kemitraan dua arah).
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/penitip')}
                  className="text-xs font-semibold rounded-xl min-h-[44px]"
                >
                  Daftar Pengajuan Masuk ({requests.length}) →
                </Button>
              </div>
            </div>

            {/* Grid Card Kotak Penitip (1 Baris Geser) */}
            <PenitipFeedGrid
              businesses={businesses}
              onOffer={handleOpenOffer}
              onViewDetail={handleOpenDetail}
            />
          </section>
        </div>
      )}

      {/* Modal Tawari Toko ke Penitip */}
      <OfferStoreModal
        business={selectedPenitip}
        store={store ?? null}
        isOpen={isOfferModalOpen}
        onClose={() => {
          setIsOfferModalOpen(false)
          setSelectedPenitip(null)
        }}
        onSendOffer={sendOfferToPenitip}
      />

      {/* Modal Detail Profil Bisnis Penitip */}
      <PenitipDetailModal
        business={selectedPenitip}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedPenitip(null)
        }}
        onOffer={handleOpenOffer}
        onCancelOffer={cancelOffer}
      />

      {/* Modal Buat Nota Penjualan Digital Langsung dari Toko */}
      <CreateStoreInvoiceModal
        isOpen={isCreateInvoiceOpen}
        onClose={() => setIsCreateInvoiceOpen(false)}
        storeName={store?.name || 'Toko Mitra Titipku'}
      />
    </PageContainer>
  )
}

// ─── Komponen Marketplace Feed Penitip ──────────────────────────────────────

const ALL_CATEGORIES = [
  { key: 'all', label: 'Semua Toko' },
  ...Object.values(STORE_CATEGORIES_META).map((m) => ({ key: m.key, label: m.label })),
]

function PenitipMarketplace({
  userName,
  todayFormatted,
  dashboard,
  partners: _partners,
  visits,
  isLoading,
  isDashboardError,
  refetchDashboard,
}: {
  userName: string
  todayFormatted: string
  dashboard: ReturnType<typeof useDashboard>['data']
  partners: ReturnType<typeof usePartners>['data']
  visits: ReturnType<typeof useVisits>['data']
  isLoading: boolean
  isDashboardError: boolean
  refetchDashboard: () => void
}) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [consignTarget, setConsignTarget] = useState<Store | null>(null)
  const [isConsignOpen, setIsConsignOpen] = useState(false)

  const storeFilter = useMemo(
    () => ({
      search: search.trim() || undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
    }),
    [search, selectedCategory]
  )

  const { data: stores = [], isLoading: isStoresLoading } = useStores(storeFilter)

  const sales30Days = useMemo(() => generate30DaysSales(visits ?? []), [visits])
  const priorityPartners = dashboard?.priority_partners ?? []

  const handleConsign = (store: Store) => {
    setConsignTarget(store)
    setIsConsignOpen(true)
  }

  const handleStartVisit = (partnerId?: string) => {
    if (partnerId) {
      navigate(`/kunjungan/baru?partnerId=${partnerId}`)
    } else {
      navigate('/kunjungan/baru')
    }
  }

  if (isDashboardError) {
    return (
      <PageContainer>
        <ErrorState
          title="Gagal memuat beranda"
          description="Terjadi kendala saat menghubungkan ke server Titipku. Pastikan server backend sedang aktif."
          onRetry={refetchDashboard}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="full">
      {/* Header */}
      <PageHeader
        title={`Selamat datang, ${userName}`}
        description={todayFormatted}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/peta')}
              className="flex items-center gap-1.5 text-xs font-semibold rounded-xl min-h-[44px]"
            >
              <span>Peta Toko</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => handleStartVisit()}
              className="flex items-center gap-1.5 text-xs font-semibold rounded-xl min-h-[44px]"
            >
              <span className="text-sm leading-none font-bold">+</span>
              <span>Catat Kunjungan</span>
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-8 font-sans">
        {/* ── Seksi Tawaran Masuk dari Pemilik Warung/Toko (Fitur Approval Penitip) ── */}
        <IncomingStoreOffers />

        {/* ── Seksi 1: Jelajahi Toko Mitra ── */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Jelajahi Toko Mitra</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Temukan warung & toko yang siap menerima titip-jual produk UMKM Anda
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/peta')}
              className="text-xs font-semibold rounded-xl shrink-0 self-start sm:self-auto min-h-[44px]"
            >
              Buka Peta →
            </Button>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col gap-3 mb-4">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama toko atau alamat..."
                className="w-full pl-9 pr-4 py-2.5 text-sm text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400 min-h-[44px]"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors min-h-[36px] ${
                    selectedCategory === cat.key
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Store Feed Grid */}
          <StoreFeedGrid
            stores={stores}
            isLoading={isStoresLoading}
            onConsign={handleConsign}
          />
        </section>

        {/* ── Seksi 2: Statistik Kunci ── */}
        {isLoading ? (
          <div className="flex flex-col gap-5">
            <Skeleton variant="rect" className="h-24 w-full rounded-2xl" />
            <Skeleton variant="rect" className="h-64 w-full rounded-2xl" />
          </div>
        ) : (
          <>
            {/* ── Seksi: Grafik & Prioritas ── */}
            <section>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 flex flex-col gap-6">
                  <div className="bg-surface rounded-2xl border border-line p-5 shadow-2xs flex flex-col justify-between overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h2 className="text-sm font-bold text-ink">Penjualan 30 Hari</h2>
                        <p className="text-xs text-ink-soft">Per hari, harga titip konsinyasi</p>
                      </div>
                    </div>
                    <SalesChart data={sales30Days} />
                  </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-6">
                  {/* Kartu: Kunjungi Hari Ini */}
                  <div className="bg-surface rounded-2xl border border-line p-5 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-line">
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-bold text-ink">Kunjungi Hari Ini</h2>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-semibold border border-slate-200">
                            {priorityPartners.length}
                          </span>
                        </div>
                        <Link
                          to="/warung"
                          className="text-xs text-slate-700 font-semibold hover:underline"
                        >
                          Lihat Semua
                        </Link>
                      </div>

                      {priorityPartners.length === 0 ? (
                        <div className="py-6 text-center text-xs text-ink-soft">
                          Semua warung mitra dalam kondisi aman hari ini.
                        </div>
                      ) : (
                        <div className="divide-y divide-line">
                          {priorityPartners.slice(0, 4).map((p) => (
                            <div
                              key={p.id}
                              className="py-3 first:pt-3 last:pb-1 flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-ink leading-snug truncate">
                                  {p.name}{' '}
                                  <span className="font-normal text-ink-soft">
                                    · {p.owner_name || 'Mitra'}
                                  </span>
                                </p>
                                <p
                                  className={`text-[11px] mt-0.5 flex items-center gap-1.5 font-medium ${
                                    p.receivable > 0 ? 'text-danger' : 'text-slate-600'
                                  }`}
                                >
                                  <span className="truncate">
                                    {p.receivable > 0
                                      ? `Piutang ${rupiah(p.receivable)}`
                                      : 'Jadwal titip stok baru'}
                                  </span>
                                </p>
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStartVisit(p.id)}
                                className="rounded-lg h-7 px-2.5 text-xs font-semibold shrink-0 min-h-[44px]"
                              >
                                Mulai
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Kartu: Perlu Perhatian */}
                  <div className="bg-surface rounded-2xl border border-line p-5 shadow-2xs flex flex-col">
                    <h2 className="text-sm font-bold text-ink mb-3">Perlu Perhatian</h2>
                    {priorityPartners.filter((p) => p.receivable > 0).length === 0 ? (
                      <div className="flex-1 flex items-center justify-center text-xs text-ink-soft py-6">
                        Tidak ada warung yang memiliki tunggakan jatuh tempo.
                      </div>
                    ) : (
                      <div className="divide-y divide-line flex-1 flex flex-col justify-around">
                        {priorityPartners
                          .filter((p) => p.receivable > 0)
                          .slice(0, 4)
                          .map((p) => (
                            <div key={p.id} className="py-2 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-danger mt-1.5 shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-ink truncate">{p.name}</p>
                                <p className="text-[11px] text-danger font-medium">
                                  Nota belum lunas: {rupiah(p.receivable)}
                                </p>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {/* ConsignModal */}
      <ConsignModal
        store={consignTarget}
        isOpen={isConsignOpen}
        onClose={() => {
          setIsConsignOpen(false)
          setConsignTarget(null)
        }}
      />
    </PageContainer>
  )
}

// ─── Route Utama ─────────────────────────────────────────────────────────────

export default function HomeRoute() {
  const { data: currentAccount, isLoading: isAccountLoading } = useCurrentAccount()
  const isPemilikToko = currentAccount?.user?.account_type === 'pemilik_toko'
  const isPenitip = !isPemilikToko && !isAccountLoading

  const userName = currentAccount?.user?.full_name || (isPemilikToko ? 'Pemilik Toko' : 'Bu Rina')
  const [todayFormatted] = useState(() => tanggalWIB(new Date()))

  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    refetch: refetchDashboard,
  } = useDashboard(undefined, isPenitip)

  const { data: partners = [], isLoading: isPartnersLoading } = usePartners(isPenitip)
  const { data: visits = [], isLoading: isVisitsLoading } = useVisits(undefined, isPenitip)

  const isLoading = isDashboardLoading || isPartnersLoading || isVisitsLoading

  if (isPemilikToko) {
    return <PemilikTokoDashboard userName={userName} todayFormatted={todayFormatted} />
  }

  return (
    <PenitipMarketplace
      userName={userName}
      todayFormatted={todayFormatted}
      dashboard={dashboard}
      partners={partners}
      visits={visits}
      isLoading={isLoading}
      isDashboardError={isDashboardError}
      refetchDashboard={refetchDashboard}
    />
  )
}
