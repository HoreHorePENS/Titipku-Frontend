import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { DashboardData, PartnerRecord } from './types'

export async function fetchDashboard(date?: string): Promise<DashboardData> {
  const query = date ? `?date=${encodeURIComponent(date)}` : ''
  const response = await apiClient<{ data: DashboardData }>(`/v1/dashboard${query}`)
  return response.data
}

export function useDashboard(date?: string, enabled = true) {
  return useQuery({
    queryKey: ['dashboard', date || 'today'],
    queryFn: () => fetchDashboard(date),
    staleTime: 1000 * 60, // 1 menit
    enabled,
  })
}

export async function fetchPartners(): Promise<PartnerRecord[]> {
  const response = await apiClient<{ data: PartnerRecord[] }>('/v1/partners?active=true')
  return response.data || []
}

export function usePartners(enabled = true) {
  return useQuery({
    queryKey: ['partners', 'active'],
    queryFn: fetchPartners,
    staleTime: 1000 * 60 * 5, // 5 menit
    enabled,
  })
}
