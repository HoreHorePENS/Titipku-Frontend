export interface LoginInput {
  email: string
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
}

export interface AuthResponse {
  access_token: string
  user: AuthUser
  business: AuthBusiness
}
