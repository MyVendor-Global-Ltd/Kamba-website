'use client'

import { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react'
import type { CartItem } from '@/types/cart'
import type { Product } from '@/types/commerce'
import { apiJson } from '@/lib/api'
import { isMockMode } from '@/lib/mock-api'
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
  isGuest: boolean
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
const GUEST_CART_STORAGE_KEY = 'kamba_guest_cart'

const emptyCart = (): CartState => ({ items: [], subtotal: 0, platform_fee: 0, delivery_fee: 0, total: 0, itemCount: 0 })

interface CartProductSnapshot extends Partial<Product> {
  id?: string
  name?: string
  price?: number
  image_url?: string
  images?: string[]
  stock_quantity?: number
  store_id?: string
  store_name?: string
}
interface CartApiItem {
  id?: string
  product_id?: string
  quantity?: number
  name?: string
  product_name?: string
  price_kobo?: number
  price?: number
  image_url?: string
  images?: string[]
  stock_quantity?: number
  available?: boolean
  store_id?: string
  store_name?: string
  line_total?: number
  product?: CartProductSnapshot
}
interface CartApiResponse {
  items?: CartApiItem[]
  subtotal?: number
  platform_fee?: number
  shipping_amount?: number
  delivery_fee?: number
  total?: number
}

function normalizeCart(data: CartApiResponse): CartState {
  const items: CartItem[] = (Array.isArray(data.items) ? data.items : []).map((item) => {
    const productId = item.product_id || item.product?.id || item.id || ''
    const name = item.name || item.product_name || item.product?.name || 'Product'
    const price = Number(item.price_kobo ?? item.price ?? item.product?.price ?? 0)
    const image = item.image_url || item.images?.[0] || item.product?.image_url || item.product?.images?.[0]
    const product = (item.product as Product | undefined) || ({
      id: productId,
      name,
      price,
      image_url: image,
      images: image ? [image] : [],
      stock_quantity: item.stock_quantity ?? 0,
      store_id: item.store_id || '',
      store_name: item.store_name,
      is_active: item.available ?? true,
    } as Product)
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
  }).filter((item) => Boolean(item.product_id) && item.quantity > 0)

  const subtotal = Number(data.subtotal ?? items.reduce((sum, item) => sum + item.price_kobo * item.quantity, 0))
  const platformFee = Number(data.platform_fee ?? 0)
  const deliveryFee = Number(data.shipping_amount ?? data.delivery_fee ?? 0)
  return {
    items,
    subtotal,
    platform_fee: platformFee,
    delivery_fee: deliveryFee,
    total: Number(data.total ?? subtotal + platformFee + deliveryFee),
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

function getStoredGuestCart(): CartState {
  if (typeof window === 'undefined') return emptyCart()
  try {
    const stored = window.localStorage.getItem(GUEST_CART_STORAGE_KEY)
    return stored ? normalizeCart(JSON.parse(stored)) : emptyCart()
  } catch {
    return emptyCart()
  }
}

function setStoredGuestCart(cart: CartState) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(cart)) } catch { /* Storage is optional. */ }
}

function createGuestCart(items: CartItem[]): CartState {
  const subtotal = items.reduce((sum, item) => sum + Number(item.price_kobo || 0) * Number(item.quantity || 0), 0)
  return {
    items,
    subtotal,
    platform_fee: 0,
    delivery_fee: 0,
    total: subtotal,
    itemCount: items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
  }
}

