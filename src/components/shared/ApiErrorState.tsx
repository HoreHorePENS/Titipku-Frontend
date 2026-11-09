import { describeApiError } from '@/lib/api-errors'
import { ErrorState } from './ErrorState'

interface ApiErrorStateProps {
  /** Error dari TanStack Query / apiClient. */
  error: unknown
  onRetry: () => void
  /** Judul singkat yang menjelaskan apa yang gagal dimuat, mis. "Tawaran belum bisa dimuat". */
  title: string
  size?: 'page' | 'inline'
  className?: string
}

/** ErrorState dengan pesan ramah dari describeApiError (tanpa teks teknis/JSON). */
export function ApiErrorState({ error, onRetry, title, size = 'inline', className }: ApiErrorStateProps) {
  const friendly = describeApiError(error)
  const type = friendly.kind === 'network' ? 'network' : friendly.kind === 'server' ? 'server' : 'generic'
  return (
    <ErrorState
      type={type}
      title={title}
      description={friendly.message}
      onRetry={onRetry}
      size={size}
      className={className}
    />
  )
}
