import type { HealthTier } from '../types'

export interface PartnerFilterTabsProps {
  search: string
  onSearchChange: (val: string) => void
  activeTab: 'all' | HealthTier
  onTabChange: (tab: 'all' | HealthTier) => void
  counts: {
    all: number
    bagus: number
    pantau: number
    evaluasi: number
  }
}

export function PartnerFilterTabs({
  search,
  onSearchChange,
  activeTab,
  onTabChange,
  counts,
}: PartnerFilterTabsProps) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* 1. Bar Pencarian Nama Warung atau Daerah */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-ink-soft">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" strokeWidth="2" />
            <path strokeLinecap="round" strokeWidth="2" d="m21 21-4.35-4.35" />
          </svg>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari nama warung atau daerah..."
          className="w-full h-10 pl-9 pr-8 rounded-xl bg-surface border border-line text-xs md:text-sm font-medium text-ink placeholder:text-ink-soft/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-2xs transition-all"
        />

        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-2.5 flex items-center text-ink-soft hover:text-ink p-1"
            aria-label="Hapus pencarian"
          >
            ✕
          </button>
        )}
      </div>

      {/* 2. Tab Filter Status Kesehatan (Semua, Bagus, Pantau, Evaluasi) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => onTabChange('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'all'
              ? 'bg-ink text-surface shadow-2xs'
              : 'bg-surface border border-line text-ink-soft hover:text-ink hover:bg-surface-raised'
          }`}
        >
          Semua ({counts.all})
        </button>

        <button
          type="button"
          onClick={() => onTabChange('bagus')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'bagus'
              ? 'bg-success text-white shadow-2xs'
              : 'bg-surface border border-line text-success hover:bg-success-soft/50'
          }`}
        >
          Bagus ({counts.bagus})
        </button>

        <button
          type="button"
          onClick={() => onTabChange('pantau')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'pantau'
              ? 'bg-accent text-white shadow-2xs'
              : 'bg-surface border border-line text-accent hover:bg-accent-soft/50'
          }`}
        >
          Pantau ({counts.pantau})
        </button>

        <button
          type="button"
          onClick={() => onTabChange('evaluasi')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'evaluasi'
              ? 'bg-danger text-white shadow-2xs'
              : 'bg-surface border border-line text-danger hover:bg-danger-soft/50'
          }`}
        >
          Evaluasi ({counts.evaluasi})
        </button>
      </div>
    </div>
  )
}
