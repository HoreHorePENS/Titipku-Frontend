import { useMemo } from 'react'
import { resolveMediaUrl } from '@/lib/api-client'
import {
  useCreateOffer,
  useProducers,
  useProposalAction,
  type CreateOfferInput,
  type RawProducer,
} from './proposals-api'

/** Produk penitip yang ditampilkan ke pemilik toko. */
export interface PenitipProductItem {
  id: string
  name: string
  photoUrl: string | null
  consignPrice: number
  suggestedRetailPrice: number
  shelfLifeDays: number
}

/**
 * Status hubungan toko yang melihat dengan penitip:
 * - none: belum ada proposal aktif
 * - pending: tawaran toko menunggu respon penitip
 * - incoming: penitip sudah mengajukan ke toko ini (menunggu respon toko)
 * - accepted: sudah bermitra
 * - rejected: tawaran/pengajuan terakhir ditolak (boleh ditawari lagi)
 */
export type PenitipOfferStatus = 'none' | 'pending' | 'incoming' | 'accepted' | 'rejected'

export interface PenitipBusiness {
  id: string
  businessName: string
  ownerName: string
  address: string | null
  whatsapp: string | null
  productCount: number
  photoUrl: string | null
  topProducts: PenitipProductItem[]
  offerStatus: PenitipOfferStatus
  /** ID proposal terakhir (untuk membatalkan tawaran yang masih pending). */
  offerId?: string
  offerMessage?: string
  offeredAt?: string
}

export function mapProducer(raw: RawProducer): PenitipBusiness {
  const latest = raw.latest_proposal
  let offerStatus: PenitipOfferStatus = 'none'
  if (raw.is_partner) {
    offerStatus = 'accepted'
  } else if (latest?.status === 'pending') {
    offerStatus = latest.direction === 'store_to_penitip' ? 'pending' : 'incoming'
  } else if (latest?.status === 'rejected') {
    offerStatus = 'rejected'
  }

  const topProducts = raw.products.map((p) => ({
    id: p.id,
    name: p.name,
    photoUrl: resolveMediaUrl(p.photo_path),
    consignPrice: p.consign_price,
    suggestedRetailPrice: p.retail_price,
    shelfLifeDays: p.shelf_life_days,
  }))

  return {
    id: raw.id,
    businessName: raw.name,
    ownerName: raw.owner_name,
    address: raw.address,
    whatsapp: raw.whatsapp,
    productCount: raw.product_count,
    photoUrl: topProducts.find((p) => p.photoUrl)?.photoUrl ?? null,
    topProducts,
    offerStatus,
    offerId: latest?.id,
    offerMessage: latest?.message ?? undefined,
    offeredAt: latest?.created_at,
  }
}

/** Katalog produsen penitip (data asli) beserta aksi tawaran untuk pemilik toko. */
export function usePenitipBusinesses(search = '', enabled = true) {
  const query = useProducers(search, enabled)
  const createOffer = useCreateOffer()
  const proposalAction = useProposalAction()

  const businesses = useMemo(() => (query.data ?? []).map(mapProducer), [query.data])

  return {
    businesses,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    sendOfferToPenitip: (input: CreateOfferInput) => createOffer.mutateAsync(input),
    isSendingOffer: createOffer.isPending,
    cancelOffer: (business: PenitipBusiness) =>
      business.offerId
        ? proposalAction.mutateAsync({ id: business.offerId, action: 'cancel' })
        : Promise.resolve(undefined),
    isCancelling: proposalAction.isPending,
    pendingOffersCount: businesses.filter((b) => b.offerStatus === 'pending').length,
    acceptedOffersCount: businesses.filter((b) => b.offerStatus === 'accepted').length,
  }
}
