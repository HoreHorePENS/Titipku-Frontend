import type { ProductStatusFilter } from '../types'

export interface ProductFilterTabsProps {
  search: string
  onSearchChange: (val: string) => void
  activeTab: ProductStatusFilter
  onTabChange: (tab: ProductStatusFilter) => void
  counts: {
    all: number
    active: number
    inactive: number
  }
}

export function ProductFilterTabs({
  search,
  onSearchChange,
  activeTab,
  onTabChange,
  counts,
}: ProductFilterTabsProps) {
  const tabs: Array<{ id: ProductStatusFilter; label: string; count: number }> = [
    { id: 'all', label: 'Semua', count: counts.all },
    { id: 'active', label: 'Aktif', count: counts.active },
    { id: 'inactive', label: 'Nonaktif', count: counts.inactive },
  ]

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Input Pencarian */}
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
          placeholder="Cari nama produk konsinyasi..."
          className="w-full h-11 pl-9 pr-9 rounded-xl bg-surface border border-line text-sm font-medium text-ink placeholder:text-ink-soft/70 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-2xs transition-all"
        />

        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-2.5 flex items-center text-ink-soft hover:text-ink p-1 cursor-pointer"
            aria-label="Hapus pencarian"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tabs Filter Status */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist">
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isSelected}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap min-h-[40px] ${
                isSelected
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface text-ink-soft border border-line hover:border-line-strong hover:text-ink'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold tabular-nums ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-page text-ink-soft'
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
