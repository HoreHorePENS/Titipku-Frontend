import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Product, ProductFormInput } from './types'

export interface RawProductResponse {
  id: string
  name: string
  photo_path?: string | null
  consign_price: number
  retail_price: number
  shelf_life_days: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export function mapProductResponse(raw: RawProductResponse): Product {
  return {
    id: raw.id,
    name: raw.name,
    photoPath: raw.photo_path,
    consignPrice: raw.consign_price,
    retailPrice: raw.retail_price,
    shelfLifeDays: raw.shelf_life_days,
    isActive: raw.is_active,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

/**
 * Hook untuk mengambil daftar seluruh produk katalog dari backend.
 */
export function useCatalogProducts(activeOnly = false) {
  return useQuery({
    queryKey: ['catalog-products', { activeOnly }],
    queryFn: async () => {
      const url = activeOnly ? '/v1/products?active=true' : '/v1/products'
      const res = await apiClient<{ data: RawProductResponse[] }>(url)
      const list = res.data || []
      return list.map(mapProductResponse)
    },
    staleTime: 1000 * 30, // 30 detik
  })
}

/**
 * Hook untuk menambah produk baru ke katalog (Create).
 */
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ProductFormInput) => {
      const res = await apiClient<{ data: RawProductResponse }>('/v1/products', {
        method: 'POST',
        body: JSON.stringify({
          name: payload.name,
          photo_path: payload.photo_path || '',
          consign_price: payload.consign_price,
          retail_price: payload.retail_price,
          shelf_life_days: payload.shelf_life_days,
          is_active: payload.is_active ?? true,
        }),
      })
      return mapProductResponse(res.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

/**
 * Hook untuk memperbarui data produk katalog (Update).
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductFormInput }) => {
      const res = await apiClient<{ data: RawProductResponse }>(`/v1/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: data.name,
          photo_path: data.photo_path || '',
          consign_price: data.consign_price,
          retail_price: data.retail_price,
          shelf_life_days: data.shelf_life_days,
          is_active: data.is_active ?? true,
        }),
      })
      return mapProductResponse(res.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

/**
 * Hook untuk mengaktifkan / menonaktifkan produk (Soft Delete / Toggle Status).
 */
export function useSetProductActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiClient<{ data: RawProductResponse }>(`/v1/products/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive }),
      })
      return mapProductResponse(res.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}
