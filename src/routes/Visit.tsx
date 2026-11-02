import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { useVisits } from '@/features/visit/api'
import { filterVisits, groupVisitsByDate } from '@/features/visit/calc'
import { VisitFilterBar } from '@/features/visit/components/VisitFilterBar'
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
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-7xl mx-auto flex flex-col gap-5 md:gap-6 font-sans">
      {/* --------------------------------------------------------------------
          1. HEADER ATAS (Judul & Tombol Catat Kunjungan)
          -------------------------------------------------------------------- */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">
          Kunjungan
        </h1>

        {/* Tombol Mobile: Kotak Hijau Teal + */}
        <button
          type="button"
          onClick={handleStartVisit}
          aria-label="Catat Kunjungan Baru"
          className="md:hidden w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs active:scale-95 transition-all"
        >
          <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* Tombol Desktop: Standar + Catat Kunjungan */}
        <div className="hidden md:block">
          <Button
            variant="primary"
            size="md"
            onClick={handleStartVisit}
            className="rounded-lg px-5 shadow-xs flex items-center gap-2 font-semibold"
          >
            <span className="text-lg leading-none">+</span>
            <span>Catat Kunjungan</span>
          </Button>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          2. BARIS FILTER (Warung, Rentang Tanggal, Pencarian)
          -------------------------------------------------------------------- */}
      <VisitFilterBar
        selectedPartner={selectedPartner}
        onSelectPartner={setSelectedPartner}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        search={search}
        onSearchChange={setSearch}
        totalCount={filteredVisits.length}
      />

      {/* --------------------------------------------------------------------
          3. AREA KONTEN (Loading, Error, Empty, atau Daftar Kunjungan)
          -------------------------------------------------------------------- */}
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
                {/* Header Tanggal Mobile */}
                <h2 className="text-xs font-bold text-ink-soft tracking-wider px-1 pt-1">
                  {group.dateHeaderMobile}
                </h2>

                {/* Daftar Kartu Kunjungan */}
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

            {/* Tombol Paginasi Mobile */}
            <button
              type="button"
              className="w-full py-3.5 bg-surface rounded-xl border border-line text-sm font-bold text-ink hover:bg-surface-raised active:brightness-95 transition-colors shadow-2xs mt-1"
            >
              Muat lebih banyak
            </button>
          </div>

          {/* TAMPILAN DESKTOP: TABEL PADAT LENGKAP */}
          <div className="hidden md:flex md:flex-col md:gap-4">
            <VisitTableDesktop
              groups={groupedVisits}
              onSelect={(v) => setActiveModalVisit(v)}
            />

            {/* Tombol Paginasi Desktop */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                className="px-5 py-2 bg-surface rounded-lg border border-line text-xs font-semibold text-ink hover:bg-surface-raised transition-colors shadow-2xs"
              >
                Muat 20 kunjungan lagi
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal Detail Kunjungan */}
      <VisitDetailModal
        visit={activeModalVisit}
        onClose={() => setActiveModalVisit(null)}
      />
    </div>
  )
}
