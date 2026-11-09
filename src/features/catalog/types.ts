export interface Product {
  id: string
  name: string
  photoPath?: string | null
  /** URL lengkap foto produk (siap dipakai di <img>), atau null. */
  photoUrl?: string | null
  consignPrice: number
  retailPrice: number
  shelfLifeDays: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ProductFormInput {
  name: string
  consign_price: number
  retail_price: number
  shelf_life_days: number
  is_active?: boolean
}

export type ProductStatusFilter = 'all' | 'active' | 'inactive'

export interface ProductFilterOptions {
  search: string
  statusFilter: ProductStatusFilter
}

export interface CatalogStats {
  total: number
  activeCount: number
  inactiveCount: number
  averageConsignPrice: number
  averageMargin: number
}
