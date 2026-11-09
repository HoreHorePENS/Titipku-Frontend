export type PaymentStatus = 'paid' | 'partial' | 'unpaid'
export type PaymentMethod = 'cash' | 'transfer' | 'qris' | 'other'

export interface VisitItem {
  id?: string
  productId: string
  productName: string
  prevStock: number
  remaining: number
  returned: number
  newDrop: number
  sold: number
  stockAfter: number
  unitPrice: number
  subtotal: number
}

export interface VisitRecord {
  id: string
  number: string
  businessName?: string
  partnerId: string
  partnerName: string
  partnerArea?: string
  partnerOwnerName?: string
  partnerWhatsApp?: string
  visitedAt: string // ISO string WIB
  receivedBy: string
  total: number
  paid: number
  status: PaymentStatus
  publicToken?: string
  publicInvoiceUrl?: string
  whatsappUrl?: string
  items: VisitItem[]
}

export interface GroupedVisits {
  dateKey: string
  dateHeaderMobile: string
  dateHeaderDesktop: string
  visits: VisitRecord[]
}

export interface VisitFilterOptions {
  partnerId?: string
  dateRange?: string
  search?: string
}

export interface PartnerOption {
  id: string
  name: string
  ownerName?: string
  whatsapp?: string
  area?: string
  receivable?: number
}

export interface ProductCatalogItem {
  id: string
  name: string
  consignPrice: number
  retailPrice: number
  shelfLifeDays: number
  isActive: boolean
}

export interface VisitItemInput {
  productId: string
  productName: string
  consignPrice: number
  prevStock: number
  remaining: number
  returned: number
  newDrop: number
}

export interface CreateVisitPayload {
  client_request_id: string
  partner_id: string
  visited_at?: string
  received_by?: string
  items: Array<{
    product_id: string
    remaining: number
    returned: number
    new_drop: number
  }>
  payment?: {
    client_request_id: string
    amount: number
    method: PaymentMethod
    paid_at?: string
  }
}

export interface CreatedVisitResult {
  id: string
  number: string
  businessName: string
  partnerId: string
  partnerName: string
  partnerOwnerName: string
  partnerWhatsApp: string
  visitedAt: string
  receivedBy: string
  total: number
  publicToken?: string
  publicInvoiceUrl?: string
  whatsappUrl?: string
  items: VisitItem[]
}

export interface PublicInvoiceItem {
  product_name: string
  remaining: number
  returned: number
  new_drop: number
  sold: number
  stock_after: number
  unit_price: number
  subtotal: number
}

export interface PublicInvoiceData {
  business: {
    name: string
    owner_name: string
    whatsapp?: string
  }
  partner: {
    name: string
    owner_name: string
    whatsapp?: string
  }
  visit_number: string
  visit_date: string
  received_by: string
  items: PublicInvoiceItem[]
  total: number
  paid: number
  remaining: number
  status: PaymentStatus
}
