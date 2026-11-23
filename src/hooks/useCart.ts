'use client'

import { useCartContext } from '@/context/CartContext'
import type { CartItem } from '@/types/cart'

interface CartState {
  items: CartItem[]
  subtotal: number
  platform_fee: number
  delivery_fee: number
  total: number
  itemCount: number
}
interface UseCartReturn extends CartState {
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>
  updateItem: (productId: string, quantity: number) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  clear: () => Promise<void>
  refresh: () => Promise<void>
  isLoading: boolean
  error: string | null
}

// Keep one cart state source for the product detail pages and the global cart UI.
export function useCart(): UseCartReturn {
  const { cart, addItem, updateItem, removeItem, clear, refresh, isLoading, error } = useCartContext()
  return { ...cart, addItem, updateItem, removeItem, clear, refresh, isLoading, error }
}
