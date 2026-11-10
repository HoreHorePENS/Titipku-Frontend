import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type {
  VisitRecord,
  VisitItem,
  PartnerOption,
  PaymentStatus,
  ProductCatalogItem,
  CreateVisitPayload,
  CreatedVisitResult,
  PublicInvoiceData,
} from './types'

interface BackendProduct {
  id: string
  name: string
  consign_price: number
  retail_price: number
  shelf_life_days: number
  is_active: boolean
}

interface BackendVisitItem {
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
}

interface BackendVisit {
  id: string
  number: string
  business_name?: string
  partner_id: string
  partner_name: string
  partner_owner_name?: string
  partner_whatsapp?: string
  visited_at: string
  received_by: string
  total: number
  public_token?: string
  public_invoice_url?: string
  whatsapp_url?: string
  items?: BackendVisitItem[]
  created_at: string
}

interface BackendInvoice {
  id: string
  visit_id: string
  visit_number: string
  total: number
  paid: number
  remaining: number
  status: PaymentStatus
}

interface BackendPartner {
  id: string
  name: string
  owner_name: string
  whatsapp: string
  address?: string | null
  is_active: boolean
  receivable: number
}

// ============================================================================
// 1. PRODUCTS & CATALOG
// ============================================================================

export async function fetchProducts(): Promise<ProductCatalogItem[]> {
  const response = await apiClient<{ data: BackendProduct[] }>('/v1/products?active=true')
  const prods = response.data || []
  return prods.map((p) => ({
    id: p.id,
    name: p.name,
    consignPrice: p.consign_price,
    retailPrice: p.retail_price,
    shelfLifeDays: p.shelf_life_days,
    isActive: p.is_active,
  }))
}

export function useProducts() {
  return useQuery({
    queryKey: ['products', 'active'],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5,
  })
}

// ============================================================================
// 2. PARTNERS / WARUNG MITRA
// ============================================================================

export async function fetchPartnerOptions(): Promise<PartnerOption[]> {
  try {
    const response = await apiClient<{ data: BackendPartner[] }>('/v1/partners?active=true')
    const partners = response.data || []
    return [
      { id: 'all', name: 'Semua warung' },
      ...partners.map((p) => ({
        id: p.id,
        name: p.name,
        ownerName: p.owner_name,
        whatsapp: p.whatsapp,
        receivable: p.receivable,
        area: p.address ? p.address.split(',')[0].trim() : undefined,
      })),
    ]
  } catch (error) {
    console.error('Gagal mengambil daftar mitra warung:', error)
    return [{ id: 'all', name: 'Semua warung' }]
  }
}

export function usePartnerOptions() {
  return useQuery({
    queryKey: ['partner-options'],
    queryFn: fetchPartnerOptions,
    staleTime: 1000 * 60 * 5,
  })
}

// ============================================================================
// 3. VISITS LIST & DETAIL (BUKTI NOTA PENJUALAN)
// ============================================================================

export async function fetchVisits(partnerId?: string): Promise<VisitRecord[]> {
  const query = partnerId && partnerId !== 'all' ? `?partner_id=${encodeURIComponent(partnerId)}` : ''

  const [visitsRes, invoicesRes, partnersRes] = await Promise.all([
    apiClient<{ data: BackendVisit[] }>(`/v1/visits${query}`),
    apiClient<{ data: BackendInvoice[] }>('/v1/invoices').catch(() => ({ data: [] })),
    apiClient<{ data: BackendPartner[] }>('/v1/partners').catch(() => ({ data: [] })),
  ])

  const basicVisits = visitsRes.data || []
  const invoices = invoicesRes.data || []
  const partners = partnersRes.data || []

  const partnerAreaMap = new Map<string, string>()
  partners.forEach((p) => {
    if (p.address) {
      partnerAreaMap.set(p.id, p.address.split(',')[0].trim())
    }
  })

  const invoiceMap = new Map<string, BackendInvoice>()
  invoices.forEach((inv) => {
    invoiceMap.set(inv.visit_id, inv)
  })

  const backendRecords: VisitRecord[] = basicVisits.map((v) => {
    const invoice = invoiceMap.get(v.id)
    const status: PaymentStatus = invoice ? invoice.status : v.total === 0 ? 'paid' : 'unpaid'
    const paid = invoice ? invoice.paid : 0

    const items: VisitItem[] = (v.items || []).map((item) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      prevStock: item.prev_stock ?? 0,
      remaining: item.remaining,
      returned: item.returned,
      newDrop: item.new_drop,
      sold: item.sold,
      stockAfter: item.stock_after,
      unitPrice: item.unit_price,
      subtotal: item.subtotal,
    }))

    return {
      id: v.id,
      number: v.number,
      businessName: v.business_name,
      partnerId: v.partner_id,
      partnerName: v.partner_name,
      partnerArea: partnerAreaMap.get(v.partner_id) || '',
      partnerOwnerName: v.partner_owner_name,
      partnerWhatsApp: v.partner_whatsapp,
      visitedAt: v.visited_at,
      receivedBy: v.received_by,
      total: v.total,
      paid,
      status,
      publicToken: v.public_token,
      publicInvoiceUrl: v.public_invoice_url,
      whatsappUrl: v.whatsapp_url,
      items,
    }
  })

  return backendRecords.sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime())
}

