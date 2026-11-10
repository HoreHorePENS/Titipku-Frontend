import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, resolveMediaUrl } from '@/lib/api-client'
import type { Store, StoreFilter, StoreInput } from './types'

interface RawStoreResponse {
  id: string
  name: string
  category: string
  description?: string | null
  address: string
  whatsapp: string
  latitude: number
  longitude: number
  photo_url?: string | null
  is_active: boolean
  has_consigned: boolean
  has_pending_proposal: boolean
  created_at: string
  updated_at: string
}

function mapStore(raw: RawStoreResponse): Store {
  return {
    id: raw.id,
    name: raw.name,
    category: (raw.category || 'lainnya') as Store['category'],
    description: raw.description,
    address: raw.address,
    whatsapp: raw.whatsapp,
    latitude: raw.latitude,
    longitude: raw.longitude,
    photoUrl: resolveMediaUrl(raw.photo_url),
    isActive: raw.is_active,
    hasConsigned: raw.has_consigned,
    hasPendingProposal: Boolean(raw.has_pending_proposal),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

/**
 * Hook untuk mengambil daftar toko untuk peta.
 */
export function useStores(filter?: StoreFilter) {
  return useQuery({
    queryKey: ['stores', filter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filter?.category && filter.category !== 'all') {
        params.set('category', filter.category)
      }
      if (filter?.search) {
        params.set('q', filter.search)
      }
      if (filter?.minLat !== undefined) params.set('min_lat', String(filter.minLat))
      if (filter?.maxLat !== undefined) params.set('max_lat', String(filter.maxLat))
      if (filter?.minLng !== undefined) params.set('min_lng', String(filter.minLng))
      if (filter?.maxLng !== undefined) params.set('max_lng', String(filter.maxLng))
      if (filter?.limit) params.set('limit', String(filter.limit))
      if (filter?.offset) params.set('offset', String(filter.offset))

      const queryString = params.toString() ? `?${params.toString()}` : ''
      const res = await apiClient<{ data: RawStoreResponse[] }>(`/v1/stores${queryString}`)
      return (res.data || []).map(mapStore)
    },
    staleTime: 1000 * 30, // 30 detik
  })
}

/**
 * Hook untuk mengambil detail toko tertentu.
 */
export function useStoreDetail(storeId: string) {
  return useQuery({
    queryKey: ['store', storeId],
    queryFn: async () => {
      const res = await apiClient<{ data: RawStoreResponse }>(`/v1/stores/${storeId}`)
      return mapStore(res.data)
    },
    enabled: Boolean(storeId),
  })
}

/**
 * Hook untuk mengambil toko milik pengguna saat ini (Pemilik Toko).
 */
export function useMyStore() {
  return useQuery({
    queryKey: ['store', 'mine'],
    queryFn: async () => {
      const res = await apiClient<{ data: RawStoreResponse }>('/v1/stores/mine')
      return mapStore(res.data)
    },
    staleTime: 1000 * 60,
  })
}

/**
 * Hook untuk mengupdate data toko milik sendiri.
 */
export function useUpdateMyStore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: StoreInput) => {
      const res = await apiClient<{ data: RawStoreResponse }>('/v1/stores/mine', {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      return mapStore(res.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store', 'mine'] })
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
    },
  })
}

/**
 * Hook untuk mengubah status aktif toko di peta.
 */
export function useSetMyStoreActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (isActive: boolean) => {
      const res = await apiClient<{ data: RawStoreResponse }>('/v1/stores/mine/status', {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive }),
      })
      return mapStore(res.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store', 'mine'] })
      queryClient.invalidateQueries({ queryKey: ['stores'] })
    },
  })
}

/** Unggah (file terkompresi) atau hapus (null) foto toko milik sendiri. */
export function useSetMyStorePhoto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (file: Blob | null) => {
      if (!file) {
        const res = await apiClient<{ data: RawStoreResponse }>('/v1/stores/mine/photo', { method: 'DELETE' })
        return mapStore(res.data)
      }
      const form = new FormData()
      form.append('file', file, 'foto-toko.webp')
      const res = await apiClient<{ data: RawStoreResponse }>('/v1/stores/mine/photo', {
        method: 'PUT',
        body: form,
      })
      return mapStore(res.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store', 'mine'] })
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
    },
  })
}
