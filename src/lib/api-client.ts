// Fetch wrapper terstandarisasi sesuai kontrak backend Titipku
const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export interface ApiErrorDetail {
  code: string
  message: string
  fields?: Record<string, string>
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fields?: Record<string, string>

  constructor(status: number, errorDetail: ApiErrorDetail) {
    super(errorDetail.message || `API error: ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.code = errorDetail.code || 'UNKNOWN_ERROR'
    this.fields = errorDetail.fields
  }
}

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    let errorDetail: ApiErrorDetail = {
      code: 'HTTP_ERROR',
      message: `Permintaan gagal (${response.status} ${response.statusText})`,
    }

    try {
      const data: unknown = await response.json()
      if (
        data &&
        typeof data === 'object' &&
        'error' in data &&
        typeof (data as { error: unknown }).error === 'object'
      ) {
        const errObj = (data as { error: Record<string, unknown> }).error
        errorDetail = {
          code: typeof errObj.code === 'string' ? errObj.code : 'UNKNOWN_ERROR',
          message: typeof errObj.message === 'string' ? errObj.message : `API error: ${response.status}`,
          fields:
            errObj.fields && typeof errObj.fields === 'object'
              ? (errObj.fields as Record<string, string>)
              : undefined,
        }
      }
    } catch {
      // Body bukan JSON
    }

    throw new ApiError(response.status, errorDetail)
  }

  return response.json() as Promise<T>
}

