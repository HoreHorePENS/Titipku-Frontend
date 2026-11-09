import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { generateUUID } from '@/lib/uuid'
import type { Store, StoreFilter, StoreInput, ConsignToStoreInput } from './types'

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
    photoUrl: raw.photo_url,
    isActive: raw.is_active,
    hasConsigned: raw.has_consigned,
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

/**
 * Hook untuk penitip menitipkan barang ke toko:
 * 1. Hubungkan toko sebagai mitra partner (POST /v1/partners dengan store_id)
 * 2. Jika ada barang titipan awal yang dipilih, langsung rekam kunjungan titipan pertama (POST /v1/visits)
 */
export function useConsignToStore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ConsignToStoreInput) => {
      // 1. Tambahkan toko sebagai partner mitra konsinyasi
      const partnerRes = await apiClient<{ data: { id: string; name: string } }>('/v1/partners', {
        method: 'POST',
        body: JSON.stringify({
          name: input.storeName,
          owner_name: input.ownerName || input.storeName,
          whatsapp: input.whatsapp,
          address: input.address,
          store_id: input.storeId,
          is_active: true,
        }),
      })

      const partnerId = partnerRes.data.id

      // 2. Jika ada barang titipan awal, submit initial visit drop
      if (input.items && input.items.length > 0) {
        await apiClient('/v1/visits', {
          method: 'POST',
          body: JSON.stringify({
            client_request_id: generateUUID(),
            partner_id: partnerId,
            items: input.items.map((item) => ({
              product_id: item.productId,
              remaining: 0,
              returned: 0,
              new_drop: item.qty,
            })),
          }),
        })
      }

      return { partnerId, storeId: input.storeId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] })
      queryClient.invalidateQueries({ queryKey: ['partners'] })
      queryClient.invalidateQueries({ queryKey: ['visits'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['partner-options'] })
    },
  })
}
