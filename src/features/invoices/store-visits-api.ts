import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

/**
 * Nota penjualan dari penitip, dilihat oleh pemilik toko (hanya-baca).
 * Nota dibuat penitip lewat Catat Kunjungan; toko tidak menerbitkan nota sendiri.
 */
export type StoreNotaPaymentStatus = 'paid' | 'partial' | 'unpaid' | 'no_invoice'

export interface StoreNotaItem {
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

export interface StoreNota {
  id: string
  number: string
  /** Usaha penitip pembuat nota. */
  businessId: string
  businessName: string
  ownerName: string
  whatsapp: string
  visitedAt: string
  receivedBy: string
  total: number
  paid: number
  paymentStatus: StoreNotaPaymentStatus
  publicInvoiceUrl?: string
  items: StoreNotaItem[]
}

export interface RawStoreNota {
  id: string
  number: string
  business_id: string
  partner_name: string
  partner_owner_name: string
  partner_whatsapp: string
  visited_at: string
  received_by: string
  total: number
  paid: number
  payment_status: StoreNotaPaymentStatus
  public_invoice_url?: string
  items?: Array<{
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

export function mapStoreNota(raw: RawStoreNota): StoreNota {
  return {
    id: raw.id,
    number: raw.number,
    businessId: raw.business_id,
    businessName: raw.partner_name,
    ownerName: raw.partner_owner_name,
    whatsapp: raw.partner_whatsapp,
    visitedAt: raw.visited_at,
    receivedBy: raw.received_by,
    total: raw.total,
    paid: raw.paid ?? 0,
    paymentStatus: raw.payment_status,
    publicInvoiceUrl: raw.public_invoice_url,
    items: (raw.items ?? []).map((it) => ({
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
}

export const STORE_NOTA_STATUS_LABEL: Record<StoreNotaPaymentStatus, string> = {
  paid: 'Lunas',
  partial: 'Dibayar sebagian',
  unpaid: 'Belum dibayar',
  no_invoice: 'Titip barang (tanpa tagihan)',
}

export const storeNotaKeys = {
  all: ['store-notas'] as const,
  list: () => ['store-notas', 'list'] as const,
  detail: (id: string) => ['store-notas', 'detail', id] as const,
}

/** Daftar nota dari semua penitip untuk toko ini (terbaru dulu). */
export function useStoreNotas(enabled = true) {
  return useQuery({
    queryKey: storeNotaKeys.list(),
    enabled,
    staleTime: 1000 * 20,
    refetchInterval: 1000 * 60,
    queryFn: async () => {
      const res = await apiClient<{ data: RawStoreNota[] }>('/v1/store-visits?limit=100')
      return (res.data ?? []).map(mapStoreNota)
    },
  })
}

/** Detail satu nota beserta rincian produk. */
export function useStoreNota(id: string | null | undefined) {
  return useQuery({
    queryKey: storeNotaKeys.detail(id ?? ''),
    enabled: Boolean(id),
    staleTime: 1000 * 20,
    queryFn: async () => {
      const res = await apiClient<{ data: RawStoreNota }>(`/v1/store-visits/${encodeURIComponent(id!)}`)
      return mapStoreNota(res.data)
    },
  })
}
