'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatKobo } from '@/lib/formatting'

interface CheckoutFormProps {
  cart: {
    items: Array<{ product_id: string; quantity: number; product?: { name: string; price: number } }>
    subtotal: number
    platform_fee: number
    delivery_fee: number
    total: number
  }
  onSubmit: (data: {
    address: string
    city: string
    state: string
    phone: string
  }) => Promise<void>
  loading: boolean
}

export function CheckoutForm({ cart, onSubmit, loading }: CheckoutFormProps) {
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await onSubmit({ address, city, state, phone })
    } catch (err: any) {
      setError(err.message || 'Checkout failed')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shipping details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded bg-destructive/10 text-destructive text-sm border border-destructive/20">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <Input
              placeholder="123 Street, Lagos"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <Input
                placeholder="Lagos"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">State</label>
              <Input
                placeholder="Lagos"
                value={state}
                onChange={(e) => setState(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone number</label>
            <Input
              type="tel"
              placeholder="+234 801 234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm border-t pt-4">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatKobo(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform fee</span>
              <span>{formatKobo(cart.platform_fee)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery fee</span>
              <span>{formatKobo(cart.delivery_fee)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-4">
              <span>Total</span>
              <span>{formatKobo(cart.total)}</span>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Placing order...' : 'Place order'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
