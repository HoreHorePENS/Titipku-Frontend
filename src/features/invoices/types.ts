export type InvoiceStatus = 'unpaid' | 'partial' | 'paid'
export type PaymentMethod = 'cash' | 'transfer' | 'qris' | 'other'

export interface InvoiceItem {
  id: string
  productId: string
  productName: string
  prevStock?: number
  remaining: number
  returned: number
  sold: number
  newDrop: number
  stockAfter: number
  unitPrice: number
  subtotal: number
}

export interface Invoice {
  id: string
  partnerId: string
  partnerName: string
  partnerWhatsApp: string
  visitId: string
  visitNumber: string
  visitDate: string
  receivedBy: string
  total: number
  paid: number
  remaining: number
  status: InvoiceStatus
  issuedAt: string
  publicInvoiceUrl?: string
  items?: InvoiceItem[]
  daysOverdue: number
}

export interface OverduePartner {
  partnerId: string
  partnerName: string
  days: number
  amount: number
}

export interface InvoicesMetricSummary {
  totalUnpaidAmount: number
  totalUnpaidPartnersCount: number
  totalUnpaidInvoicesCount: number
  totalCollectedThisMonth: number
  overduePartners: OverduePartner[]
  totalOverdueAmount: number
}

export interface FIFOAllocation {
  invoiceId: string
  visitNumber: string
  issuedAt: string
  allocatedAmount: number
  isFullyPaid: boolean
  remainingOnInvoice: number
}

export interface FIFOPreviewResult {
  allocations: FIFOAllocation[]
  totalPaid: number
  totalRemainingDebt: number
  summaryText: string
}

export interface PaymentPayload {
  client_request_id: string
  partner_id: string
  amount: number
  method: PaymentMethod
  paid_at?: string
  note?: string
}

export interface InvoiceFilterOptions {
  search?: string
  statusFilter?: 'all' | InvoiceStatus
  partnerId?: string
}
