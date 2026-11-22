'use client'

import { useState, useEffect, useCallback } from 'react'
import { CartItem } from '@/types/cart'
import { apiJson } from '@/lib/api'

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

const CART_STORAGE_KEY = 'kamba_cart'

function getStoredCart(): CartState | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignore parse errors
  }
  return null
}

function setStoredCart(cart: CartState) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  } catch {
    // Ignore storage errors
  }
}

function calculateTotals(items: CartItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.price_kobo * item.quantity, 0)
  const platform_fee = Math.round(subtotal * 0.05)
  const delivery_fee = subtotal > 500000 ? 0 : 150000
  const total = subtotal + platform_fee + delivery_fee
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  return { subtotal, platform_fee, delivery_fee, total, itemCount }
}

export function useCart(): UseCartReturn {
  const [cart, setCart] = useState<CartState>({
    items: [],
    subtotal: 0,
    platform_fee: 0,
    delivery_fee: 0,
    total: 0,
    itemCount: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize cart from localStorage on mount
  useEffect(() => {
    const stored = getStoredCart()
    if (stored) {
      setCart(stored)
    }
    setIsLoading(false)
  }, [])

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      setStoredCart(cart)
    }
  }, [cart, isLoading])

  const refresh = useCallback(async () => {
    try {
      setError(null)
      const data = await apiJson<CartState>('/api/cart')
      setCart(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh cart'
      setError(message)
      console.error('Cart refresh error:', err)
    }
  }, [])

  const addItem = useCallback(async (item: Omit<CartItem, 'id'>) => {
    try {
      setError(null)
      const data = await apiJson<CartState>('/api/cart', {
        method: 'POST',
        body: JSON.stringify(item),
      })
      setCart(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add item to cart'
      setError(message)
      console.error('Add to cart error:', err)
      throw err
    }
  }, [])

  const updateItem = useCallback(async (productId: string, quantity: number) => {
    try {
      setError(null)
      const data = await apiJson<CartState>('/api/cart', {
        method: 'PUT',
        body: JSON.stringify({ product_id: productId, quantity }),
      })
      setCart(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update cart'
      setError(message)
      console.error('Update cart error:', err)
      throw err
    }
  }, [])

  const removeItem = useCallback(async (productId: string) => {
    try {
      setError(null)
      const data = await apiJson<CartState>('/api/cart', {
        method: 'DELETE',
        body: JSON.stringify({ product_id: productId }),
      })
      setCart(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove item'
      setError(message)
      console.error('Remove from cart error:', err)
      throw err
    }
  }, [])

  const clear = useCallback(async () => {
    try {
      setError(null)
      const data = await apiJson<CartState>('/api/cart', {
        method: 'DELETE',
      })
      setCart(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear cart'
      setError(message)
      console.error('Clear cart error:', err)
      throw err
    }
  }, [])

  return {
    ...cart,
    addItem,
    updateItem,
    removeItem,
    clear,
    refresh,
    isLoading,
    error,
  }
}