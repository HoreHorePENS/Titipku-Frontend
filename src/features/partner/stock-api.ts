import { useQuery } from '@tanstack/react-query'
import { apiClient, resolveMediaUrl } from '@/lib/api-client'
import type { VisitItemInput } from '@/features/visit/types'

/** Posisi stok satu produk penitip di satu mitra, dari sisa batch di backend. */
export interface RawPartnerStock {
  product_id: string
  product_name: string
  photo_path?: string | null
  consign_price: number
  is_active: boolean
  on_shelf: number
  nearest_expiry?: string | null
  ever_consigned: boolean
}

export interface PartnerStockEntry {
  productId: string
  productName: string
  photoUrl: string | null
  consignPrice: number
  isActive: boolean
  onShelf: number
  /** Tanggal kedaluwarsa batch terdekat yang masih di rak (YYYY-MM-DD). */
  nearestExpiry: string | null
  everConsigned: boolean
}

export function mapPartnerStock(raw: RawPartnerStock): PartnerStockEntry {
  return {
    productId: raw.product_id,
    productName: raw.product_name,
    photoUrl: resolveMediaUrl(raw.photo_path),
    consignPrice: raw.consign_price,
    isActive: raw.is_active,
    onShelf: raw.on_shelf,
    nearestExpiry: raw.nearest_expiry ?? null,
    everConsigned: raw.ever_consigned,
  }
}

/** Produk yang pernah dititipkan ke mitra ini (untuk ditampilkan di detail toko). */
export function consignedProducts(entries: PartnerStockEntry[]): PartnerStockEntry[] {
  return entries.filter((e) => e.everConsigned || e.onShelf > 0)
}

/**
 * Baris input kunjungan/nota: produk aktif penitip, stok kemarin = stok di rak saat ini.
 * Produk nonaktif tidak bisa dicatat di kunjungan (backend menolak: PRODUCT_NOT_FOUND).
 */
export function stockToVisitItems(entries: PartnerStockEntry[]): VisitItemInput[] {
  return entries
    .filter((e) => e.isActive)
    .map((e) => ({
      productId: e.productId,
      productName: e.productName,
      consignPrice: e.consignPrice,
      prevStock: e.onShelf,
      remaining: e.onShelf, // default utuh (belum laku)
      returned: 0,
      newDrop: 0,
    }))
}

export const stockKeys = {
  partner: (partnerId: string) => ['partner-stock', partnerId] as const,
}

/** Penitip: stok produknya di satu toko mitra. */
export function usePartnerStock(partnerId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: stockKeys.partner(partnerId ?? ''),
    enabled: enabled && Boolean(partnerId),
    staleTime: 1000 * 15,
    queryFn: async () => {
      const res = await apiClient<{ data: RawPartnerStock[] }>(
        `/v1/partners/${encodeURIComponent(partnerId!)}/stock`
      )
      return (res.data ?? []).map(mapPartnerStock)
    },
  })
}
