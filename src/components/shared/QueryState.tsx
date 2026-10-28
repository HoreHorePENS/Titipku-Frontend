import { useDelayedLoading } from '@/components/ui/Skeleton'
import { ErrorState, type ErrorStateProps } from './ErrorState'

export interface QueryLikeResult<TData = unknown, TError = unknown> {
  data?: TData
  isLoading?: boolean
  isPending?: boolean
  isError?: boolean
  error?: TError | null
  refetch?: () => void | Promise<unknown>
}

export interface QueryStateProps<TData = unknown> {
  /** Hasil pemanggilan useQuery dari TanStack Query atau obyek sejenis */
  query: QueryLikeResult<TData>
  /** Komponen skeleton atau placeholder yang tampil saat sedang memuat */
  loadingComponent: React.ReactNode
  /** Komponen atau fungsi tampilan saat data kosong */
  emptyComponent?: React.ReactNode
  /** Fungsi penentu apakah data dianggap kosong (default: cek array kosong atau null/undefined) */
  isEmpty?: (data: TData) => boolean
  /** Komponen error kustom opsional. Jika tidak ada, menggunakan ErrorState bawaan */
  errorComponent?:
    | React.ReactNode
    | ((error: unknown, retry: () => void) => React.ReactNode)
  /** Properti tambahan untuk ErrorState bawaan */
  errorProps?: Partial<ErrorStateProps>
  /** Konten yang dirender saat data berhasil dimuat (bisa berupa fungsi render atau node) */
  children: React.ReactNode | ((data: TData) => React.ReactNode)
  /** Waktu tunda sebelum menampilkan loading (default: 200ms) */
  delayMs?: number
  /** Durasi minimum loading bertahan saat sudah tampil (default: 300ms) */
  minDisplayMs?: number
}

/**
 * QueryState: Pembungkus deklaratif untuk 4 keadaan layar data:
 * 1. Loading (menampilkan skeleton dengan penunda kedipan 200ms & min 300ms)
 * 2. Error (menampilkan kartu error dengan tombol coba lagi & data lama jika ada)
 * 3. Kosong (menampilkan emptyComponent saat data kosong)
 * 4. Berisi Data (merender children)
 */
export function QueryState<TData = unknown>({
  query,
  loadingComponent,
  emptyComponent,
  isEmpty,
  errorComponent,
  errorProps,
  children,
  delayMs = 200,
  minDisplayMs = 300,
}: QueryStateProps<TData>) {
  const isFetching = Boolean(query.isPending || query.isLoading)
  const showLoading = useDelayedLoading(isFetching, { delayMs, minDisplayMs })

  // 1. STATE: LOADING (Skeleton)
  if (showLoading) {
    return <>{loadingComponent}</>
  }

  // 2. STATE: ERROR
  if (query.isError) {
    const handleRetry = () => {
      if (query.refetch) {
        query.refetch()
      }
    }

    if (typeof errorComponent === 'function') {
      return <>{errorComponent(query.error, handleRetry)}</>
    }
    if (errorComponent) {
      return <>{errorComponent}</>
    }

    // Default ErrorState
    const isNetwork =
      query.error instanceof Error &&
      (query.error.message.toLowerCase().includes('network') ||
        query.error.message.toLowerCase().includes('fetch') ||
        query.error.message.toLowerCase().includes('offline'))

    return (
      <ErrorState
        type={isNetwork ? 'network' : 'generic'}
        onRetry={handleRetry}
        {...errorProps}
      />
    )
  }

  // 3. STATE: DATA CHECK
  const data = query.data as TData

  // Cek apakah data kosong
  const checkEmpty = () => {
    if (isEmpty) return isEmpty(data)
    if (data === null || data === undefined) return true
    if (Array.isArray(data) && data.length === 0) return true
    return false
  }

  if (checkEmpty()) {
    if (emptyComponent) {
      return <>{emptyComponent}</>
    }
  }

  // 4. STATE: SUCCESS (Render Children)
  if (typeof children === 'function') {
    return <>{(children as (d: TData) => React.ReactNode)(data)}</>
  }

  return <>{children}</>
}