export function useVisits(partnerId?: string, enabled = true) {
  return useQuery({
    queryKey: ['visits', partnerId || 'all'],
    queryFn: () => fetchVisits(partnerId),
    staleTime: 1000 * 60 * 2, // 2 menit
    enabled,
  })
}

export async function fetchVisitDetail(visitId: string): Promise<VisitRecord> {
  const [res, invoicesRes, partnersRes] = await Promise.all([
    apiClient<{ data: BackendVisit }>(`/v1/visits/${visitId}`),
    apiClient<{ data: BackendInvoice[] }>('/v1/invoices').catch(() => ({ data: [] })),
    apiClient<{ data: BackendPartner[] }>('/v1/partners').catch(() => ({ data: [] })),
  ])

  const v = res.data
  const invoice = (invoicesRes.data || []).find((inv) => inv.visit_id === v.id)
  const partner = (partnersRes.data || []).find((p) => p.id === v.partner_id)

  const items: VisitItem[] = (v.items || []).map((item) => ({
    id: item.id,
    productId: item.product_id,
    productName: item.product_name,
    prevStock: item.prev_stock ?? 0,
    remaining: item.remaining,
    returned: item.returned,
    newDrop: item.new_drop,
    sold: item.sold,
    stockAfter: item.stock_after,
    unitPrice: item.unit_price,
    subtotal: item.subtotal,
  }))

  return {
    id: v.id,
    number: v.number,
    businessName: v.business_name,
    partnerId: v.partner_id,
    partnerName: v.partner_name,
    partnerArea: partner?.address ? partner.address.split(',')[0].trim() : '',
    partnerOwnerName: v.partner_owner_name,
    partnerWhatsApp: v.partner_whatsapp,
    visitedAt: v.visited_at,
    receivedBy: v.received_by,
    total: v.total,
    paid: invoice ? invoice.paid : 0,
    status: invoice ? invoice.status : v.total === 0 ? 'paid' : 'unpaid',
    publicToken: v.public_token,
    publicInvoiceUrl: v.public_invoice_url,
    whatsappUrl: v.whatsapp_url,
    items,
  }
}

export function useVisitDetail(visitId: string | null | undefined) {
  return useQuery({
    queryKey: ['visit-detail', visitId],
    queryFn: () => fetchVisitDetail(visitId!),
    enabled: Boolean(visitId),
  })
}

// ============================================================================
// 4. CREATE VISIT MUTATION
// ============================================================================

export async function submitVisit(payload: CreateVisitPayload): Promise<CreatedVisitResult> {
  const response = await apiClient<{ data: BackendVisit }>('/v1/visits', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const v = response.data
  const items: VisitItem[] = (v.items || []).map((item) => ({
    id: item.id,
    productId: item.product_id,
    productName: item.product_name,
    prevStock: item.prev_stock ?? 0,
    remaining: item.remaining,
    returned: item.returned,
    newDrop: item.new_drop,
    sold: item.sold,
    stockAfter: item.stock_after,
    unitPrice: item.unit_price,
    subtotal: item.subtotal,
  }))

  return {
    id: v.id,
    number: v.number,
    businessName: v.business_name || '',
    partnerId: v.partner_id,
    partnerName: v.partner_name,
    partnerOwnerName: v.partner_owner_name || '',
    partnerWhatsApp: v.partner_whatsapp || '',
    visitedAt: v.visited_at,
    receivedBy: v.received_by,
    total: v.total,
    publicToken: v.public_token,
    publicInvoiceUrl: v.public_invoice_url,
    whatsappUrl: v.whatsapp_url,
    items,
  }
}

export function useCreateVisit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: submitVisit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits'] })
      queryClient.invalidateQueries({ queryKey: ['partner-stock'] })
      queryClient.invalidateQueries({ queryKey: ['store-notas'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['partners'] })
      queryClient.invalidateQueries({ queryKey: ['partner-options'] })
    },
  })
}

// ============================================================================
// 5. PUBLIC INVOICE (NOTA DIGITAL MITRA)
// ============================================================================

export async function fetchPublicInvoice(token: string): Promise<PublicInvoiceData> {
  const response = await apiClient<{ data: PublicInvoiceData }>(`/v1/public/invoices/${encodeURIComponent(token)}`)
  return response.data
}

export function usePublicInvoice(token: string | null | undefined) {
  return useQuery({
    queryKey: ['public-invoice', token],
    queryFn: () => fetchPublicInvoice(token!),
    enabled: Boolean(token),
    staleTime: 1000 * 60 * 10, // 10 menit
  })
}
