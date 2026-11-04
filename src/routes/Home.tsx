import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/shared/ErrorState'
import { SalesChart } from '@/components/shared/SalesChart'
import { PageContainer, PageHeader, StatCardGrid, StatCard } from '@/components/shared'
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

  const [todayFormatted] = useState(() => tanggalWIB(new Date()))

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
          onRetry={() => refetchDashboard()}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      {/* 1. Header Atas: Salam & Aksi Cepat */}
      <PageHeader
        title="Selamat datang, Bu Rina"
        description={todayFormatted}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => handleStartVisit()}
            className="flex items-center gap-1.5"
          >
            <span className="text-base leading-none font-bold">+</span>
            <span>Catat Kunjungan</span>
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex flex-col gap-5">
          <Skeleton variant="rect" className="h-28 w-full rounded-2xl" />
          <Skeleton variant="rect" className="h-64 w-full rounded-2xl" />
          <Skeleton variant="rect" className="h-48 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* 2. Baris Stat Cards (4 Metrik Kunci Seragam) */}
          <StatCardGrid columns={4}>
            <StatCard
              label="Uang Masih di Warung"
              value={rupiah(receivable)}
              tone={receivable > 0 ? 'warning' : 'default'}
              hint={`di ${activePartnersCount} warung · ${
                unpaidInvoicesCount > 0 ? `${unpaidInvoicesCount} nota belum lunas` : 'semua nota lunas'
              }`}
            />
            <StatCard
              label="Penjualan Bulan Ini"
              value={rupiah(monthSummary.totalRevenue)}
              tone="primary"
              hint={`${visits.length} kunjungan tercatat`}
            />
            <StatCard
              label="Bungkus Terjual"
              value={`${monthSummary.totalSoldPackages.toLocaleString('id-ID')} bks`}
              tone="default"
              hint={`di ${activePartnersCount} mitra warung`}
            />
            <StatCard
              label="Tingkat Retur"
              value={`${monthSummary.returnRatePercentage.toFixed(1).replace('.', ',')}%`}
              tone={monthSummary.returnRatePercentage > 10 ? 'danger' : 'default'}
              hint={`${monthSummary.totalReturnedPackages} bungkus ditarik`}
            />
          </StatCardGrid>

          {/* 3. Grid Responsif: Grafik Penjualan & Daftar Prioritas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Kolom Kiri (Layar Besar: 8 Kolom) - Grafik 30 Hari */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="bg-surface rounded-2xl border border-line p-5 shadow-2xs flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-base font-bold text-ink">Penjualan 30 Hari</h2>
                    <p className="text-xs text-ink-soft">Per hari, harga titip konsinyasi</p>
                  </div>
                </div>
                <SalesChart data={sales30Days} />
              </div>
            </div>

            {/* Kolom Kanan (Layar Besar: 4 Kolom) - Kunjungi Hari Ini & Perlu Perhatian */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Kartu: Kunjungi Hari Ini */}
              <div className="bg-surface rounded-2xl border border-line p-5 shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-line">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-ink">Kunjungi Hari Ini</h2>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary-soft text-primary font-bold">
                        {priorityPartners.length}
                      </span>
                    </div>
                    <Link to="/warung" className="text-xs text-primary font-bold hover:underline">
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
                            <p className="text-sm font-bold text-ink leading-snug truncate">
                              {p.name}{' '}
                              <span className="font-normal text-ink-soft">
                                · {p.owner_name || 'Mitra'}
                              </span>
                            </p>
                            <p
                              className={`text-xs mt-0.5 flex items-center gap-1.5 font-medium ${
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

              {/* Kartu: Perlu Perhatian */}
              <div className="bg-surface rounded-2xl border border-line p-5 shadow-2xs flex flex-col">
                <h2 className="text-base font-bold text-ink mb-3">Perlu Perhatian</h2>
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
                        <div key={p.id} className="py-2.5 flex items-start gap-2.5">
                          <span className="text-danger text-sm leading-none mt-0.5">●</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-ink truncate">{p.name}</p>
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
          </div>

          {/* 4. Baris Tabel: Peringkat Warung Mitra */}
          <div className="bg-surface rounded-2xl border border-line p-5 md:p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-ink">Peringkat Warung Mitra</h2>
                <p className="text-xs text-ink-soft">
                  Berdasarkan volume penjualan dan keandalan pembayaran
                </p>
              </div>
              <Link
                to="/warung"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Lihat Semua ({partners.length})
              </Link>
            </div>

            {partnerPerformances.length === 0 ? (
              <div className="py-8 text-center text-xs text-ink-soft">
                Belum ada data warung mitra terdaftar.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans border-collapse">
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
      )}
    </PageContainer>
  )
}
