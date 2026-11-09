import { useState, useMemo } from 'react'
import { PenitipFeedCard } from './PenitipFeedCard'
import { PENITIP_CATEGORIES, type PenitipBusiness, type PenitipCategory } from '../penitip-businesses'

interface PenitipFeedGridProps {
  businesses: PenitipBusiness[]
  onOffer: (business: PenitipBusiness) => void
  onViewDetail: (business: PenitipBusiness) => void
}

type OfferFilter = 'all' | 'unoffered' | 'pending' | 'accepted'

export function PenitipFeedGrid({ businesses, onOffer, onViewDetail }: PenitipFeedGridProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<PenitipCategory>('all')
  const [offerFilter, setOfferFilter] = useState<OfferFilter>('all')

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      // 1. Filter Kategori
      if (selectedCategory !== 'all' && b.category !== selectedCategory) {
        return false
      }

      // 2. Filter Status Tawaran
      if (offerFilter === 'unoffered' && b.offerStatus !== 'none') {
        return false
      }
      if (offerFilter === 'pending' && b.offerStatus !== 'pending') {
        return false
      }
      if (offerFilter === 'accepted' && b.offerStatus !== 'accepted') {
        return false
      }

      // 3. Search Query
      if (search.trim()) {
        const q = search.toLowerCase().trim()
        const matchName = b.businessName.toLowerCase().includes(q)
        const matchOwner = b.ownerName.toLowerCase().includes(q)
        const matchCity = b.city.toLowerCase().includes(q)
        const matchProducts = b.topProducts.some((p) => p.name.toLowerCase().includes(q))
        return matchName || matchOwner || matchCity || matchProducts
      }

      return true
    })
  }, [businesses, selectedCategory, offerFilter, search])

  return (
    <div className="flex flex-col gap-4">
      {/* Search Bar & Filter Tab Status */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Input Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama produsen, pemilik, produk, atau kota..."
            className="w-full pl-10 pr-4 py-2.5 text-xs text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400 min-h-[44px]"
          />
        </div>

        {/* Tab Status Tawaran */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setOfferFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
              offerFilter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({businesses.length})
          </button>
          <button
            type="button"
            onClick={() => setOfferFilter('unoffered')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
              offerFilter === 'unoffered'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Belum Ditawari
          </button>
          <button
            type="button"
            onClick={() => setOfferFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
              offerFilter === 'pending'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tawaran Terkirim
          </button>
          <button
            type="button"
            onClick={() => setOfferFilter('accepted')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
              offerFilter === 'accepted'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bermitra
          </button>
        </div>
      </div>

      {/* Filter Kategori Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {PENITIP_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setSelectedCategory(cat.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors min-h-[36px] ${
              selectedCategory === cat.key
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Rekomendasi Produsen Penitip 1 Baris Geser (Horizontal Scroll) */}
      {filteredBusinesses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
            <svg
              className="w-7 h-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="text-sm font-bold text-slate-900">Tidak Ada Produsen Ditemukan</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Coba ubah kata kunci pencarian atau sesuaikan filter kategori dan status tawaran.
          </p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-3 snap-x scrollbar-thin">
          {filteredBusinesses.map((biz) => (
            <div key={biz.id} className="w-[280px] sm:w-[320px] shrink-0 snap-start">
              <PenitipFeedCard
                business={biz}
                onOffer={onOffer}
                onViewDetail={onViewDetail}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
