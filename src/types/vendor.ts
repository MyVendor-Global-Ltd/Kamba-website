export interface Store {
  id: string
  name: string
  slug: string
  description?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  country?: string
  latitude?: number
  longitude?: number
  vendor_id: string
  is_active: boolean
  verification_status: 'pending' | 'basic' | 'nin' | 'business' | 'rejected'
  created_at: string
  updated_at: string
  distance_km?: number
  logo_url?: string
  category?: string
}

export type StoreProfile = Store

export interface ServiceProfile {
  id: string
  name: string
  slug: string
  description?: string
  category?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  country?: string
  latitude?: number
  longitude?: number
  vendor_id: string
  is_active: boolean
  verification_status: 'pending' | 'basic' | 'nin' | 'business' | 'rejected'
  created_at: string
  updated_at: string
  distance_km?: number
  logo_url?: string
}

export type Service = ServiceProfile

export interface VendorOnboardingData {
  business_name: string
  business_type: 'products' | 'services' | 'both'
  phone: string
  email?: string
  address?: string
  city?: string
  state?: string
  country?: string
  latitude?: number
  longitude?: number
}

export interface VendorOnboardingData {
  business_name: string
  business_type: 'products' | 'services' | 'both'
  phone: string
  email?: string
  address?: string
  city?: string
  state?: string
  country?: string
  latitude?: number
  longitude?: number
}