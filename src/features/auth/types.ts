export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  business_name: string
  owner_name: string
  email: string
  whatsapp: string
  password: string
}

export interface AuthUser {
  id: string
  email: string
  full_name: string
  role: string
}

export interface AuthBusiness {
  id: string
  name: string
  owner_name: string
  whatsapp?: string
}

export interface AuthResponse {
  access_token: string
  token_type?: string
  expires_at?: string
  user: AuthUser
  business: AuthBusiness
}
