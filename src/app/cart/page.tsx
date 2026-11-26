'use client'

import Link from 'next/link'
import { useCartContext } from '@/context/CartContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatKobo } from '@/lib/formatting'
import { LockKeyhole, ShoppingBag } from 'lucide-react'

export default function CartPage() {
  const { cart, updateItem, removeItem, clear, isLoading, isGuest } = useCartContext()

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8 animate-fade-in">
        <div className="space-y-4 animate-pulse">
          <div className="h-10 w-1/3 bg-ink-raised/50 rounded-lg" />
          <div className="h-6 w-1/2 bg-ink-raised/50 rounded-lg" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} variant="default">
                <CardContent className="border border-[#E5E7DF] bg-white p-3 shadow-[2px_2px_8px_rgba(31,42,34,.04)] sm:p-4">
                  <div className="flex gap-4">
                    <div className="h-20 w-20 bg-ink-raised/50 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-1/4 bg-ink-raised/50 rounded" />
                      <div className="h-4 w-1/2 bg-ink-raised/50 rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card variant="default">
            <CardContent className="p-4 space-y-4">
              <div className="h-6 w-1/3 bg-ink-raised/50 rounded" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-ink-raised/50 rounded" />
                <div className="h-4 w-full bg-ink-raised/50 rounded" />
              </div>
              <div className="h-4 w-full bg-ink-raised/50 rounded" />
              <div className="h-4 w-full bg-ink-raised/50 rounded" />
              <div className="h-10 w-full bg-ink-raised/50 rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isGuest && (!cart || cart.items.length === 0)) {
    return (
      <div className="container mx-auto flex min-h-[65vh] items-center justify-center px-4 py-12">
        <Card variant="default" className="w-full max-w-xl">
          <CardContent className="flex flex-col items-center px-6 py-12 text-center sm:px-10">
            <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <LockKeyhole className="h-8 w-8" />
            </span>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Your shopping space</p>
            <h1 className="mt-3 text-2xl font-bold text-text-primary sm:text-3xl">Sign in to view your cart.</h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-text-secondary">
              Create an account or sign in to keep your cart in one place and pick up where you left off. You can still browse Kamba and add products before signing in.
            </p>
            <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link href="/auth/login?callbackUrl=%2Fcart" className="w-full sm:w-auto">
                <Button className="w-full">Sign in</Button>
              </Link>
              <Link href="/auth/register?callbackUrl=%2Fcart" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full">Create account</Button>
              </Link>
            </div>
            <Link href="/search" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              <ShoppingBag className="h-4 w-4" /> Browse products
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 lg:py-12 flex flex-col items-center justify-center text-center min-h-[60vh]">
        <div className="w-20 h-20 rounded-full bg-ink-raised/50 flex items-center justify-center mx-auto mb-6 text-text-tertiary">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold font-display text-text-primary mb-2">Your cart is empty</h2>
        <p className="text-text-secondary mb-6 max-w-sm">Add some products to get started.</p>
        <Link href="/marketplace/products">
          <Button size="lg">Browse products</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F7F3] px-3 py-6 text-[#202820] sm:px-6 lg:py-10">
      <header className="animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-text-primary">Shopping Cart</h1>
        <p className="text-text-secondary mt-2">Review your items before checkout.</p>
      </header>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-3" style={{ animationDelay: '100ms' }}>
        <div className="space-y-3 lg:col-span-2">
          {cart.items.map((item) => (
            <Card key={item.id} variant="default" className="border border-[#E5E7DF] bg-white p-3 shadow-[2px_2px_8px_rgba(31,42,34,.04)] sm:p-4">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-ink-raised/50 rounded-lg flex-shrink-0 overflow-hidden">
                  {item.product?.image_url ? (
                    <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text-primary truncate">{item.product?.name || 'Product'}</h3>
                  <p className="text-sm text-text-tertiary">{formatKobo(item.product?.price || 0)}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateItem(item.product_id, Math.max(1, (item.quantity || 1) - 1))}
                      aria-label="Decrease quantity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </Button>
                    <span className="w-10 text-center font-medium text-text-primary">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateItem(item.product_id, (item.quantity || 1) + 1)}
                      aria-label="Increase quantity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.product_id)}
                      className="ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card variant="default" className="sticky top-24 border border-[#E5E7DF] bg-white shadow-[2px_2px_8px_rgba(31,42,34,.04)]">
            <CardHeader>
              <CardTitle className="text-text-primary">Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Subtotal</span>
                <span className="text-text-primary font-medium">{formatKobo(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Platform fee</span>
                <span className="text-text-primary font-medium">{isGuest ? 'Calculated after sign in' : formatKobo(cart.platform_fee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Delivery fee</span>
                <span className="text-text-primary font-medium">{isGuest ? 'Calculated at checkout' : formatKobo(cart.delivery_fee)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold font-display text-text-primary border-t border-ink-raised/30 pt-4">
                <span>{isGuest ? 'Items subtotal' : 'Total'}</span>
                <span>{formatKobo(cart.total)}</span>
              </div>
              {isGuest && <p className="rounded-lg bg-secondary px-3 py-2 text-xs leading-5 text-secondary-foreground">Your cart is saved on this device. Sign in as a buyer to sync it and calculate the final platform and delivery fees.</p>}
              <div className="space-y-3 pt-2">
                <Button variant="outline" className="w-full" onClick={() => clear()}>
                  Clear cart
                </Button>
                <Link href="/checkout">
                  <Button variant="default" size="lg" className="w-full">
                    Proceed to checkout
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}