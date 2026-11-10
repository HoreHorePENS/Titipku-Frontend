import { useState, useMemo } from 'react'
import { Skeleton } from '@/components/ui/Skeleton'
import { ApiErrorState } from '@/components/shared/ApiErrorState'
import { EmptyState } from '@/components/shared/EmptyState'
import { describeApiError } from '@/lib/api-errors'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { PageContainer } from '@/components/shared'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/toast-store'
import { useCurrentAccount } from '@/features/auth'
import { StoreNotaModal } from '@/features/invoices'
import {
  ConsignmentRequestCard,
  ConsignmentRequestDetailModal,
  useConsignmentRequests,
  useMyStore,
  type ConsignmentRequest,
} from '@/features/stores'

type StatusFilter = 'all' | 'pending' | 'accepted' | 'rejected'

export default function PenitipRoute() {
  const navigate = useNavigate()
  const { data: currentAccount } = useCurrentAccount()
  const isPemilikToko = currentAccount?.user?.account_type === 'pemilik_toko'

  // Hook Permintaan Titipan & User Role Penitip
  const requestsQuery = useConsignmentRequests(isPemilikToko)
  const { requests, pendingCount, acceptedCount, rejectedCount, updateRequestStatus, isUpdating, updatingId } =
    requestsQuery
  const { data: myStore } = useMyStore()

  const [selectedRequest, setSelectedRequest] = useState<ConsignmentRequest | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  // Detail nota penjualan (dibuat penitip, toko hanya melihat & mengunduh)
  const [isNotaOpen, setIsNotaOpen] = useState(false)
  const [notaPenitip, setNotaPenitip] = useState<ConsignmentRequest | null>(null)
  const [notaInitialId, setNotaInitialId] = useState<string | null>(null)
  const openNotas = (request: ConsignmentRequest | null) => {
    setNotaPenitip(request)
    setNotaInitialId(null)
    setIsNotaOpen(true)
  }

  // Notifikasi "Nota baru": ?nota=<id> langsung membuka detail nota tsb.
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const notaParam = searchParams.get('nota')
  const [handledLocationKey, setHandledLocationKey] = useState<string | null>(null)
  if (notaParam && handledLocationKey !== location.key) {
    setHandledLocationKey(location.key)
    setNotaPenitip(null)
    setNotaInitialId(notaParam)
    setIsNotaOpen(true)
  }

  const respond = async (request: ConsignmentRequest, status: 'accepted' | 'rejected') => {
    try {
      await updateRequestStatus(request.id, status)
      toast.show(
        status === 'accepted'
          ? { title: 'Pengajuan disetujui', description: request.producerBusinessName + ' kini mitra tokomu.', type: 'success' }
          : { title: 'Pengajuan ditolak', description: 'Pengajuan dari ' + request.producerBusinessName + ' sudah ditolak.', type: 'info' }
      )
    } catch (err) {
      toast.show({ title: 'Pengajuan belum bisa diproses', description: describeApiError(err).message, type: 'error' })
    }
  }
  const handleQuickApprove = (request: ConsignmentRequest) => respond(request, 'accepted')
  const handleQuickReject = (request: ConsignmentRequest) => respond(request, 'rejected')

  // Klik Bar untuk Membuka Detail Lengkap
  const handleOpenDetail = (request: ConsignmentRequest) => {
    setSelectedRequest(request)
    setIsDetailModalOpen(true)
  }

  // Filter & Pencarian Data
  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      // 1. Filter Status
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false
      }

      // 2. Filter Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchBusiness = item.producerBusinessName.toLowerCase().includes(q)
        const matchOwner = item.producerOwnerName.toLowerCase().includes(q)
        const matchCity = (item.producerAddress ?? '').toLowerCase().includes(q)
        const matchProducts = item.items.some((prod) =>
          prod.productName.toLowerCase().includes(q)
        )
        return matchBusiness || matchOwner || matchCity || matchProducts
      }

      return true
    })
  }, [requests, statusFilter, searchQuery])

  // Pemisahan Mitra Aktif (Disetujui) dan History Pelanggan/Pengajuan
  const activeRequests = useMemo(() => {
    return filteredRequests.filter((r) => r.status === 'accepted')
  }, [filteredRequests])

  const historyRequests = useMemo(() => {
    return filteredRequests.filter((r) => r.status !== 'accepted')
  }, [filteredRequests])

  // Guard: Jika bukan pemilik toko, alihkan ke halaman warung konsinyasi
  if (currentAccount && !isPemilikToko) {
    navigate('/warung', { replace: true })
    return null
  }

  return (
    <PageContainer maxWidth="full" className="px-4 md:px-8">
      <div className="flex flex-col gap-6 py-4 w-full font-sans">
        {/* Header Halaman */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-caption font-semibold mb-1 border border-slate-200 self-start">
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Manajemen Kemitraan Toko</span>
            </div>
            <h1 className="text-title-1 text-slate-900">
              Daftar User Role Penitip
            </h1>
            <p className="text-caption sm:text-body text-slate-500">
              Daftar produsen UMKM (role penitip) yang mengajukan titip-jual ke warung Anda.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={() => openNotas(null)}
              className="flex items-center gap-1.5 text-caption font-semibold rounded-xl min-h-[44px]"
            >
              <span>Detail Nota Penjualan</span>
            </Button>
          </div>
        </div>

        {/* Ringkasan Statistik Penitip (4 Kolom Ringkas) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col">
            <span className="text-caption text-slate-500 font-medium">Total Penitip</span>
            <span className="text-title-1 font-bold text-slate-900 mt-1">{requests.length}</span>
            <span className="text-caption text-slate-400 mt-0.5">Produsen terdaftar</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col">
            <span className="text-caption text-amber-900 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Menunggu Approval
            </span>
            <span className="text-title-1 font-bold text-slate-900 mt-1">{pendingCount}</span>
            <span className="text-caption text-slate-400 mt-0.5">Perlu konfirmasi toko</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col">
            <span className="text-caption text-emerald-900 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Disetujui / Aktif
            </span>
            <span className="text-title-1 font-bold text-slate-900 mt-1">{acceptedCount}</span>
            <span className="text-caption text-slate-400 mt-0.5">Siap drop barang</span>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col">
            <span className="text-caption text-slate-500 font-medium">Ditolak</span>
            <span className="text-title-1 font-bold text-slate-700 mt-1">{rejectedCount}</span>
            <span className="text-caption text-slate-400 mt-0.5">Tidak diterima</span>
          </div>
        </div>

        {/* Search Bar & Filter Tab Switcher */}
        <div className="flex flex-col gap-3">
          {/* Input Pencarian */}
          <div className="relative">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama usaha penitip, nama pemilik, produk, atau kota..."
              className="pl-10 text-caption sm:text-body rounded-xl min-h-[44px]"
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-caption text-slate-400 hover:text-slate-600 px-1 py-0.5"
              >
                Hapus
              </button>
            )}
          </div>

          {/* Filter Pills / Tabs */}
          <div
            className="flex items-center gap-1.5 overflow-x-auto pb-1 text-caption"
            role="tablist"
            aria-label="Filter Status Penitip"
          >
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'all'}
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded-xl font-semibold transition-all cursor-pointer shrink-0 min-h-[40px] flex items-center gap-1.5 ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>Semua</span>
              <span
                className={`text-caption px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {requests.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'pending'}
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-2 rounded-xl font-semibold transition-all cursor-pointer shrink-0 min-h-[40px] flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>Menunggu Approval</span>
              {pendingCount > 0 && (
                <span className="text-caption px-1.5 py-0.2 rounded-full font-bold bg-amber-500 text-slate-900">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'accepted'}
              onClick={() => setStatusFilter('accepted')}
              className={`px-3 py-2 rounded-xl font-semibold transition-all cursor-pointer shrink-0 min-h-[40px] flex items-center gap-1.5 ${
                statusFilter === 'accepted'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>Disetujui / Aktif</span>
              <span
                className={`text-caption px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === 'accepted'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {acceptedCount}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === 'rejected'}
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-2 rounded-xl font-semibold transition-all cursor-pointer shrink-0 min-h-[40px] flex items-center gap-1.5 ${
                statusFilter === 'rejected'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>Ditolak</span>
              <span
                className={`text-caption px-1.5 py-0.2 rounded-full font-bold ${
                  statusFilter === 'rejected'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {rejectedCount}
              </span>
            </button>
          </div>
        </div>

        {/* Daftar Baris Kartu User Penitip */}
        <div className="flex flex-col gap-3">
          {requestsQuery.isLoading ? (
            <div className="flex flex-col gap-2.5" aria-busy="true" aria-label="Memuat daftar penitip">
              <Skeleton variant="rect" className="h-24 w-full rounded-2xl" />
              <Skeleton variant="rect" className="h-24 w-full rounded-2xl" />
            </div>
          ) : requestsQuery.isError ? (
            <ApiErrorState error={requestsQuery.error} onRetry={() => requestsQuery.refetch()} title="Daftar penitip belum bisa dimuat" />
          ) : requests.length === 0 ? (
            <EmptyState
              size="inline"
              title="Belum ada penitip"
              description="Penitip muncul di sini setelah mengajukan titip-jual ke tokomu atau menerima tawaranmu. Mulai dengan menawari penitip di Beranda."
              action={{ label: 'Cari penitip di Beranda', onClick: () => navigate('/') }}
            />
          ) : filteredRequests.length === 0 ? (
            <div className="py-12 bg-white rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center gap-3 p-6">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <div>
                <p className="text-body font-bold text-slate-900">
                  Tidak Ada Data User Penitip yang Cocok
                </p>
                <p className="text-caption text-slate-500 mt-1 max-w-sm">
                  {searchQuery
                    ? `Tidak ditemukan hasil dengan kata kunci "${searchQuery}". Coba kata kunci lain.`
                    : 'Belum ada data permohonan penitip untuk filter ini.'}
                </p>
              </div>
            </div>
          ) : statusFilter === 'all' ? (
            /* Tampilan Terstruktur: Mitra Aktif di Atas, History di Bawah */
            <div className="flex flex-col gap-8">
              {/* Bagian Atas: Mitra Penitip Aktif */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
                    <h2 className="text-title-3 text-slate-900">
                      Mitra Penitip Aktif ({activeRequests.length})
                    </h2>
                  </div>
                  <span className="text-caption text-slate-500 font-medium pl-[18px] sm:pl-0">Lihat nota penjualan dari penitip</span>
                </div>

                {activeRequests.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-caption text-slate-500">
                    Belum ada mitra penitip yang disetujui / aktif.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {activeRequests.map((request) => (
                      <ConsignmentRequestCard
                        key={request.id}
                        request={request}
                        onClick={handleOpenDetail}
                        onApprove={handleQuickApprove}
                        onReject={handleQuickReject}
                        busy={updatingId === request.id}
                        onViewNotas={openNotas}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Bagian Bawah: History Pelanggan & Pengajuan Penitip */}
              <div className="flex flex-col gap-3 pt-4 border-t border-slate-200">
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0"></span>
                    <h2 className="text-title-3 text-slate-900">
                      History Pelanggan &amp; Pengajuan Penitip ({historyRequests.length})
                    </h2>
                  </div>
                  <span className="text-caption text-slate-500 font-medium pl-[18px] sm:pl-0">Menunggu persetujuan atau riwayat ditolak</span>
                </div>

                {historyRequests.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-caption text-slate-500">
                    Tidak ada riwayat pelanggan atau permohonan tertunda.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {historyRequests.map((request) => (
                      <ConsignmentRequestCard
                        key={request.id}
                        request={request}
                        onClick={handleOpenDetail}
                        onApprove={handleQuickApprove}
                        onReject={handleQuickReject}
                        busy={updatingId === request.id}
                        onViewNotas={openNotas}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filteredRequests.map((request) => (
                <ConsignmentRequestCard
                  key={request.id}
                  request={request}
                  onClick={handleOpenDetail}
                  onApprove={handleQuickApprove}
                  onReject={handleQuickReject}
                        busy={updatingId === request.id}
                  onViewNotas={openNotas}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modal Pop-up Rincian Lengkap User Penitip */}
        <ConsignmentRequestDetailModal
          request={selectedRequest}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          onUpdateStatus={updateRequestStatus}
          isUpdating={isUpdating}
          onViewNotas={openNotas}
        />

        {/* Detail nota penjualan dari penitip (hanya-baca + unduh PDF) */}
        <StoreNotaModal
          isOpen={isNotaOpen}
          onClose={() => {
            setIsNotaOpen(false)
            setNotaPenitip(null)
            setNotaInitialId(null)
          }}
          storeName={myStore?.name ?? 'Tokomu'}
          businessId={notaPenitip?.producerBusinessId}
          businessName={notaPenitip?.producerBusinessName}
          initialNotaId={notaInitialId}
        />
      </div>
    </PageContainer>
  )
}
