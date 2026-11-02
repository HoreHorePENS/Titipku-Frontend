import { usePartnerOptions } from '../api'

export interface VisitFilterBarProps {
  selectedPartner: string
  onSelectPartner: (id: string) => void
  dateRange: string
  onDateRangeChange: (range: string) => void
  search: string
  onSearchChange: (query: string) => void
  totalCount: number
}

function SearchIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="8.5" cy="8.5" r="5.5" />
      <line x1="13" y1="13" x2="17.5" y2="17.5" />
    </svg>
  )
}

function CalendarIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

export function VisitFilterBar({
  selectedPartner,
  onSelectPartner,
  dateRange,
  onDateRangeChange,
  search,
  onSearchChange,
  totalCount,
}: VisitFilterBarProps) {
  const { data: partners = [{ id: 'all', name: 'Semua warung' }] } = usePartnerOptions()

  return (
    <div className="w-full flex flex-col gap-2.5">
      {/* --------------------------------------------------------------------
          1. TAMPILAN MOBILE: 2 DROPDOWN BERDAMPINGAN (PERSIS GAMBAR MOCKUP)
          -------------------------------------------------------------------- */}
      <div className="flex md:hidden items-center gap-3 w-full">
        {/* Dropdown Warung Mobile */}
        <div className="relative flex-1">
          <select
            value={selectedPartner}
            onChange={(e) => onSelectPartner(e.target.value)}
            className="w-full h-11 px-3.5 pr-8 rounded-xl bg-surface border border-line text-sm font-bold text-ink appearance-none focus:outline-none focus:border-primary shadow-2xs"
          >
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-ink-soft">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Dropdown Tanggal Mobile */}
        <div className="relative flex-1">
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="w-full h-11 px-3.5 pr-8 rounded-xl bg-surface border border-line text-sm font-bold text-ink appearance-none focus:outline-none focus:border-primary shadow-2xs"
          >
            <option value="all">1–28 Okt</option>
            <option value="7-hari">7 hari terakhir</option>
            <option value="bulan-ini">Bulan ini</option>
            <option value="semua">Semua tanggal</option>
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-ink-soft">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------
          2. TAMPILAN DESKTOP: CONTROL BAR INLINE (SERAGAM h-10 DENGAN SEARCH)
          -------------------------------------------------------------------- */}
      <div className="hidden md:flex items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-3">
          {/* 1. Dropdown Warung Desktop */}
          <div className="relative min-w-[200px]">
            <select
              value={selectedPartner}
              onChange={(e) => onSelectPartner(e.target.value)}
              className="w-full h-10 px-3.5 pr-9 rounded-lg bg-surface border border-line text-sm font-medium text-ink appearance-none focus:outline-none focus:border-primary shadow-2xs cursor-pointer hover:border-ink-soft/40 transition-colors"
            >
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-ink-soft">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* 2. Dropdown Rentang Tanggal Desktop */}
          <div className="relative min-w-[170px]">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-ink-soft">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <select
              value={dateRange}
              onChange={(e) => onDateRangeChange(e.target.value)}
              className="w-full h-10 pl-9 pr-8 rounded-lg bg-surface border border-line text-sm font-medium text-ink appearance-none focus:outline-none focus:border-primary shadow-2xs cursor-pointer hover:border-ink-soft/40 transition-colors"
            >
              <option value="all">Semua tanggal</option>
              <option value="7-hari">7 hari terakhir</option>
              <option value="bulan-ini">Bulan ini</option>
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-ink-soft">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* 3. Kotak Pencarian Desktop (Tinggi h-10 Serasi Sempurna dengan Mockup) */}
          <div className="relative w-64 lg:w-72">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-ink-soft">
              <SearchIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Cari no. nota atau warung..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full h-10 pl-9 pr-8 rounded-lg bg-surface border border-line text-sm font-normal text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-2xs transition-all hover:border-ink-soft/40"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-2.5 flex items-center text-ink-soft hover:text-ink p-1 transition-colors"
                aria-label="Hapus pencarian"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Counter Kunjungan */}
        <div className="text-xs text-ink-soft font-medium shrink-0">
          Menampilkan <span className="font-bold text-ink">{totalCount}</span> kunjungan
        </div>
      </div>
    </div>
  )
}
