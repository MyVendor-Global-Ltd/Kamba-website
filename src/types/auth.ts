export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  role: 'buyer' | 'vendor' | 'admin' | 'agent'
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
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