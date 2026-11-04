import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { PageContainer, PageHeader, FilterBar } from '@/components/shared'
import { useVisits, usePartnerOptions } from '@/features/visit/api'
import { filterVisits, groupVisitsByDate } from '@/features/visit/calc'
import { VisitCardMobile } from '@/features/visit/components/VisitCardMobile'
import { VisitTableDesktop } from '@/features/visit/components/VisitTableDesktop'
import { VisitSkeleton } from '@/features/visit/components/VisitSkeleton'
import { VisitDetailModal } from '@/features/visit/components/VisitDetailModal'
import type { VisitRecord } from '@/features/visit/types'

export default function VisitRoute() {
  const navigate = useNavigate()
  const [selectedPartner, setSelectedPartner] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('all')
  const [search, setSearch] = useState<string>('')
  const [activeModalVisit, setActiveModalVisit] = useState<VisitRecord | null>(null)

  // Query langsung ke backend API core-service (Docker)
  const { data: visits = [], isLoading, isError, refetch } = useVisits(selectedPartner)
  const { data: partnerOptions = [{ id: 'all', name: 'Semua warung' }] } = usePartnerOptions()

  // Filter lokal (kata kunci pencarian, rentang tanggal)
  const filteredVisits = useMemo(() => {
    return filterVisits(visits, {
      partnerId: selectedPartner,
      dateRange,
      search,
    })
  }, [visits, selectedPartner, dateRange, search])

  // Kelompokkan per tanggal terbaru
  const groupedVisits = useMemo(() => {
    return groupVisitsByDate(filteredVisits)
  }, [filteredVisits])

  const handleStartVisit = () => {
    navigate('/kunjungan/baru')
  }

  return (
    <PageContainer>
      {/* 1. Header Halaman */}
      <PageHeader
        title="Kunjungan"
        description={`${filteredVisits.length} riwayat kunjungan tercatat`}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={handleStartVisit}
            className="flex items-center gap-1.5"
          >
            <span className="text-base leading-none font-bold">+</span>
            <span>Catat Kunjungan</span>
          </Button>
        }
      />

      {/* 2. Bar Filter */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari no. nota atau warung..."
        extraActions={
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            {/* Dropdown Warung */}
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              aria-label="Pilih warung"
              className="h-10 px-3 pr-8 rounded-xl bg-surface border border-line text-xs font-semibold text-ink appearance-none focus:outline-none focus:border-primary shadow-2xs cursor-pointer"
            >
              {partnerOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Dropdown Rentang Tanggal */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              aria-label="Rentang tanggal"
              className="h-10 px-3 pr-8 rounded-xl bg-surface border border-line text-xs font-semibold text-ink appearance-none focus:outline-none focus:border-primary shadow-2xs cursor-pointer"
            >
              <option value="all">Semua tanggal</option>
              <option value="7-hari">7 hari terakhir</option>
              <option value="bulan-ini">Bulan ini</option>
            </select>
          </div>
        }
      />

      {/* 3. Area Konten */}
      {isLoading ? (
        <VisitSkeleton />
      ) : isError ? (
        <ErrorState
          title="Gagal memuat kunjungan"
          description="Terjadi kendala saat mengambil data kunjungan dari server."
          onRetry={() => refetch()}
        />
      ) : filteredVisits.length === 0 ? (
        <EmptyState
          title="Tidak ada kunjungan"
          description="Belum ada riwayat kunjungan yang sesuai dengan filter yang Anda pilih."
          action={{
            label: 'Catat Kunjungan Baru',
            onClick: handleStartVisit,
          }}
        />
      ) : (
        <>
          {/* TAMPILAN MOBILE: KARTU DIKELOMPOKKAN PER TANGGAL */}
          <div className="flex flex-col gap-5 md:hidden">
            {groupedVisits.map((group) => (
              <div key={group.dateKey} className="flex flex-col gap-2.5">
                <h2 className="text-xs font-bold text-ink-soft tracking-wider px-1 pt-1">
                  {group.dateHeaderMobile}
                </h2>
                <div className="flex flex-col gap-3">
                  {group.visits.map((visit) => (
                    <VisitCardMobile
                      key={visit.id}
                      visit={visit}
                      onSelect={(v) => setActiveModalVisit(v)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* TAMPILAN DESKTOP: TABEL LENGKAP */}
          <div className="hidden md:flex md:flex-col md:gap-4">
            <VisitTableDesktop
              groups={groupedVisits}
              onSelect={(v) => setActiveModalVisit(v)}
            />
          </div>
        </>
      )}

      {/* Modal Detail Kunjungan */}
      <VisitDetailModal
        visit={activeModalVisit}
        onClose={() => setActiveModalVisit(null)}
      />
    </PageContainer>
  )
}
