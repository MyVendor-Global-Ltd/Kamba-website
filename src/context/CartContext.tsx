'use client'

import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react'
import type { CartItem } from '@/types/cart'
import { apiJson } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

interface CartState {
  items: CartItem[]
  subtotal: number
  platform_fee: number
  delivery_fee: number
  total: number
  itemCount: number
}

interface CartContextType {
  cart: CartState
  isLoading: boolean
  error: string | null
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>
  updateItem: (productId: string, quantity: number) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  clear: () => Promise<void>
  refresh: () => Promise<void>
}

const CartContext = createContext<CartContextType | null>(null)
const CART_STORAGE_KEY = 'kamba_cart'

const emptyCart = (): CartState => ({ items: [], subtotal: 0, platform_fee: 0, delivery_fee: 0, total: 0, itemCount: 0 })

function normalizeCart(data: any): CartState {
  const items: CartItem[] = (Array.isArray(data?.items) ? data.items : []).map((item: any) => {
    const productId = item.product_id || item.product?.id || item.id
    const name = item.name || item.product_name || item.product?.name || 'Product'
    const price = Number(item.price_kobo ?? item.price ?? item.product?.price ?? 0)
    const image = item.image_url || item.images?.[0] || item.product?.image_url || item.product?.images?.[0]
    const product = item.product || {
      id: productId,
      name,
      price,
      image_url: image,
      images: image ? [image] : [],
      stock_quantity: item.stock_quantity ?? 0,
      store_id: item.store_id || '',
      store_name: item.store_name,
      is_active: item.available ?? true,
    }
    return {
      id: item.id || productId,
      product_id: productId,
      quantity: Number(item.quantity || 0),
      name,
      price_kobo: price,
      image_url: image,
      store_id: item.store_id || product.store_id || '',
      store_name: item.store_name || product.store_name,
      product,
    }
  }).filter((item: CartItem) => Boolean(item.product_id) && item.quantity > 0)

  const subtotal = Number(data?.subtotal ?? items.reduce((sum, item) => sum + item.price_kobo * item.quantity, 0))
  const platformFee = Number(data?.platform_fee ?? 0)
  const deliveryFee = Number(data?.shipping_amount ?? data?.delivery_fee ?? 0)
  return {
    items,
    subtotal,
    platform_fee: platformFee,
    delivery_fee: deliveryFee,
    total: Number(data?.total ?? subtotal + platformFee + deliveryFee),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  }
}

function getStoredCart(): CartState {
  if (typeof window === 'undefined') return emptyCart()
  try {
    const stored = window.localStorage.getItem(CART_STORAGE_KEY)
    return stored ? normalizeCart(JSON.parse(stored)) : emptyCart()
  } catch {
    return emptyCart()
  }
}

function setStoredCart(cart: CartState) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)) } catch { /* Storage is optional. */ }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { state: authState } = useAuth()
  const [cart, setCart] = useState<CartState>(emptyCart)
  const cartRef = useRef(cart)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { cartRef.current = cart }, [cart])

  useEffect(() => {
    const stored = getStoredCart()
    setCart(stored)
    cartRef.current = stored
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoading) setStoredCart(cart)
  }, [cart, isLoading])

  const refresh = useCallback(async () => {
    try {
      setError(null)
      let data = await apiJson<any>('/commerce/cart')
      let normalized = normalizeCart(data)

      // Merge a guest cart into a newly authenticated buyer account once.
      if (normalized.items.length === 0 && cartRef.current.items.length > 0) {
        for (const item of cartRef.current.items) {
          await apiJson('/commerce/cart/items', {
            method: 'POST',
            body: JSON.stringify({ product_id: item.product_id, quantity: item.quantity }),
          })
        }
        data = await apiJson<any>('/commerce/cart')
        normalized = normalizeCart(data)
      }

      setCart(normalized)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh cart'
      setError(message)
    }
  }, [])

  useEffect(() => {
    if (!authState.isLoading && authState.isAuthenticated) void refresh()
  }, [authState.isAuthenticated, authState.isLoading, refresh])

  const addItem = useCallback(async (item: Omit<CartItem, 'id'>) => {
    try {
      setError(null)
      await apiJson('/commerce/cart/items', {
        method: 'POST',
        body: JSON.stringify({ product_id: item.product_id, quantity: item.quantity }),
      })
      await refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add item to cart'
      setError(message)
      throw err
    }
  }, [refresh])

  const updateItem = useCallback(async (productId: string, quantity: number) => {
    try {
      setError(null)
      await apiJson(`/commerce/cart/items/${encodeURIComponent(productId)}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity }),
      })
      await refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update cart'
      setError(message)
      throw err
    }
  }, [refresh])

  const removeItem = useCallback(async (productId: string) => {
    try {
      setError(null)
      await apiJson(`/commerce/cart/items/${encodeURIComponent(productId)}`, { method: 'DELETE' })
      await refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove item'
      setError(message)
      throw err
    }
  }, [refresh])

  const clear = useCallback(async () => {
    try {
      setError(null)
      await Promise.all(cartRef.current.items.map((item) =>
        apiJson(`/commerce/cart/items/${encodeURIComponent(item.product_id)}`, { method: 'DELETE' })
      ))
      await refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear cart'
      setError(message)
      throw err
    }
  }, [refresh])

  return (
    <CartContext.Provider value={{ cart, isLoading, error, addItem, updateItem, removeItem, clear, refresh }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCartContext() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCartContext must be used within a CartProvider')
  return context
}
