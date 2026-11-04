import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { calculateDaysOverdue } from './calc'
import type { Invoice, PaymentPayload } from './types'

interface RawInvoiceResponse {
  id: string
  partner_id: string
  partner_name: string
  partner_whatsapp: string
  visit_id: string
  visit_number: string
  visit_date: string
  received_by: string
  total: number
  paid: number
  remaining: number
  status: 'unpaid' | 'partial' | 'paid'
  issued_at: string
  public_invoice_url?: string
}

interface RawPaymentResponse {
  id: string
  partner_id: string
  partner_name: string
  amount: number
  method: string
  paid_at: string
  is_void: boolean
}

function mapInvoice(raw: RawInvoiceResponse): Invoice {
  const issuedAt = raw.issued_at || raw.visit_date
  return {
    id: raw.id,
    partnerId: raw.partner_id,
    partnerName: raw.partner_name,
    partnerWhatsApp: raw.partner_whatsapp,
    visitId: raw.visit_id,
    visitNumber: raw.visit_number,
    visitDate: raw.visit_date,
    receivedBy: raw.received_by,
    total: raw.total,
    paid: raw.paid || 0,
    remaining: raw.remaining,
    status: raw.status,
    issuedAt,
    publicInvoiceUrl: raw.public_invoice_url,
    daysOverdue: calculateDaysOverdue(issuedAt),
  }
}

/**
 * Hook untuk mengambil daftar nota tagihan dari backend.
 */
export function useInvoices(filters?: { status?: string; partnerId?: string }) {
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.status && filters.status !== 'all') {
        params.set('status', filters.status)
      }
      if (filters?.partnerId && filters.partnerId !== 'all') {
        params.set('partner_id', filters.partnerId)
      }
      params.set('limit', '100')

      const queryString = params.toString() ? `?${params.toString()}` : ''
      const res = await apiClient<{ data: RawInvoiceResponse[] }>(`/v1/invoices${queryString}`)
      const list = res.data || []
      return list.map(mapInvoice)
    },
    staleTime: 1000 * 20, // 20 detik
  })
}

/**
 * Hook untuk mencatat pembayaran baru (Create Payment - FIFO).
 */
export function useCreatePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: PaymentPayload) => {
      const res = await apiClient<{ data: RawPaymentResponse }>('/v1/payments', {
        method: 'POST',
        body: JSON.stringify({
          client_request_id: payload.client_request_id,
          partner_id: payload.partner_id,
          amount: payload.amount,
          method: payload.method,
          paid_at: payload.paid_at,
        }),
      })
      return res.data
    },
    onSuccess: () => {
      // Invalidate query invoices, dashboard, partners, dan visits
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['partners'] })
      queryClient.invalidateQueries({ queryKey: ['visits'] })
    },
  })
}
