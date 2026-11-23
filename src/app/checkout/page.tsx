"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { formatKobo } from "@/lib/formatting"
import { apiJson } from "@/lib/api"
import { useCartContext } from "@/context/CartContext"
import { isMockMode } from "@/lib/mock-api"

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, isLoading, refresh } = useCartContext()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    recipientName: "",
    phone: "",
    shippingAddress: "",
    city: "",
    state: "",
    deliveryType: "delivery" as "delivery" | "pickup",
  })

  const cartItems = cart.items
  const subtotal = cart.subtotal
  const shipping = cart.delivery_fee
  const total = subtotal + cart.platform_fee + (formData.deliveryType === 'pickup' ? 0 : shipping)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (!isMockMode && formData.deliveryType === "delivery") {
        throw new Error("Live delivery checkout requires a selected university and delivery zone. Those selectors are not connected in this website yet. Choose pickup or use development prototype mode.")
      }
      const idempotencyKey = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `kamba-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const checkoutBody = formData.deliveryType === "pickup"
        ? { delivery_type: "pickup" }
        : {
            delivery_type: "delivery",
            delivery_mode: "express",
            delivery_address: {
              recipient_name: formData.recipientName,
              phone: formData.phone,
              address_line: formData.shippingAddress,
              city: formData.city,
              state: formData.state,
            },
          }
      await apiJson("/commerce/checkout", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(checkoutBody),
      })
      await refresh()
      router.push("/orders")
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to place order"
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

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

  if (cartItems.length === 0 || isLoading) {
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
              <CardTitle className="text-lg">How would you like to receive your order?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${formData.deliveryType === "delivery" ? "border-primary bg-secondary" : "border-border"}`}>
                  <input type="radio" name="deliveryType" value="delivery" checked={formData.deliveryType === "delivery"} onChange={() => setFormData({ ...formData, deliveryType: "delivery" })} className="mt-1 accent-primary" />
                  <span><span className="block font-semibold text-text-primary">Deliver to me</span><span className="text-sm text-text-secondary">Enter the address where you want the order delivered.</span></span>
                </label>
                <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${formData.deliveryType === "pickup" ? "border-primary bg-secondary" : "border-border"}`}>
                  <input type="radio" name="deliveryType" value="pickup" checked={formData.deliveryType === "pickup"} onChange={() => setFormData({ ...formData, deliveryType: "pickup" })} className="mt-1 accent-primary" />
                  <span><span className="block font-semibold text-text-primary">Pick up from the vendor</span><span className="text-sm text-text-secondary">Collection details appear after the vendor confirms and prepares your order.</span></span>
                </label>
              </div>
              {formData.deliveryType === "delivery" ? <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Full name"
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  placeholder="Your full name"
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
              </> : <p className="rounded-lg bg-secondary px-4 py-3 text-sm text-secondary-foreground">Your vendor's approved collection point will be shared only when your order is ready. Personal or residential addresses are not shown.</p>}
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader><CardTitle className="text-lg">Payment</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg bg-secondary p-4 text-sm text-secondary-foreground">
                <p className="font-semibold">Payment is handled by Kamba's checkout service.</p>
                <p className="mt-1">No payment is collected in development prototype mode. Orders remain payment-pending until a real provider confirms payment.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card variant="elevated" className="md:sticky md:top-24">
            <CardHeader><CardTitle className="text-lg">Order summary</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-64 space-y-3 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                    <div className="min-w-0"><p className="truncate font-medium text-text-primary">{item.name}</p><p className="text-xs text-text-secondary">Qty {item.quantity}</p></div>
                    <span className="shrink-0 font-medium text-text-primary">{formatKobo(item.price_kobo * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between"><span className="text-text-secondary">Subtotal</span><span>{formatKobo(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Kamba platform fee</span><span>{formatKobo(cart.platform_fee)}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">{formData.deliveryType === 'pickup' ? 'Pickup' : 'Delivery'}</span><span>{formData.deliveryType === 'pickup' ? 'No delivery fee' : shipping > 0 ? formatKobo(shipping) : 'Free'}</span></div>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-4"><span className="font-semibold text-text-primary">Total</span><span className="font-display text-xl font-bold text-primary">{formatKobo(total)}</span></div>
              <p className="text-xs text-text-secondary">Final fees and delivery eligibility are confirmed by the backend before payment.</p>
            </CardContent>
            <CardFooter><Button type="submit" className="w-full" disabled={submitting || cartItems.length === 0}>{submitting ? 'Placing order…' : 'Place order'}</Button></CardFooter>
          </Card>

          <Card variant="outlined" className="p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-coral mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div className="text-sm text-text-secondary space-y-1">
                <p className="font-medium text-text-primary">Secure Checkout</p>
                <p>Card details are handled by Kamba's configured payment provider, not stored by this website.</p>
              </div>
            </div>
          </Card>
        </div>
      </form>
    </div>
  )
}