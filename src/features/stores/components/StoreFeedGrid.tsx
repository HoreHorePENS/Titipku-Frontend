import { Skeleton } from '@/components/ui/Skeleton'
import { StoreFeedCard } from './StoreFeedCard'
import type { Store } from '../types'

interface StoreFeedGridProps {
  stores: Store[]
  isLoading: boolean
  onConsign: (store: Store) => void
}

function StoreFeedSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs flex flex-col">
      <Skeleton variant="rect" className="aspect-[4/3] w-full rounded-none" />
      <div className="p-3 flex flex-col gap-2">
        <Skeleton variant="text" className="w-16 h-3" />
        <Skeleton variant="text" className="w-full h-4" />
        <Skeleton variant="text" className="w-3/4 h-3" />
        <Skeleton variant="rect" className="w-full h-11 rounded-xl mt-1" />
      </div>
    </div>
  )
}

export function StoreFeedGrid({ stores, isLoading, onConsign }: StoreFeedGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <StoreFeedSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (stores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <svg
            className="w-7 h-7 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <p className="text-body font-bold text-slate-900">Tidak Ada Toko Ditemukan</p>
        <p className="text-caption text-slate-500 mt-1 max-w-xs">
          Coba ubah kata kunci pencarian atau filter kategori untuk menemukan toko lainnya.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {stores.map((store) => (
        <StoreFeedCard key={store.id} store={store} onConsign={onConsign} />
      ))}
    </div>
  )
}
