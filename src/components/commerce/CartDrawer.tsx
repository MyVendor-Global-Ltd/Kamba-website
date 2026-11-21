'use client'

import { useState } from 'react'
import { Cart, CartItem } from '@/types/commerce'
import { Button } from '@/components/ui/button'
import { formatKobo } from '@/lib/formatting'
import { useCart } from '@/hooks/useCart'

interface CartDrawerProps {
  cart: Cart | null
  isOpen: boolean
  onClose: () => void
  onCheckout: () => void
}

export function CartDrawer({ cart, isOpen, onClose, onCheckout }: CartDrawerProps) {
  const { updateItem, removeItem, clear } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  if (!isOpen || !cart) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-md bg-background border-t border-input p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Shopping Cart</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {cart.items.map((item) => (
            <div key={item.id} className="flex gap-4 border-b pb-4 last:border-0">
              <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center text-muted-foreground text-xs">
                {item.product_id.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{item.product?.name || 'Product'}</h4>
                <p className="text-sm text-muted-foreground">₦{(item.product?.price || 0) / 100}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => updateItem(item.product_id, Math.max(1, (item.quantity || 1) - 1))}
                    className="w-7 h-7 border rounded flex items-center justify-center text-xs"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-xs">{item.quantity}</span>
                  <button
                    onClick={() => updateItem(item.product_id, (item.quantity || 1) + 1)}
                    className="w-7 h-7 border rounded flex items-center justify-center text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
              <button
                onClick={() => removeItem(item.product_id)}
                className="text-muted-foreground hover:text-destructive"
              >
                ×
              </button>
            </div>
          ))}
          {cart.items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Your cart is empty
            </div>
          )}
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex justify-between text-sm border-t pt-4">
            <span>Subtotal</span>
            <span>{formatKobo(cart.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Platform fee</span>
            <span>{formatKobo(cart.platform_fee)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Delivery fee</span>
            <span>{formatKobo(cart.delivery_fee)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-4">
            <span>Total</span>
            <span>{formatKobo(cart.total)}</span>
          </div>
          <Button
            onClick={() => { setIsCheckingOut(true) }}
            className="w-full"
            disabled={isCheckingOut}
          >
            {isCheckingOut ? 'Checking out...' : 'Proceed to checkout'}
          </Button>
          <Button variant="outline" className="w-full" onClick={clear}>
            Clear cart
          </Button>
        </div>
      </div>
    </div>
  )
}
