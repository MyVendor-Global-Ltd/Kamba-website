'use client'

import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { Cart, CartItem } from '@/types/commerce'

const CartContext = createContext<{
  cart: Cart | null
  addItem: (item: Omit<CartItem, 'id'>) => void
  updateItem: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clear: () => void
} | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null)

  const addItem = useCallback((item: Omit<CartItem, 'id'>) => {
    setCart((prev) => {
      if (!prev) return null
      const existing = prev.items.find((i) => i.product_id === item.product_id)
      if (existing) {
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.product_id === item.product_id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        }
      }
      return {
        ...prev,
        items: [...prev.items, { ...item, id: crypto.randomUUID() }],
      }
    })
  }, [])

  const updateItem = useCallback((productId: string, quantity: number) => {
    setCart((prev) => {
      if (!prev) return null
      return {
        ...prev,
        items: prev.items.map((i) =>
          i.product_id === productId ? { ...i, quantity } : i
        ),
      }
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setCart((prev) => {
      if (!prev) return null
      return {
        ...prev,
        items: prev.items.filter((i) => i.product_id !== productId),
      }
    })
  }, [])

  const clear = useCallback(() => {
    setCart(null)
  }, [])

  return (
    <CartContext.Provider value={{ cart, addItem, updateItem, removeItem, clear }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}