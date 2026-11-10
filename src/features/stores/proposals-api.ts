import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient, resolveMediaUrl } from '@/lib/api-client'
import type { RawProductResponse } from '@/features/catalog/api'

/**
 * Proposal kemitraan dua arah (lihat backend docs/api-errors.md & README):
 * - store_to_penitip = "tawaran" dari pemilik toko ke penitip
 * - penitip_to_store = "pengajuan" titip-jual dari penitip ke toko
 */
export type ProposalDirection = 'store_to_penitip' | 'penitip_to_store'
export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'

export interface RawProposal {
  id: string
  direction: ProposalDirection
  status: ProposalStatus
  message: string | null
  shelf_location: string | null
  estimated_capacity: string | null
  created_at: string
  responded_at: string | null
  store: {
    id: string
    name: string
    category: string
    address: string
    whatsapp: string
    photo_url: string | null
    owner_name: string
    latitude: number
    longitude: number
  }
  business: {
    id: string
    name: string
    owner_name: string
    whatsapp: string | null
    address: string | null
  }
  items: {
    product_id: string
    name: string
    photo_path: string | null
    consign_price: number
    retail_price: number
    shelf_life_days: number
    qty: number
  }[]
}

export interface RawProducer {
  id: string
  name: string
  owner_name: string
  whatsapp: string | null
  address: string | null
  product_count: number
  products: RawProductResponse[]
  is_partner: boolean
  latest_proposal: RawProposal | null
}

export interface ProposalItem {
  productId: string
  name: string
  photoUrl: string | null
  consignPrice: number
  retailPrice: number
  shelfLifeDays: number
  qty: number
}

export interface Proposal {
  id: string
  direction: ProposalDirection
  status: ProposalStatus
  message: string | null
  shelfLocation: string | null
  estimatedCapacity: string | null
  createdAt: string
  respondedAt: string | null
  store: {
    id: string
    name: string
    category: string
    address: string
    whatsapp: string
    photoUrl: string | null
    ownerName: string
    latitude: number
    longitude: number
  }
  business: {
    id: string
    name: string
    ownerName: string
    whatsapp: string | null
    address: string | null
  }
  items: ProposalItem[]
}

export function mapProposal(raw: RawProposal): Proposal {
  return {
    id: raw.id,
    direction: raw.direction,
    status: raw.status,
    message: raw.message,
    shelfLocation: raw.shelf_location,
    estimatedCapacity: raw.estimated_capacity,
    createdAt: raw.created_at,
    respondedAt: raw.responded_at,
    store: {
      id: raw.store.id,
      name: raw.store.name,
      category: raw.store.category,
      address: raw.store.address,
      whatsapp: raw.store.whatsapp,
      photoUrl: resolveMediaUrl(raw.store.photo_url),
      ownerName: raw.store.owner_name,
      latitude: raw.store.latitude,
      longitude: raw.store.longitude,
    },
    business: {
      id: raw.business.id,
      name: raw.business.name,
      ownerName: raw.business.owner_name,
      whatsapp: raw.business.whatsapp,
      address: raw.business.address,
    },
    items: (raw.items ?? []).map((item) => ({
      productId: item.product_id,
      name: item.name,
      photoUrl: resolveMediaUrl(item.photo_path),
      consignPrice: item.consign_price,
      retailPrice: item.retail_price,
      shelfLifeDays: item.shelf_life_days,
      qty: item.qty,
    })),
  }
}

export const proposalKeys = {
  all: ['proposals'] as const,
  producers: (search: string) => ['producers', search] as const,
}

/** Semua proposal yang melibatkan akun yang sedang login (sebagai toko atau penitip). */
export function useProposals(enabled = true) {
  return useQuery({
    queryKey: proposalKeys.all,
    queryFn: async () => {
      const res = await apiClient<{ data: RawProposal[] }>('/v1/proposals')
      return (res.data ?? []).map(mapProposal)
    },
    enabled,
    staleTime: 1000 * 20,
    refetchInterval: 1000 * 60,
  })
}

