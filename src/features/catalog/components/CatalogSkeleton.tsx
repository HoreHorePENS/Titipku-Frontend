import { Skeleton, SkeletonContainer } from '@/components/ui/Skeleton'

/**
 * Komposisi Skeleton Katalog & Warung sesuai rancangan desain:
 * - 2 batang judul (panjang dan pendek)
 * - 2 kotak statistik berdampingan
 * - 1 batang pembatas/sub-judul
 * - 2 kartu daftar (avatar kotak tumpul + 2 baris teks + deretan chip + 1 baris lebar)
 *
 * Dimensi dibuat persis dengan kartu aslinya agar bebas pergeseran tata letak (zero layout shift).
 */
export function CatalogSkeleton() {
  return (
    <SkeletonContainer className="w-full flex flex-col gap-4">
      {/* 1. Header Judul */}
      <div className="flex flex-col gap-2">
        <Skeleton variant="text" className="h-7 w-48" />
        <Skeleton variant="text" className="h-4 w-32" />
      </div>

      {/* 2. Dua Kotak Statistik Berdampingan */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-line rounded-2xl p-3.5 flex flex-col gap-2 shadow-xs">
          <Skeleton variant="text" className="h-3.5 w-16" />
          <Skeleton variant="text" className="h-7 w-24" />
        </div>
        <div className="bg-surface border border-line rounded-2xl p-3.5 flex flex-col gap-2 shadow-xs">
          <Skeleton variant="text" className="h-3.5 w-20" />
          <Skeleton variant="text" className="h-7 w-20" />
        </div>
      </div>

      {/* 3. Sub-judul / Batang pemisah */}
      <Skeleton variant="text" className="h-4 w-28 mt-1" />

      {/* 4. Kartu Daftar 1 */}
      <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <Skeleton variant="rect" className="w-12 h-12 rounded-xl shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5">
            <Skeleton variant="text" className="h-4.5 w-36" />
            <Skeleton variant="text" className="h-3.5 w-24" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="rect" className="h-6 w-16 rounded-full" />
          <Skeleton variant="rect" className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton variant="text" className="h-4 w-full mt-0.5" />
      </div>

      {/* 5. Kartu Daftar 2 */}
      <div className="bg-surface border border-line rounded-2xl p-4 flex flex-col gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <Skeleton variant="rect" className="w-12 h-12 rounded-xl shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5">
            <Skeleton variant="text" className="h-4.5 w-32" />
            <Skeleton variant="text" className="h-3.5 w-20" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton variant="rect" className="h-6 w-24 rounded-full" />
        </div>
      </div>
    </SkeletonContainer>
  )
}
