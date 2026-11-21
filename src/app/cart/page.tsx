'use client'

import { useEffect, useState } from 'react'
import { Link } from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCart } from '@/hooks/useCart'
import { formatKobo } from '@/lib/formatting'

export default function CartPage() {
  const { cart, updateItem, removeItem, clear } = useCart()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center mt-20">
        <h2 className="text-xl font-semibold">Your cart is empty</h2>
        <p className="text-muted-foreground mt-2">Add some products to get started.</p>
        <Link href="/marketplace/products">
          <Button className="mt-4">Browse products</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <p className="text-muted-foreground">Review your items before checkout.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex gap-4">
                <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0">
                  {item.product?.image_url ? (
                    <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Image</div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{item.product?.name || 'Product'}</h3>
                  <p className="text-sm text-muted-foreground">₦{(item.product?.price || 0) / 100}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => updateItem(item.product_id, Math.max(1, (item.quantity || 1) - 1))}
                      className="w-8 h-8 border rounded-lg flex items-center justify-center text-sm"
                    >
                      −
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateItem(item.product_id, (item.quantity || 1) + 1)}
                      className="w-8 h-8 border rounded-lg flex items-center justify-center text-sm"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="ml-4 text-sm text-destructive hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
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
              <Button className="w-full" onClick={() => clear()}>
                Clear cart
              </Button>
              <Link href="/checkout">
                <Button className="w-full">Proceed to checkout</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
