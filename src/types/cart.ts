import type { Product } from "./commerce"

export interface CartItem {
  id: string
  product_id: string
  quantity: number
  name: string
  price_kobo: number
  image_url?: string
  store_id: string
  store_name?: string
  product?: Product
}