/** Katalog produsen penitip untuk pemilik toko (hanya yang punya produk aktif). */
export function useProducers(search = '', enabled = true) {
  const term = search.trim()
  return useQuery({
    queryKey: proposalKeys.producers(term),
    queryFn: async () => {
      const query = term ? `?q=${encodeURIComponent(term)}` : ''
      const res = await apiClient<{ data: RawProducer[] }>(`/v1/producers${query}`)
      return res.data ?? []
    },
    enabled,
    staleTime: 1000 * 30,
  })
}

export interface CreateOfferInput {
  businessId: string
  message?: string
  shelfLocation?: string
  estimatedCapacity?: string
}

export interface CreateRequestInput {
  storeId: string
  message?: string
  items: { productId: string; qty: number }[]
}

function useInvalidateProposals() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: proposalKeys.all })
    queryClient.invalidateQueries({ queryKey: ['producers'] })
    queryClient.invalidateQueries({ queryKey: ['stores'] })
    queryClient.invalidateQueries({ queryKey: ['partners'] })
    queryClient.invalidateQueries({ queryKey: ['partner-options'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }
}

/** Pemilik toko mengirim tawaran ke penitip. */
export function useCreateOffer() {
  const invalidate = useInvalidateProposals()
  return useMutation({
    mutationFn: async (input: CreateOfferInput) => {
      const res = await apiClient<{ data: RawProposal }>('/v1/proposals', {
        method: 'POST',
        body: JSON.stringify({
          business_id: input.businessId,
          message: input.message?.trim() ?? '',
          shelf_location: input.shelfLocation?.trim() ?? '',
          estimated_capacity: input.estimatedCapacity?.trim() ?? '',
        }),
      })
      return mapProposal(res.data)
    },
    onSuccess: invalidate,
  })
}

/** Penitip mengajukan titip-jual ke toko (dengan rencana produk). */
export function useCreateConsignmentRequest() {
  const invalidate = useInvalidateProposals()
  return useMutation({
    mutationFn: async (input: CreateRequestInput) => {
      const res = await apiClient<{ data: RawProposal }>('/v1/proposals', {
        method: 'POST',
        body: JSON.stringify({
          store_id: input.storeId,
          message: input.message?.trim() ?? '',
          items: input.items.map((item) => ({ product_id: item.productId, qty: item.qty })),
        }),
      })
      return mapProposal(res.data)
    },
    onSuccess: invalidate,
  })
}

export type ProposalAction = 'accept' | 'reject' | 'cancel'

export interface ProposalActionInput {
  id: string
  action: ProposalAction
  items?: { productId: string; qty: number }[]
}

/** Setujui / tolak (penerima) atau batalkan (pengirim) proposal. Mendukung partial approval bila items diisi. */
export function useProposalAction() {
  const invalidate = useInvalidateProposals()
  return useMutation({
    mutationFn: async ({ id, action, items }: ProposalActionInput) => {
      const body = items && items.length > 0 ? JSON.stringify({ items: items.map(it => ({ product_id: it.productId, qty: it.qty })) }) : undefined
      const res = await apiClient<{ data: RawProposal }>(`/v1/proposals/${id}/${action}`, {
        method: 'POST',
        body,
      })
      return mapProposal(res.data)
    },
    onSuccess: invalidate,
  })
}

/** Penitip mengirimkan atau memperbarui daftar produk untuk tawaran kemitraan. */
export function useSetProposalItems() {
  const invalidate = useInvalidateProposals()
  return useMutation({
    mutationFn: async ({ proposalId, items }: { proposalId: string; items: { productId: string; qty: number }[] }) => {
      const res = await apiClient<{ data: RawProposal }>(`/v1/proposals/${proposalId}/items`, {
        method: 'POST',
        body: JSON.stringify({
          items: items.map((it) => ({ product_id: it.productId, qty: it.qty })),
        }),
      })
      return mapProposal(res.data)
    },
    onSuccess: invalidate,
  })
}
