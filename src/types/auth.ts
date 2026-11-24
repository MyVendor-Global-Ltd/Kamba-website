export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  display_name?: string
  phone_verified?: boolean
  is_complete?: boolean
  is_active?: boolean
  role: 'buyer' | 'vendor' | 'admin' | 'agent'
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  cartCount: number
  authError?: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  first_name?: string
  last_name?: string
  phone?: string
  role?: string
}
