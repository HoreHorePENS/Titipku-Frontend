import type { InvoiceStatus } from '../types'

export interface InvoiceFilterTabsProps {
  search: string
  onSearchChange: (val: string) => void
  activeStatus: 'all' | InvoiceStatus
  onStatusChange: (status: 'all' | InvoiceStatus) => void
  counts: {
    all: number
    unpaid: number
    partial: number
    paid: number
  }
}

export function InvoiceFilterTabs({
  search,
  onSearchChange,
  activeStatus,
  onStatusChange,
  counts,
}: InvoiceFilterTabsProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full font-sans">
      {/* 1. Tab Filter Status (Semua, Belum Lunas, Sebagian, Lunas) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
        <button
          type="button"
          onClick={() => onStatusChange('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeStatus === 'all'
              ? 'bg-ink text-surface shadow-2xs'
              : 'bg-surface border border-line text-ink-soft hover:text-ink hover:bg-surface-raised'
          }`}
        >
          Semua ({counts.all})
        </button>

        <button
          type="button"
          onClick={() => onStatusChange('unpaid')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeStatus === 'unpaid'
              ? 'bg-danger text-white shadow-2xs'
              : 'bg-surface border border-line text-danger hover:bg-danger-soft/50'
          }`}
        >
          Belum Lunas ({counts.unpaid})
        </button>

        <button
          type="button"
          onClick={() => onStatusChange('partial')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeStatus === 'partial'
              ? 'bg-accent text-white shadow-2xs'
              : 'bg-surface border border-line text-accent hover:bg-accent-soft/50'
          }`}
        >
          Sebagian ({counts.partial})
        </button>

        <button
          type="button"
          onClick={() => onStatusChange('paid')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeStatus === 'paid'
              ? 'bg-success text-white shadow-2xs'
              : 'bg-surface border border-line text-success hover:bg-success-soft/50'
          }`}
        >
          Lunas ({counts.paid})
        </button>
      </div>

      {/* 2. Bar Pencarian No. Nota atau Nama Warung */}
      <div className="relative w-full sm:max-w-xs">
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
          placeholder="Cari no. nota atau warung..."
          className="w-full h-10 pl-9 pr-8 rounded-xl bg-surface border border-line text-xs font-medium text-ink placeholder:text-ink-soft/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-2xs transition-all"
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
    </div>
  )
}