function setStoredCart(cart: CartState) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)) } catch { /* Storage is optional. */ }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { state: authState } = useAuth()
  const isAuthenticatedBuyer = authState.isAuthenticated && authState.user?.role === 'buyer'
  const isGuest = !isMockMode && !authState.isAuthenticated
  const usesLocalCart = !isMockMode && !isAuthenticatedBuyer
  const [cart, setCart] = useState<CartState>(emptyCart)
  const cartRef = useRef(cart)
  const guestMergeInProgressRef = useRef(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { cartRef.current = cart }, [cart])

  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => {
      if (!active) return
      const stored = getStoredCart()
      setCart(stored)
      cartRef.current = stored
      setIsLoading(false)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!isLoading) setStoredCart(cart)
  }, [cart, isLoading])

  // Preserve an existing browser cart as a guest cart until the buyer signs in.
  useEffect(() => {
    if (authState.isLoading || authState.isAuthenticated || isMockMode || isLoading) return
    if (getStoredGuestCart().items.length === 0 && cartRef.current.items.length > 0) {
      setStoredGuestCart(cartRef.current)
    }
  }, [authState.isAuthenticated, authState.isLoading, isLoading])

  const refresh = useCallback(async () => {
    try {
      setError(null)

      if (!isMockMode && isAuthenticatedBuyer) {
        const guestCart = getStoredGuestCart()
        if (guestCart.items.length > 0 && !guestMergeInProgressRef.current) {
          guestMergeInProgressRef.current = true
          try {
            const current = normalizeCart(await apiJson<CartApiResponse>('/commerce/cart'))
            for (const item of guestCart.items) {
              const existing = current.items.find((candidate) => candidate.product_id === item.product_id)
              if (!existing) {
                await apiJson('/commerce/cart/items', {
                  method: 'POST',
                  body: JSON.stringify({ product_id: item.product_id, quantity: item.quantity }),
                })
              } else if (existing.quantity < item.quantity) {
                await apiJson(`/commerce/cart/items/${encodeURIComponent(item.product_id)}`, {
                  method: 'PUT',
                  body: JSON.stringify({ quantity: item.quantity }),
                })
              }
            }
            // Remove the guest copy only after every merge request has succeeded.
            if (typeof window !== 'undefined') window.localStorage.removeItem(GUEST_CART_STORAGE_KEY)
          } finally {
            guestMergeInProgressRef.current = false
          }
        }
      }

      const data = await apiJson<CartApiResponse>('/commerce/cart')
      const normalized = normalizeCart(data)
      setCart(normalized)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh cart'
      setError(message)
    }
  }, [isAuthenticatedBuyer])

  useEffect(() => {
    if (!authState.isLoading && (isMockMode || (authState.isAuthenticated && authState.user?.role === 'buyer'))) void Promise.resolve().then(refresh)
  }, [authState.isAuthenticated, authState.isLoading, refresh])

  const persistLocalCart = useCallback((next: CartState) => {
    cartRef.current = next
    setCart(next)
    setStoredGuestCart(next)
    setStoredCart(next)
  }, [])

  const addItem = useCallback(async (item: Omit<CartItem, 'id'>) => {
    try {
      setError(null)
      if (usesLocalCart) {
        const existing = cartRef.current.items.find((candidate) => candidate.product_id === item.product_id)
        const product = item.product || ({
          id: item.product_id,
          name: item.name,
          price: item.price_kobo,
          image_url: item.image_url,
          images: item.image_url ? [item.image_url] : [],
          store_id: item.store_id,
          store_name: item.store_name,
          stock_quantity: 0,
          is_active: true,
        } as Product)
        const nextItems = existing
          ? cartRef.current.items.map((candidate) => candidate.product_id === item.product_id
              ? { ...candidate, quantity: candidate.quantity + item.quantity }
              : candidate)
          : [...cartRef.current.items, { ...item, id: `guest-${item.product_id}`, product }]
        persistLocalCart(createGuestCart(nextItems))
        return
      }
      if (!isMockMode && !isAuthenticatedBuyer) throw new Error('Only buyer accounts can add products to the cart.')
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
  }, [isAuthenticatedBuyer, usesLocalCart, persistLocalCart, refresh])

  const updateItem = useCallback(async (productId: string, quantity: number) => {
    try {
      setError(null)
      if (usesLocalCart) {
        const nextItems = cartRef.current.items
          .map((item) => item.product_id === productId ? { ...item, quantity: Math.max(1, quantity) } : item)
        persistLocalCart(createGuestCart(nextItems))
        return
      }
      if (!isMockMode && !isAuthenticatedBuyer) throw new Error('Only buyer accounts can update the cart.')
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
  }, [isAuthenticatedBuyer, usesLocalCart, persistLocalCart, refresh])

  const removeItem = useCallback(async (productId: string) => {
    try {
      setError(null)
      if (usesLocalCart) {
        const nextItems = cartRef.current.items.filter((item) => item.product_id !== productId)
        persistLocalCart(createGuestCart(nextItems))
        return
      }
      if (!isMockMode && !isAuthenticatedBuyer) throw new Error('Only buyer accounts can remove cart items.')
      await apiJson(`/commerce/cart/items/${encodeURIComponent(productId)}`, { method: 'DELETE' })
      await refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove item'
      setError(message)
      throw err
    }
  }, [isAuthenticatedBuyer, usesLocalCart, persistLocalCart, refresh])

  const clear = useCallback(async () => {
    try {
      setError(null)
      if (usesLocalCart) {
        const empty = emptyCart()
        persistLocalCart(empty)
        return
      }
      if (!isMockMode && !isAuthenticatedBuyer) throw new Error('Only buyer accounts can clear the cart.')
      await Promise.all(cartRef.current.items.map((item) =>
        apiJson(`/commerce/cart/items/${encodeURIComponent(item.product_id)}`, { method: 'DELETE' })
      ))
      await refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear cart'
      setError(message)
      throw err
    }
  }, [isAuthenticatedBuyer, isGuest, persistLocalCart, refresh])

  return (
    <CartContext.Provider value={{ cart, isGuest, isLoading, error, addItem, updateItem, removeItem, clear, refresh }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCartContext() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCartContext must be used within a CartProvider')
  return context
}
