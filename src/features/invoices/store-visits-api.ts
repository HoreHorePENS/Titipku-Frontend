import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { VisitRecord } from '@/features/visit/types'

export interface StoreVisitItemInput {
  productId: string
  remaining: number
  returned: number
  newDrop: number
}

export interface StoreVisitPaymentInput {
  amount: number
  method: 'cash' | 'transfer' | 'qris'
}

export interface CreateStoreVisitInput {
  proposalId?: string
  businessId?: string
  receivedBy?: string
  visitedAt?: string
  items: StoreVisitItemInput[]
  payment?: StoreVisitPaymentInput
}

interface RawStoreVisitResponse {
  data: {
    id: string
    number: string
    business_name: string
    partner_id: string
    partner_name: string
    partner_whatsapp?: string
    visited_at: string
    received_by: string
    total: number
    public_token?: string
    public_invoice_url?: string
    whatsapp_url?: string
    items?: Array<{
      id?: string
      product_id: string
      product_name: string
      prev_stock?: number
      remaining: number
      returned: number
      new_drop: number
      sold: number
      stock_after: number
      unit_price: number
      subtotal: number
    }>
  }
}

export function useCreateStoreVisit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateStoreVisitInput) => {
      const res = await apiClient<RawStoreVisitResponse>('/v1/store-visits', {
        method: 'POST',
        body: JSON.stringify({
          proposal_id: input.proposalId,
          business_id: input.businessId,
          received_by: input.receivedBy,
          visited_at: input.visitedAt,
          items: input.items.map((it) => ({
            product_id: it.productId,
            remaining: it.remaining,
            returned: it.returned,
            new_drop: it.newDrop,
          })),
          payment: input.payment
            ? {
                amount: input.payment.amount,
                method: input.payment.method,
              }
            : undefined,
        }),
      })
      const v = res.data
      const record: VisitRecord = {
        id: v.id,
        number: v.number,
        businessName: v.business_name,
        partnerId: v.partner_id,
        partnerName: v.partner_name,
        partnerWhatsApp: v.partner_whatsapp,
        visitedAt: v.visited_at,
        receivedBy: v.received_by,
        total: v.total,
        paid: input.payment ? input.payment.amount : 0,
        status: input.payment && input.payment.amount >= v.total ? 'paid' : 'unpaid',
        publicToken: v.public_token,
        publicInvoiceUrl: v.public_invoice_url,
        whatsappUrl: v.whatsapp_url,
        items: (v.items || []).map((it) => ({
          id: it.id,
          productId: it.product_id,
          productName: it.product_name,
          prevStock: it.prev_stock ?? 0,
          remaining: it.remaining,
          returned: it.returned,
          newDrop: it.new_drop,
          sold: it.sold,
          stockAfter: it.stock_after,
          unitPrice: it.unit_price,
          subtotal: it.subtotal,
        })),
      }
      return record
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['store-visits'] })
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
