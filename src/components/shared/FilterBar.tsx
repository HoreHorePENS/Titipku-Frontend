import type React from 'react'

export interface FilterTabItem<T extends string = string> {
  value: T
  label: string
  count?: number
  tone?: 'default' | 'danger' | 'warning' | 'success'
}

export interface FilterBarProps<T extends string = string> {
  /** Nilai teks pencarian */
  searchValue?: string
  /** Callback perubahan teks pencarian */
  onSearchChange?: (val: string) => void
  /** Placeholder input pencarian */
  searchPlaceholder?: string
  /** Daftar tab filter */
  tabs?: FilterTabItem<T>[]
  /** Tab yang sedang aktif */
  activeTab?: T
  /** Callback saat tab berubah */
  onTabChange?: (val: T) => void
  /** Slot kontrol tambahan di sisi kanan (misal filter tanggal, toggle utang, dll.) */
  extraActions?: React.ReactNode
  className?: string
}

/**
 * Komponen bilah penyaring terpadu (Search + Tabs + Extra Actions).
 * Menggantikan implementasi duplikasi di PartnerFilterTabs, InvoiceFilterTabs,
 * ProductFilterTabs, dan VisitFilterBar.
 */
export function FilterBar<T extends string = string>({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Cari...',
  tabs,
  activeTab,
  onTabChange,
  extraActions,
  className = '',
}: FilterBarProps<T>) {
  const showSearch = onSearchChange !== undefined

  return (
    <div className={`flex flex-col gap-3 w-full font-sans ${className}`}>
      {/* Baris Atas: Input Pencarian + Extra Actions */}
      {(showSearch || extraActions) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
          {showSearch && (
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-ink-soft">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" strokeWidth="2" />
                  <path strokeLinecap="round" strokeWidth="2" d="m21 21-4.35-4.35" />
                </svg>
              </div>

              <input
                type="text"
                value={searchValue || ''}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-11 pl-9 pr-9 rounded-xl bg-surface border border-line text-sm font-medium text-ink placeholder:text-ink-soft/70 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-2xs transition-all"
              />

              {searchValue && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute inset-y-0 right-2.5 flex items-center text-ink-soft hover:text-ink p-1 cursor-pointer"
                  aria-label="Hapus teks pencarian"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {extraActions && (
            <div className="flex items-center gap-2 shrink-0">{extraActions}</div>
          )}
        </div>
      )}

      {/* Baris Bawah: Tab Segmented Filter */}
      {tabs && tabs.length > 0 && onTabChange && (
        <div
          className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none shrink-0"
          role="tablist"
        >
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.value

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => onTabChange(tab.value)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap min-h-[40px] shrink-0 ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface text-ink-soft border border-line hover:border-line-strong hover:text-ink hover:bg-surface-raised'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold tabular-nums ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-page text-ink-soft'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
