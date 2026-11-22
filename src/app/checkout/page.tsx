"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatKobo } from "@/lib/formatting"
import { CartItem } from "@/types/cart"
import { apiJson } from "@/lib/api"

export default function CheckoutPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    shippingAddress: "",
    city: "",
    state: "",
    paymentMethod: "card",
  })

  useEffect(() => {
    async function fetchCart() {
      try {
        const data = await apiJson<{ items: CartItem[] }>("/api/cart")
        setCartItems(data.items || [])
      } catch (err) {
        console.error("Failed to fetch cart:", err)
        setError("Failed to load cart")
      } finally {
        setLoading(false)
      }
    }
    fetchCart()
  }, [])

  const subtotal = cartItems.reduce((sum, item) => sum + item.price_kobo * item.quantity, 0)
  const shipping = subtotal > 0 ? 150000 : 0 // ₦1,500 shipping
  const total = subtotal + shipping

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await apiJson("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
          shipping_address: {
            address: formData.shippingAddress,
            city: formData.city,
            state: formData.state,
          },
          payment_method: formData.paymentMethod,
        }),
      })
      router.push("/orders")
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to place order"
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8 animate-fade-in">
        <div className="space-y-4 animate-pulse">
          <div className="h-10 w-1/3 bg-ink-raised/50 rounded-lg" />
          <div className="h-6 w-1/2 bg-ink-raised/50 rounded-lg" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} variant="elevated">
                <CardContent className="p-4">
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
          <Card variant="elevated">
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

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 lg:py-24 animate-fade-in">
        <Card variant="outlined" className="max-w-md mx-auto text-center p-8">
          <CardContent className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-coral-dim flex items-center justify-center">
              <svg className="w-8 h-8 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Your cart is empty</h2>
              <p className="text-text-secondary mt-1">Add some products to get started</p>
            </div>
            <Link href="/marketplace/products">
              <Button className="w-full">Continue Shopping</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 animate-fade-in">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold text-text-primary tracking-tight">Checkout</h1>
        <p className="text-text-secondary">Review your order and complete your purchase</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-lg">Shipping Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+234 800 000 0000"
                  required
                />
              </div>
              <Input
                label="Shipping Address"
                value={formData.shippingAddress}
                onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                placeholder="123 Main Street, Apt 4B"
                required
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Lagos"
                  required
                />
                <Input
                  label="State"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Lagos"
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-lg">Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 rounded-lg border border-ink-raised hover:border-coral/30 hover:bg-coral-dim/20 transition-all cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={formData.paymentMethod === "card"}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-4 h-4 text-coral border-ink-raised focus:ring-coral"
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 bg-ink rounded flex items-center justify-center text-xs font-mono text-text-tertiary">CARD</div>
                    <span className="text-text-primary font-medium">Credit / Debit Card</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 rounded-lg border border-ink-raised hover:border-coral/30 hover:bg-coral-dim/20 transition-all cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="transfer"
                    checked={formData.paymentMethod === "transfer"}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-4 h-4 text-coral border-ink-raised focus:ring-coral"
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 bg-ink rounded flex items-center justify-center text-xs font-mono text-text-tertiary">BANK</div>
                    <span className="text-text-primary font-medium">Bank Transfer</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 rounded-lg border border-ink-raised hover:border-coral/30 hover:bg-coral-dim/20 transition-all cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="ussd"
                    checked={formData.paymentMethod === "ussd"}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-4 h-4 text-coral border-ink-raised focus:ring-coral"
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-6 bg-ink rounded flex items-center justify-center text-xs font-mono text-text-tertiary">USSD</div>
                    <span className="text-text-primary font-medium">USSD Payment</span>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-64 overflow-y-auto space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="h-16 w-16 bg-ink-raised/50 rounded-lg flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
                      <p className="text-sm text-text-secondary">Qty: {item.quantity}</p>
                      <p className="text-sm font-medium text-text-primary">{formatKobo(item.price_kobo * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-ink-raised pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="text-text-primary">{formatKobo(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Shipping</span>
                  <span className="text-text-primary">{shipping > 0 ? formatKobo(shipping) : "Free"}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-ink-raised">
                  <span className="text-text-primary">Total</span>
                  <span className="text-coral">{formatKobo(total)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-ink-raised">
              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? "Placing Order..." : `Place Order - ${formatKobo(total)}`}
              </Button>
            </CardFooter>
          </Card>

          <Card variant="outlined" className="p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-coral mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div className="text-sm text-text-secondary space-y-1">
                <p className="font-medium text-text-primary">Secure Checkout</p>
                <p>Your payment information is encrypted and secure.</p>
              </div>
            </div>
          </Card>
        </div>
      </form>
    </div>
  )
}