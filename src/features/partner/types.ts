export interface Partner {
  id: string
  name: string
  ownerName: string
  whatsapp: string
  address?: string | null
  storeId?: string | null
  proposalId?: string | null
  isActive: boolean
  receivable: number
  createdAt?: string
  updatedAt?: string
}

export interface PartnerFormInput {
  name: string
  owner_name: string
  whatsapp: string
  address: string
  is_active?: boolean
}

export type HealthTier = 'bagus' | 'pantau' | 'evaluasi'

export interface PartnerHealthInfo {
  tier: HealthTier
  label: string
  reason: string
  score: number
}

export interface PartnerStockItem {
  productId: string
  productName: string
  onShelf: number
  dailySales: number
  nearestExpiry: string
}

export interface PartnerSuggestion {
  title: string
  content: string
  subtext: string
  targetProductId?: string
  suggestedQty?: number
}

export interface PartnerFilterOptions {
  search?: string
  tierFilter?: 'all' | HealthTier
  showZeroDebt?: boolean
}
