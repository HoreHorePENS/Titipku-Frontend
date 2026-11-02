import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Partner, PartnerFormInput } from './types'

interface RawPartnerResponse {
  id: string
  name: string
  owner_name: string
  whatsapp: string
  address?: string | null
  is_active: boolean
  receivable: number
  created_at?: string
  updated_at?: string
}

function mapPartnerResponse(raw: RawPartnerResponse): Partner {
  return {
    id: raw.id,
    name: raw.name,
    ownerName: raw.owner_name,
    whatsapp: raw.whatsapp,
    address: raw.address,
    isActive: raw.is_active,
    receivable: raw.receivable || 0,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

/**
 * Hook untuk mengambil daftar seluruh warung mitra dari backend.
 */
export function usePartners(activeOnly = false) {
  return useQuery({
    queryKey: ['partners', { activeOnly }],
    queryFn: async () => {
      const url = activeOnly ? '/v1/partners?active=true' : '/v1/partners'
      const res = await apiClient<{ data: RawPartnerResponse[] }>(url)
      const list = res.data || []
      return list.map(mapPartnerResponse)
    },
    staleTime: 1000 * 30, // 30 detik
  })
}

/**
 * Hook untuk menambah warung mitra baru (Create).
 */
export function useCreatePartner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: PartnerFormInput) => {
      const res = await apiClient<{ data: RawPartnerResponse }>('/v1/partners', {
        method: 'POST',
        body: JSON.stringify({
          name: payload.name,
          owner_name: payload.owner_name,
          whatsapp: payload.whatsapp,
          address: payload.address,
          is_active: payload.is_active ?? true,
        }),
      })
      return mapPartnerResponse(res.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['partner-options'] })
    },
  })
}

/**
 * Hook untuk memperbarui data warung mitra (Update).
 */
export function useUpdatePartner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PartnerFormInput }) => {
      const res = await apiClient<{ data: RawPartnerResponse }>(`/v1/partners/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: data.name,
          owner_name: data.owner_name,
          whatsapp: data.whatsapp,
          address: data.address,
          is_active: data.is_active ?? true,
        }),
      })
      return mapPartnerResponse(res.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['partner-options'] })
    },
  })
}

/**
 * Hook untuk mengaktifkan / menonaktifkan status warung mitra.
 */
export function useSetPartnerActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiClient<{ data: RawPartnerResponse }>(`/v1/partners/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          is_active: isActive,
        }),
      })
      return mapPartnerResponse(res.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partners'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['partner-options'] })
    },
  })
}
