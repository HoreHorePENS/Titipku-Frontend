import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { SalesChart } from '@/components/shared/SalesChart'
import { useDashboard, usePartners } from '@/features/dashboard/api'
import { useVisits } from '@/features/visit/api'
import {
  generate30DaysSales,
  calculateMonthSalesSummary,
  calculatePartnerPerformances,
} from '@/features/dashboard/calc'
import { rupiah, tanggalWIB } from '@/lib/format'

export default function HomeRoute() {
  const navigate = useNavigate()

  // Ambil data real-time langsung dari backend Titipku (Docker Go & Postgres)
  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    refetch: refetchDashboard,
  } = useDashboard()

  const { data: partners = [], isLoading: isPartnersLoading } = usePartners()
  const { data: visits = [], isLoading: isVisitsLoading } = useVisits()

  const isLoading = isDashboardLoading || isPartnersLoading || isVisitsLoading

  // Kalkulasi data murni dari kunjungan riil
  const sales30Days = useMemo(() => generate30DaysSales(visits), [visits])
  const monthSummary = useMemo(() => calculateMonthSalesSummary(visits), [visits])
  const partnerPerformances = useMemo(
    () => calculatePartnerPerformances(partners, visits),
    [partners, visits]
  )

  const priorityPartners = dashboard?.priority_partners || []
  const receivable = dashboard?.receivable || 0
  const activePartnersCount = dashboard?.active_partners || partners.length
  const unpaidInvoicesCount = dashboard?.unpaid_invoices || 0

  const todayFormatted = useMemo(() => tanggalWIB(new Date()), [])

  const handleStartVisit = (partnerId?: string) => {
    if (partnerId) {
      navigate(`/kunjungan/baru?partnerId=${partnerId}`)
    } else {
      navigate('/kunjungan/baru')
    }
  }

  if (isDashboardError) {
    return (
      <div className="px-4 py-8 max-w-7xl mx-auto">
        <ErrorState
          title="Gagal memuat beranda"
          description="Terjadi kendala saat menghubungkan ke server Titipku. Pastikan server backend sedang aktif."
          onRetry={() => refetchDashboard()}
        />
      </div>
    )
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-7xl mx-auto flex flex-col gap-6 font-sans">
      {/* --------------------------------------------------------------------
          1. HEADER ATAS (Salam Pengguna & Tanggal Hari Ini)
          -------------------------------------------------------------------- */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
            Selamat datang, Bu Rina
          </h1>
          <p className="text-caption md:text-body text-ink-soft mt-0.5">
            {todayFormatted}
          </p>
        </div>

        {/* Tombol Catat Kunjungan (Desktop kanan atas) */}
        <div className="hidden md:block">
          <Button
            variant="primary"
            size="md"
            onClick={() => handleStartVisit()}
            className="rounded-lg px-5 shadow-xs flex items-center gap-2 font-semibold"
          >
            <span className="text-lg leading-none">+</span>
            <span>Catat Kunjungan</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-5">
          <Skeleton variant="rect" className="h-44 w-full rounded-2xl" />
          <Skeleton variant="rect" className="h-32 w-full rounded-2xl" />
          <Skeleton variant="rect" className="h-64 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          {/* ====================================================================
              2. TAMPILAN MOBILE (Persis Gambar Mockup HP)
              ==================================================================== */}
          <div className="flex flex-col gap-5 md:hidden">
            {/* Kartu: Kunjungi Hari Ini (Prioritas Warung di HP) */}
            <div className="bg-surface rounded-2xl border-2 border-primary/90 p-4 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <h2 className="text-base font-bold text-ink">Kunjungi hari ini</h2>
                <span className="text-xs font-medium text-ink-soft">
                  {priorityPartners.length} warung
                </span>
              </div>

              {priorityPartners.length === 0 ? (
                <div className="py-6 text-center text-caption text-ink-soft">
                  Semua warung mitra dalam kondisi aman hari ini.
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {priorityPartners.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      className="py-3.5 first:pt-3 last:pb-1 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-ink leading-snug truncate">
                          {p.name}{' '}
                          <span className="font-normal text-ink-soft">
                            · {p.owner_name || 'Mitra'}
                          </span>
                        </p>
                        <p
                          className={`text-xs mt-1 flex items-center gap-1.5 font-medium ${
                            p.receivable > 0 ? 'text-danger' : 'text-accent'
                          }`}
                        >
                          <span className="text-[10px] leading-none">●</span>
                          <span className="truncate">
                            {p.receivable > 0
                              ? `Piutang ${rupiah(p.receivable)}`
                              : 'Jadwal titip stok baru'}
                          </span>
                        </p>
                      </div>

                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleStartVisit(p.id)}
                        className="rounded-lg h-9 px-4 text-xs font-bold shrink-0"
                      >
                        Mulai
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tombol Aksi Utama Catat Kunjungan (Mobile Full Width) */}
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => handleStartVisit()}
              className="rounded-xl h-[52px] text-base font-bold shadow-xs flex items-center justify-center gap-2"
            >
              <span className="text-xl leading-none">+</span>
              <span>Catat Kunjungan</span>
            </Button>

            {/* Garis Pembatas Lembut */}
            <hr className="border-line my-1" />

            {/* Metrik Kunci Terbesar: Uang Masih di Warung */}
            <div className="pt-1">
              <span className="text-caption font-medium text-ink-soft">
                Uang masih di warung
              </span>
              <div className="text-[34px] font-extrabold text-ink tabular-nums tracking-tight my-1">
                {rupiah(receivable)}
              </div>
              <p className="text-caption text-ink-soft">
                di {activePartnersCount} warung ·{' '}
                <Link to="/tagihan" className="text-primary font-bold hover:underline">
                  Lihat tagihan
                </Link>
              </p>
            </div>

            {/* Kartu Ringkasan Penjualan Bulan Ini (Mobile) */}
            <div className="bg-surface rounded-2xl border border-line divide-y divide-line shadow-2xs mt-1">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-caption font-medium text-ink">Penjualan Bulan Ini</p>
                  <p className="text-xs text-ink-soft font-medium mt-0.5">
                    {monthSummary.totalSoldPackages} bungkus laku
                  </p>
                </div>
                <span className="text-lg font-extrabold text-ink tabular-nums">
                  {rupiah(monthSummary.totalRevenue)}
                </span>
              </div>

              <div className="p-4 flex items-center justify-between">
                <p className="text-caption font-medium text-ink">Bungkus terjual</p>
                <span className="text-lg font-extrabold text-ink tabular-nums">
                  {monthSummary.totalSoldPackages.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="p-4 flex items-center justify-between">
                <p className="text-caption font-medium text-ink">Retur</p>
                <span className="text-lg font-extrabold text-ink tabular-nums">
                  {monthSummary.returnRatePercentage.toFixed(1).replace('.', ',')}%
                </span>
              </div>
            </div>
          </div>

          {/* ====================================================================
              3. TAMPILAN DESKTOP / LAPTOP (Persis Gambar Mockup Laptop)
              ==================================================================== */}
          <div className="hidden md:flex md:flex-col md:gap-6">
            {/* Baris 1: Grid Atas (Uang Masih di Warung + Kunjungi Hari Ini) */}
            <div className="grid grid-cols-12 gap-6 items-stretch">
              {/* Kartu Uang Masih di Warung & 3 Metrik Utama (8 kolom) */}
              <div className="col-span-8 bg-surface rounded-2xl border border-line p-6 flex flex-col justify-between shadow-2xs">
                <div>
                  <span className="text-caption font-medium text-ink-soft">
                    Uang masih di warung
                  </span>
                  <div className="text-4xl font-extrabold text-ink tabular-nums tracking-tight mt-1 mb-2">
                    {rupiah(receivable)}
                  </div>
                  <p className="text-caption text-ink-soft">
                    di {activePartnersCount} warung ·{' '}
                    {unpaidInvoicesCount > 0 ? (
                      <span className="text-danger font-semibold">
                        {unpaidInvoicesCount} nota belum lunas ·{' '}
                      </span>
                    ) : (
                      <span className="text-success font-semibold">Semua nota lunas · </span>
                    )}
                    <Link to="/tagihan" className="text-primary font-bold hover:underline">
                      Buka Tagihan
                    </Link>
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-line grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-caption text-ink-soft">Penjualan Bulan Ini</p>
                    <p className="text-xl font-extrabold text-ink tabular-nums mt-1">
                      {rupiah(monthSummary.totalRevenue)}
                    </p>
                    <p className="text-xs text-ink-soft font-medium mt-1">
                      {visits.length} kunjungan tercatat
                    </p>
                  </div>

                  <div className="border-l border-line pl-6">
                    <p className="text-caption text-ink-soft">Bungkus terjual</p>
                    <p className="text-xl font-extrabold text-ink tabular-nums mt-1">
                      {monthSummary.totalSoldPackages.toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-ink-soft mt-1">
                      di {activePartnersCount} mitra warung
                    </p>
                  </div>

                  <div className="border-l border-line pl-6">
                    <p className="text-caption text-ink-soft">Retur</p>
                    <p className="text-xl font-extrabold text-ink tabular-nums mt-1">
                      {monthSummary.returnRatePercentage.toFixed(1).replace('.', ',')}%
                    </p>
                    <p className="text-xs text-ink-soft mt-1">
                      {monthSummary.totalReturnedPackages} bungkus ditarik
                    </p>
                  </div>
                </div>
              </div>

              {/* Kartu Kunjungi Hari Ini (4 kolom) */}
              <div className="col-span-4 bg-surface rounded-2xl border border-line p-5 flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-line">
                    <h2 className="text-base font-bold text-ink">Kunjungi hari ini</h2>
                    <span className="text-xs text-ink-soft">
                      {priorityPartners.length} warung
                    </span>
                  </div>

                  {priorityPartners.length === 0 ? (
                    <div className="py-8 text-center text-caption text-ink-soft">
                      Semua warung mitra dalam kondisi aman.
                    </div>
                  ) : (
                    <div className="divide-y divide-line">
                      {priorityPartners.slice(0, 3).map((p) => (
                        <div key={p.id} className="py-3.5 flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-ink leading-tight truncate">
                              {p.name}{' '}
                              <span className="font-normal text-ink-soft">
                                · {p.owner_name || 'Mitra'}
                              </span>
                            </p>
                            <p
                              className={`text-xs mt-1 flex items-center gap-1.5 font-medium ${
                                p.receivable > 0 ? 'text-danger' : 'text-accent'
                              }`}
                            >
                              <span className="text-[10px] leading-none">●</span>
                              <span className="truncate">
                                {p.receivable > 0
                                  ? `Piutang ${rupiah(p.receivable)}`
                                  : 'Cek persediaan stok'}
                              </span>
                            </p>
                          </div>

                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleStartVisit(p.id)}
                            className="rounded-lg h-8 px-3 text-xs font-bold shrink-0"
                          >
                            Mulai
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Baris 2: Grid Tengah (Grafik Penjualan 30 Hari + Perlu Perhatian) */}
            <div className="grid grid-cols-12 gap-6 items-stretch">
              {/* Grafik Penjualan 30 Hari (8 kolom) */}
              <div className="col-span-8 bg-surface rounded-2xl border border-line p-5 shadow-2xs flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-ink">Penjualan 30 hari</h2>
                  <span className="text-xs text-ink-soft font-normal">
                    per hari, harga titip konsinyasi
                  </span>
                </div>

                <SalesChart data={sales30Days} />
              </div>

              {/* Kotak Perlu Perhatian (4 kolom) */}
              <div className="col-span-4 bg-surface rounded-2xl border border-line p-5 shadow-2xs flex flex-col">
                <h2 className="text-base font-bold text-ink mb-3">Perlu perhatian</h2>

                {priorityPartners.filter((p) => p.receivable > 0).length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-caption text-ink-soft">
                    Tidak ada warung yang memiliki tunggakan jatuh tempo.
                  </div>
                ) : (
                  <div className="divide-y divide-line flex-1 flex flex-col justify-around">
                    {priorityPartners
                      .filter((p) => p.receivable > 0)
                      .slice(0, 4)
                      .map((p) => (
                        <div key={p.id} className="py-2.5 flex items-start gap-2.5">
                          <span className="text-danger text-sm leading-none mt-1">●</span>
                          <div>
                            <p className="text-caption font-bold text-ink">{p.name}</p>
                            <p className="text-xs text-ink-soft mt-0.5">
                              Tunggakan piutang: {rupiah(p.receivable)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Baris 3: Tabel Peringkat Warung (Real Mitra Performance) */}
            <div className="bg-surface rounded-2xl border border-line p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-ink">Peringkat warung mitra</h2>
                <Link
                  to="/warung"
                  className="text-caption font-semibold text-primary hover:underline"
                >
                  Lihat {partners.length} warung
                </Link>
              </div>

              {partnerPerformances.length === 0 ? (
                <div className="py-8 text-center text-caption text-ink-soft">
                  Belum ada data warung mitra terdaftar.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-caption font-sans border-collapse">
                    <thead>
                      <tr className="border-b border-line text-[11px] font-bold text-ink-soft tracking-wider">
                        <th className="py-2.5 px-3 w-8">#</th>
                        <th className="py-2.5 px-3">WARUNG</th>
                        <th className="py-2.5 px-3 text-right">TERJUAL</th>
                        <th className="py-2.5 px-3 text-right">RETUR</th>
                        <th className="py-2.5 px-3 text-right">UTANG</th>
                        <th className="py-2.5 px-3">KUNJUNGAN TERAKHIR</th>
                        <th className="py-2.5 px-3">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {partnerPerformances.map((warung) => (
                        <tr key={warung.id} className="hover:bg-surface-raised transition-colors">
                          <td className="py-3 px-3 text-ink-soft font-medium tabular-nums">
                            {warung.rank}
                          </td>
                          <td className="py-3 px-3 font-bold text-ink">
                            {warung.name}{' '}
                            <span className="font-normal text-ink-soft">· {warung.area}</span>
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums font-medium text-ink">
                            {warung.sold}
                          </td>
                          <td
                            className={`py-3 px-3 text-right tabular-nums font-medium ${
                              warung.isReturnHigh ? 'text-danger font-bold' : 'text-ink'
                            }`}
                          >
                            {warung.returnRate}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums font-medium text-ink">
                            {rupiah(warung.debt)}
                          </td>
                          <td className="py-3 px-3 tabular-nums text-ink">{warung.lastVisit}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              <StatusBadge status={warung.status} />
                              <span className="text-xs text-ink-soft truncate max-w-xs">
                                {warung.note}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
