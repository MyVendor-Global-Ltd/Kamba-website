export interface Product {
  id: string
  name: string
  description?: string
  price: number
  stock_quantity: number
  category?: string
  image_url?: string
  images?: string[]
  videos?: string[]
  store_id: string
  store_name?: string
  store_slug?: string
  original_price?: number
  compare_at_price?: number
  average_rating?: number
  review_count?: number
  view_count?: number
  is_active: boolean
  is_available?: boolean
  tags?: string[]
  deleted_at?: string | null
  in_stock?: boolean
  created_at: string
  updated_at: string
}

export interface CartItem {
  id: string
  product_id: string
  quantity: number
  product?: Product
}

export interface Cart {
  id: string
  store_id: string
  items: CartItem[]
  subtotal: number
  platform_fee: number
  delivery_fee: number
  total: number
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  status:
    | 'pending'
    | 'paid'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'completed'
    | 'disputed'
    | 'cancelled'
    | 'refunded'
  subtotal: number
  platform_fee: number
  delivery_fee: number
  total: number
  customer_id: string
  store_id: string
  payment_status: string
  delivery_status: string
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  product?: Product
}

export interface CheckoutData {
  items: Array<{ product_id: string; quantity: number }>
  idempotency_key?: string
}