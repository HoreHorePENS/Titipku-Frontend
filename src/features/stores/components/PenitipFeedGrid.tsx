import { useMemo, useState } from 'react'
import { EmptyState } from '@/components/shared/EmptyState'
import { ApiErrorState } from '@/components/shared/ApiErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import { PenitipFeedCard } from './PenitipFeedCard'
import type { PenitipBusiness } from '../penitip-businesses'

interface PenitipFeedGridProps {
  businesses: PenitipBusiness[]
  isLoading: boolean
  error: unknown
  onRetry: () => void
  search: string
  onSearchChange: (value: string) => void
  onOffer: (business: PenitipBusiness) => void
  onViewDetail: (business: PenitipBusiness) => void
  /** Aksi pada empty state saat belum ada penitip sama sekali. */
  onCompleteProfile: () => void
}

type OfferFilter = 'all' | 'unoffered' | 'pending' | 'accepted'

const FILTERS: { key: OfferFilter; label: string; match: (b: PenitipBusiness) => boolean }[] = [
  { key: 'all', label: 'Semua', match: () => true },
  { key: 'unoffered', label: 'Belum ditawari', match: (b) => b.offerStatus === 'none' || b.offerStatus === 'rejected' },
  { key: 'pending', label: 'Tawaran terkirim', match: (b) => b.offerStatus === 'pending' || b.offerStatus === 'incoming' },
  { key: 'accepted', label: 'Bermitra', match: (b) => b.offerStatus === 'accepted' },
]

function FeedSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden" aria-busy="true" aria-label="Memuat daftar penitip">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="w-[280px] sm:w-[320px] shrink-0 bg-white border border-line rounded-2xl overflow-hidden">
          <Skeleton variant="rect" className="aspect-[16/9] w-full rounded-none" />
          <div className="p-3.5 flex flex-col gap-2">
            <Skeleton variant="text" className="w-2/3 h-4" />
            <Skeleton variant="text" className="w-1/2 h-3" />
            <Skeleton variant="text" className="w-full h-3" />
            <Skeleton variant="rect" className="w-full h-11 mt-2" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function PenitipFeedGrid({
  businesses,
  isLoading,
  error,
  onRetry,
  search,
  onSearchChange,
  onOffer,
  onViewDetail,
  onCompleteProfile,
}: PenitipFeedGridProps) {
  const [offerFilter, setOfferFilter] = useState<OfferFilter>('all')

  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.key, businesses.filter(f.match).length])) as Record<OfferFilter, number>,
    [businesses]
  )
  const visible = useMemo(
    () => businesses.filter(FILTERS.find((f) => f.key === offerFilter)!.match),
    [businesses, offerFilter]
  )
  const isSearching = search.trim().length > 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <label className="relative flex-1">
          <span className="sr-only">Cari penitip</span>
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama usaha, pemilik, atau produk"
            className="w-full pl-10 pr-4 py-2.5 text-body text-ink bg-white border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-focus-ring/40 placeholder:text-ink-soft min-h-[44px]"
          />
        </label>

        <div role="tablist" aria-label="Filter status tawaran" className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-line self-start sm:self-auto overflow-x-auto max-w-full">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              role="tab"
              aria-selected={offerFilter === filter.key}
              onClick={() => setOfferFilter(filter.key)}
              className={`px-3 py-1.5 rounded-lg text-label whitespace-nowrap transition-colors min-h-[36px] ${
                offerFilter === filter.key ? 'bg-white text-ink shadow-2xs' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {filter.label} ({counts[filter.key]})
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <FeedSkeleton />
      ) : error ? (
        <ApiErrorState error={error} onRetry={onRetry} title="Daftar penitip belum bisa dimuat" />
      ) : businesses.length === 0 && !isSearching ? (
        <EmptyState
          size="inline"
          title="Belum ada penitip yang siap titip"
          description="Penitip akan muncul di sini setelah mereka menambahkan produk. Sambil menunggu, lengkapi foto dan lokasi tokomu agar mudah ditemukan di peta."
          action={{ label: 'Lengkapi profil toko', onClick: onCompleteProfile }}
        />
      ) : visible.length === 0 ? (
        <p className="py-10 text-center text-body text-ink-soft bg-white rounded-2xl border border-line">
          {isSearching
            ? `Tidak ada penitip yang cocok dengan "${search.trim()}". Coba kata kunci lain.`
            : 'Belum ada penitip untuk filter ini.'}
        </p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-3 snap-x scrollbar-thin">
          {visible.map((biz) => (
            <div key={biz.id} className="w-[280px] sm:w-[320px] shrink-0 snap-start">
              <PenitipFeedCard business={biz} onOffer={onOffer} onViewDetail={onViewDetail} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
