import { Skeleton } from '@/components/ui/Skeleton'

export function VisitSkeleton() {
  return (
    <div className="w-full flex flex-col gap-4">
      {/* Mobile Skeleton Cards */}
      <div className="flex md:hidden flex-col gap-3">
        <Skeleton variant="rect" className="h-28 rounded-2xl" />
        <Skeleton variant="rect" className="h-28 rounded-2xl" />
        <Skeleton variant="rect" className="h-28 rounded-2xl" />
      </div>

      {/* Desktop Skeleton Table */}
      <div className="hidden md:flex flex-col gap-2">
        <Skeleton variant="rect" className="h-12 rounded-xl" />
        <Skeleton variant="rect" className="h-14 rounded-xl" />
        <Skeleton variant="rect" className="h-14 rounded-xl" />
        <Skeleton variant="rect" className="h-14 rounded-xl" />
      </div>
    </div>
  )
}
