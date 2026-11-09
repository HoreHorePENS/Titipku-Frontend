// Fetch wrapper terstandarisasi sesuai kontrak backend Titipku
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

// In-memory token cache (memenuhi aturan AGENTS.md: dilarang menyimpan token di localStorage)
let memoryToken: string | null = null

export function getAuthToken(): string | null {
  if (memoryToken) return memoryToken
  try {
    return sessionStorage.getItem('titipku_auth_token')
  } catch {
    return null
  }
}

export function setAuthToken(token: string | null): void {
  memoryToken = token
  try {
    if (token) {
      sessionStorage.setItem('titipku_auth_token', token)
    } else {
      sessionStorage.removeItem('titipku_auth_token')
    }
  } catch {
    // SessionStorage tidak tersedia
  }
}

// Dev auto-login untuk environment pengembangan lokal (khusus DEV dengan flag eksplisit)
let loginPromise: Promise<string | null> | null = null

async function ensureDevToken(): Promise<string | null> {
  const currentToken = getAuthToken()
  if (currentToken) return currentToken

  const isDev = Boolean(import.meta.env.DEV)
  const isAutoLoginEnabled = import.meta.env.VITE_DEV_AUTO_LOGIN === 'true'
  const devEmail = import.meta.env.VITE_DEV_EMAIL
  const devPassword = import.meta.env.VITE_DEV_PASSWORD

  // Jangan pernah auto-login di build produksi atau jika flag / kredensial tidak aktif
  if (!isDev || !isAutoLoginEnabled || !devEmail || !devPassword) {
    return null
  }

  // Mencegah multiple concurrent login request
  if (loginPromise) return loginPromise

  loginPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: devEmail,
          password: devPassword,
        }),
      })

      if (res.ok) {
        const json = await res.json()
        const token = json?.data?.access_token
        if (typeof token === 'string') {
          setAuthToken(token)
          return token
        }
      }
    } catch {
      // Server backend mungkin sedang booting
    } finally {
      loginPromise = null
    }
    return null
  })()

  return loginPromise
}

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
  const isPublicRoute =
    endpoint.startsWith('/v1/public/') ||
    endpoint.startsWith('/v1/auth/login') ||
    endpoint.startsWith('/v1/auth/register') ||
    endpoint === '/healthz' ||
    endpoint === '/readyz'

  let token = getAuthToken()
  if (!token && !isPublicRoute) {
    token = await ensureDevToken()
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
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

    // Hanya logout jika token memang invalid/expired (bukan karena business scope)
    if (response.status === 401 && errorDetail.code !== 'BUSINESS_SCOPE_REQUIRED') {
      setAuthToken(null)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('titipku:unauthorized'))
      }
    }

    throw new ApiError(response.status, errorDetail)
  }

  return response.json() as Promise<T>
}
