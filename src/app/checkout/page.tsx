'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { formatKobo } from '@/lib/formatting'
import { apiJson } from '@/lib/api'
import { useCartContext } from '@/context/CartContext'

interface University {
  id: string
  slug: string
  name: string
  city?: string
  state?: string
}
interface DeliveryZone {
  id: string
  name: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, isLoading, refresh } = useCartContext()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deliveryError, setDeliveryError] = useState<string | null>(null)
  const [universities, setUniversities] = useState<University[]>([])
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [universitiesLoading, setUniversitiesLoading] = useState(true)
  const [zonesLoading, setZonesLoading] = useState(false)
  const [selectedUniversityId, setSelectedUniversityId] = useState('')
  const [selectedZoneId, setSelectedZoneId] = useState('')
  const [deliveryQuote, setDeliveryQuote] = useState<number | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [formData, setFormData] = useState({
    recipientName: '',
    phone: '',
    shippingAddress: '',
    city: '',
    state: '',
    deliveryType: 'pickup' as 'delivery' | 'pickup',
  })

  const cartItems = cart.items
  const subtotal = cart.subtotal
  const storeIds = useMemo(() => [...new Set(cartItems.map((item) => item.store_id).filter(Boolean))], [cartItems])
  const shipping = formData.deliveryType === 'pickup' ? 0 : deliveryQuote ?? 0
  const total = subtotal + cart.platform_fee + shipping
  const selectedUniversity = universities.find((university) => university.id === selectedUniversityId)

  useEffect(() => {
    let active = true
    apiJson<{ universities: University[] }>('/delivery/universities')
      .then((data) => { if (active) setUniversities(data.universities || []) })
      .catch((err) => { if (active) setDeliveryError(err instanceof Error ? err.message : 'Could not load delivery coverage.') })
      .finally(() => { if (active) setUniversitiesLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (formData.deliveryType !== 'delivery' || !selectedUniversity) return
    let active = true
    const loadZones = async () => {
      setZonesLoading(true)
      try {
        const data = await apiJson<{ zones: DeliveryZone[] }>(`/delivery/universities/${encodeURIComponent(selectedUniversity.slug)}/zones`)
        if (active) setZones(data.zones || [])
      } catch (err) {
        if (active) setDeliveryError(err instanceof Error ? err.message : 'Could not load delivery zones.')
      } finally {
        if (active) setZonesLoading(false)
      }
    }
    void loadZones()
    return () => { active = false }
  }, [formData.deliveryType, selectedUniversity])

  useEffect(() => {
    if (formData.deliveryType !== 'delivery' || !selectedUniversityId || !selectedZoneId || storeIds.length === 0) return
    let active = true
    const loadQuotes = async () => {
      setQuoteLoading(true)
      setDeliveryError(null)
      try {
        const quotes = await Promise.all(storeIds.map((storeId) => apiJson<{ quote: { buyer_delivery_charge_kobo: number } }>('/delivery/quote', {
          method: 'POST',
          body: JSON.stringify({
            store_id: storeId,
            university_id: selectedUniversityId,
            destination_zone_id: selectedZoneId,
            delivery_mode: 'express',
          }),
        })))
        if (active) setDeliveryQuote(quotes.reduce((sum, result) => sum + Number(result.quote.buyer_delivery_charge_kobo || 0), 0))
      } catch (err) {
        if (active) {
          setDeliveryQuote(null)
          setDeliveryError(err instanceof Error ? err.message : 'Delivery is not available for one or more stores at this destination.')
        }
      } finally {
        if (active) setQuoteLoading(false)
      }
    }
    void loadQuotes()
    return () => { active = false }
  }, [formData.deliveryType, selectedUniversityId, selectedZoneId, storeIds])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (formData.deliveryType === 'delivery') {
        if (!selectedUniversityId || !selectedZoneId || deliveryQuote === null) {
          throw new Error('Select a supported university and delivery zone so Kamba can calculate the delivery charge.')
        }
        if (!formData.recipientName.trim() || !formData.phone.trim() || !formData.shippingAddress.trim() || !formData.city.trim() || !formData.state.trim()) {
          throw new Error('Complete all delivery address fields before continuing.')
        }
      }

      const idempotencyKey = typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `kamba-${Date.now()}-${Math.random().toString(36).slice(2)}`
      const checkoutBody = formData.deliveryType === 'pickup'
        ? { delivery_type: 'pickup' }
        : {
            delivery_type: 'delivery',
            delivery_mode: 'express',
            delivery_address: {
              recipient_name: formData.recipientName.trim(),
              phone: formData.phone.trim(),
              address_line: formData.shippingAddress.trim(),
              city: formData.city.trim(),
              state: formData.state.trim(),
              university_id: selectedUniversityId,
              zone_id: selectedZoneId,
            },
          }

      const result = await apiJson<{ checkout: { id: string }; orders: Array<{ id: string }> }>('/commerce/marketplace-checkouts', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(checkoutBody),
      })
      await refresh()
      router.push(`/checkout/payment?checkout_id=${encodeURIComponent(result.checkout.id)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your checkout. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-8 px-4 py-8 lg:py-12">
        <div className="h-9 w-1/3 animate-pulse rounded-lg bg-surface-muted" />
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2">{[1, 2].map((item) => <div key={item} className="h-48 animate-pulse rounded-xl bg-surface-muted" />)}</div>
          <div className="h-80 animate-pulse rounded-xl bg-surface-muted" />
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 lg:py-24">
        <Card variant="outlined" className="mx-auto max-w-md p-8 text-center">
          <CardContent className="space-y-4">
            <h2 className="text-xl font-semibold text-text-primary">Your cart is empty</h2>
            <p className="text-text-secondary">Add products before starting checkout.</p>
            <Link href="/marketplace/products"><Button className="w-full">Continue shopping</Button></Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      <div className="mb-8 space-y-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary lg:text-4xl">Checkout</h1>
        <p className="text-text-secondary">Choose how to receive your order and review every charge before continuing.</p>
      </div>

      {error && <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive" role="alert">{error}</div>}

      <form onSubmit={handleSubmit} className="grid gap-8 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card variant="elevated">
            <CardHeader><CardTitle className="text-lg">How would you like to receive your order?</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={`flex min-h-24 cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${formData.deliveryType === 'pickup' ? 'border-primary bg-secondary' : 'border-border'}`}>
                  <input type="radio" name="deliveryType" value="pickup" checked={formData.deliveryType === 'pickup'} onChange={() => { setFormData((previous) => ({ ...previous, deliveryType: 'pickup' })); setZones([]); setSelectedZoneId(''); setDeliveryQuote(null); setDeliveryError(null) }} className="mt-1 accent-primary" />
                  <span><span className="block font-semibold text-text-primary">Pick up from the vendor</span><span className="text-sm text-text-secondary">The approved collection point is shared when the order is ready.</span></span>
                </label>
                <label className={`flex min-h-24 cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${formData.deliveryType === 'delivery' ? 'border-primary bg-secondary' : 'border-border'}`}>
                  <input type="radio" name="deliveryType" value="delivery" checked={formData.deliveryType === 'delivery'} onChange={() => { setFormData((previous) => ({ ...previous, deliveryType: 'delivery' })); setDeliveryQuote(null); setDeliveryError(null) }} className="mt-1 accent-primary" />
                  <span><span className="block font-semibold text-text-primary">Deliver to me</span><span className="text-sm text-text-secondary">Choose a supported university and delivery zone.</span></span>
                </label>
              </div>

              {formData.deliveryType === 'pickup' ? (
                <p className="rounded-lg bg-secondary px-4 py-3 text-sm text-secondary-foreground">
                  Your vendor&apos;s approved collection point will only be shown after the order is confirmed and ready. Personal or residential addresses are not exposed.
                </p>
              ) : (
                <div className="space-y-4">
                  {universitiesLoading ? <p className="text-sm text-text-secondary">Loading delivery coverage…</p> : universities.length === 0 ? (
                    <p className="rounded-lg border border-gold-dim bg-gold-soft px-4 py-3 text-sm text-text-primary">No university delivery coverage is configured yet. Choose pickup or ask Kamba to configure your delivery area.</p>
                  ) : (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="block text-sm font-medium text-text-secondary">
                          University
                          <select value={selectedUniversityId} onChange={(event) => { setSelectedUniversityId(event.target.value); setZones([]); setSelectedZoneId(''); setDeliveryQuote(null); setDeliveryError(null) }} required className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary">
                            <option value="">Choose a university</option>
                            {universities.map((university) => <option key={university.id} value={university.id}>{university.name}</option>)}
                          </select>
                        </label>
                        <label className="block text-sm font-medium text-text-secondary">
                          Delivery zone
                          <select value={selectedZoneId} onChange={(event) => { setSelectedZoneId(event.target.value); setDeliveryQuote(null); setDeliveryError(null) }} required disabled={!selectedUniversityId || zonesLoading} className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary disabled:opacity-50">
                            <option value="">{zonesLoading ? 'Loading zones…' : 'Choose a zone'}</option>
                            {zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
                          </select>
                        </label>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input label="Recipient name" value={formData.recipientName} onChange={(event) => setFormData((previous) => ({ ...previous, recipientName: event.target.value }))} placeholder="Full name" required />
                        <Input label="Phone number" type="tel" value={formData.phone} onChange={(event) => setFormData((previous) => ({ ...previous, phone: event.target.value }))} placeholder="080… or +234…" required />
                      </div>
                      <Input label="Delivery address" value={formData.shippingAddress} onChange={(event) => setFormData((previous) => ({ ...previous, shippingAddress: event.target.value }))} placeholder="Street, building and room/flat" required />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input label="City" value={formData.city} onChange={(event) => setFormData((previous) => ({ ...previous, city: event.target.value }))} placeholder="City" required />
                        <Input label="State" value={formData.state} onChange={(event) => setFormData((previous) => ({ ...previous, state: event.target.value }))} placeholder="State" required />
                      </div>
                      {quoteLoading && <p role="status" className="text-sm text-text-secondary">Calculating delivery charges for each store…</p>}
                      {deliveryError && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{deliveryError}</p>}
                      {deliveryQuote !== null && !quoteLoading && <p className="rounded-lg bg-secondary px-4 py-3 text-sm text-secondary-foreground">Delivery quotes are available for all {storeIds.length} store{storeIds.length === 1 ? '' : 's'} in your cart.</p>}
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardHeader><CardTitle className="text-lg">Payment</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-text-secondary">After you create the checkout, Kamba will request payment instructions from its configured payment provider. This website never marks a payment successful; only a verified provider confirmation can do that.</p>
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
                    <div className="min-w-0"><p className="truncate font-medium text-text-primary">{item.name}</p><p className="text-xs text-text-secondary">Qty {item.quantity} · {item.store_name || 'Kamba vendor'}</p></div>
                    <span className="shrink-0 font-medium text-text-primary">{formatKobo(item.price_kobo * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between"><span className="text-text-secondary">Subtotal</span><span>{formatKobo(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Kamba platform fee</span><span>{formatKobo(cart.platform_fee)}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">{formData.deliveryType === 'pickup' ? 'Pickup' : 'Delivery'}</span><span>{formData.deliveryType === 'pickup' ? 'No delivery fee' : quoteLoading ? 'Calculating…' : deliveryQuote !== null ? formatKobo(deliveryQuote) : 'Select a delivery zone'}</span></div>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-4"><span className="font-semibold text-text-primary">Estimated total</span><span className="font-display text-xl font-bold text-primary">{formatKobo(total)}</span></div>
              <p className="text-xs leading-5 text-text-secondary">The server revalidates stock, route availability and all fees when checkout is created. The confirmed total is shown before payment.</p>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={submitting || cartItems.length === 0 || (formData.deliveryType === 'delivery' && (universitiesLoading || !selectedUniversityId || !selectedZoneId || deliveryQuote === null || quoteLoading || Boolean(deliveryError)))}>
                {submitting ? 'Creating checkout…' : 'Continue to payment'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  )
}
