export interface Product {
  id: string
  name: string
  photoPath?: string | null
  consignPrice: number
  retailPrice: number
  shelfLifeDays: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface ProductFormInput {
  name: string
  photo_path?: string
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
