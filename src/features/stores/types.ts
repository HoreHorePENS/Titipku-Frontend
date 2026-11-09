export type StoreCategory =
  | 'warung'
  | 'kelontong'
  | 'kafe'
  | 'resto'
  | 'minimarket'
  | 'apotek'
  | 'roti'
  | 'lainnya'

export interface Store {
  id: string
  name: string
  category: StoreCategory
  description?: string | null
  address: string
  whatsapp: string
  latitude: number
  longitude: number
  photoUrl?: string | null
  isActive: boolean
  hasConsigned: boolean
  createdAt: string
  updatedAt: string
}

export interface StoreFilter {
  category?: string
  search?: string
  minLat?: number
  maxLat?: number
  minLng?: number
  maxLng?: number
  limit?: number
  offset?: number
}

export interface StoreInput {
  name: string
  category: StoreCategory
  description?: string
  address: string
  whatsapp: string
  latitude: number
  longitude: number
  is_active?: boolean
}
