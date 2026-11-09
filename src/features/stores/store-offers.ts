import { useMemo } from 'react'
import { useProposalAction, useProposals, type Proposal } from './proposals-api'

/** Tawaran dari pemilik toko yang diterima penitip. */
export interface StoreOffer {
  id: string
  storeId: string
  storeName: string
  storeCategory: string
  storeOwnerName: string
  storeWhatsapp: string
  storeAddress: string
  storePhotoUrl: string | null
  message: string | null
  shelfLocation: string | null
  estimatedCapacity: string | null
  offeredAt: string
  status: 'pending' | 'accepted' | 'rejected'
  respondedAt: string | null
}

export function toStoreOffer(proposal: Proposal): StoreOffer {
  return {
    id: proposal.id,
    storeId: proposal.store.id,
    storeName: proposal.store.name,
    storeCategory: proposal.store.category,
    storeOwnerName: proposal.store.ownerName,
    storeWhatsapp: proposal.store.whatsapp,
    storeAddress: proposal.store.address,
    storePhotoUrl: proposal.store.photoUrl,
    message: proposal.message,
    shelfLocation: proposal.shelfLocation,
    estimatedCapacity: proposal.estimatedCapacity,
    offeredAt: proposal.createdAt,
    status: proposal.status as StoreOffer['status'],
    respondedAt: proposal.respondedAt,
  }
}

/** Tawaran masuk untuk penitip (data asli; tawaran yang dibatalkan toko tidak ditampilkan). */
export function useStoreOffers(enabled = true) {
  const query = useProposals(enabled)
  const action = useProposalAction()

  const offers = useMemo(
    () =>
      (query.data ?? [])
        .filter((p) => p.direction === 'store_to_penitip' && p.status !== 'cancelled')
        .map(toStoreOffer),
    [query.data]
  )
  const pendingOffers = offers.filter((o) => o.status === 'pending')

  return {
    offers,
    pendingOffers,
    acceptedOffers: offers.filter((o) => o.status === 'accepted'),
    rejectedOffers: offers.filter((o) => o.status === 'rejected'),
    pendingCount: pendingOffers.length,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    approveOffer: (offerId: string) => action.mutateAsync({ id: offerId, action: 'accept' }),
    rejectOffer: (offerId: string) => action.mutateAsync({ id: offerId, action: 'reject' }),
    isResponding: action.isPending,
    respondingId: action.isPending ? action.variables?.id : undefined,
  }
}
