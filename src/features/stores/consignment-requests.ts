import { useMemo } from 'react'
import { useProposalAction, useProposals, type Proposal } from './proposals-api'

export interface ConsignmentRequestItem {
  id: string
  productName: string
  photoUrl: string | null
  qty: number
  consignPrice: number
  suggestedRetailPrice: number
  shelfLifeDays: number
}

/**
 * Penitip yang berhubungan dengan toko yang sedang login:
 * - pengajuan titip dari penitip (semua status kecuali dibatalkan), dan
 * - tawaran toko yang sudah diterima penitip (menjadi mitra aktif).
 */
export interface ConsignmentRequest {
  id: string
  /** 'request' = pengajuan dari penitip; 'offer' = tawaran toko yang diterima. */
  origin: 'request' | 'offer'
  producerBusinessId: string
  producerBusinessName: string
  producerOwnerName: string
  producerWhatsapp: string | null
  producerAddress: string | null
  submittedAt: string
  respondedAt: string | null
  status: 'pending' | 'accepted' | 'rejected'
  note: string | null
  items: ConsignmentRequestItem[]
}

export function toConsignmentRequest(proposal: Proposal): ConsignmentRequest {
  return {
    id: proposal.id,
    origin: proposal.direction === 'penitip_to_store' ? 'request' : 'offer',
    producerBusinessId: proposal.business.id,
    producerBusinessName: proposal.business.name,
    producerOwnerName: proposal.business.ownerName,
    producerWhatsapp: proposal.business.whatsapp,
    producerAddress: proposal.business.address,
    submittedAt: proposal.createdAt,
    respondedAt: proposal.respondedAt,
    status: proposal.status as ConsignmentRequest['status'],
    note: proposal.message,
    items: proposal.items.map((item) => ({
      id: item.productId,
      productName: item.name,
      photoUrl: item.photoUrl,
      qty: item.qty,
      consignPrice: item.consignPrice,
      suggestedRetailPrice: item.retailPrice,
      shelfLifeDays: item.shelfLifeDays,
    })),
  }
}

function isStoreSideEntry(proposal: Proposal): boolean {
  if (proposal.status === 'cancelled') return false
  if (proposal.direction === 'penitip_to_store') return true
  return proposal.status === 'accepted'
}

/** Pengajuan & mitra penitip untuk pemilik toko (data asli). */
export function useConsignmentRequests(enabled = true) {
  const query = useProposals(enabled)
  const action = useProposalAction()

  const requests = useMemo(
    () => (query.data ?? []).filter(isStoreSideEntry).map(toConsignmentRequest),
    [query.data]
  )

  return {
    requests,
    pendingCount: requests.filter((r) => r.status === 'pending').length,
    acceptedCount: requests.filter((r) => r.status === 'accepted').length,
    rejectedCount: requests.filter((r) => r.status === 'rejected').length,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateRequestStatus: (requestId: string, status: 'accepted' | 'rejected') =>
      action.mutateAsync({ id: requestId, action: status === 'accepted' ? 'accept' : 'reject' }),
    isUpdating: action.isPending,
    updatingId: action.isPending ? action.variables?.id : undefined,
  }
}

export const REQUEST_STATUS_LABEL: Record<ConsignmentRequest['status'], string> = {
  pending: 'Menunggu persetujuan',
  accepted: 'Mitra aktif',
  rejected: 'Ditolak',
}

export function formatRequestDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
