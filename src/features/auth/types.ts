export type AccountType = 'penitip' | 'pemilik_toko'

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterStoreInput {
  name: string
  category: string
  description?: string
  address: string
  whatsapp: string
  latitude: number
  longitude: number
}

export interface RegisterInput {
  account_type?: AccountType
  business_name?: string
  owner_name: string
  email: string
  whatsapp: string
  password: string
  store?: RegisterStoreInput
}

export interface AuthUser {
  id: string
  email: string
  full_name: string
  role: string
  account_type: AccountType
  created_at?: string
}

export interface AuthBusiness {
  id: string
  name: string
  owner_name: string
  whatsapp?: string
  address?: string
}

export interface AuthStore {
  id: string
  name: string
  category: string
  description?: string | null
  address: string
  whatsapp: string
  latitude: number
  longitude: number
  photo_url?: string | null
  is_active: boolean
  has_consigned?: boolean
  created_at?: string
  updated_at?: string
}

export interface AuthResponse {
  access_token: string
  token_type?: string
  expires_at?: string
  user: AuthUser
  business?: AuthBusiness
  store?: AuthStore
}

export interface CurrentAccount {
  user: AuthUser
  business?: AuthBusiness
  store?: AuthStore
}
