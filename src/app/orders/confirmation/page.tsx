'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatKobo } from '@/lib/formatting'
import { apiJson } from '@/lib/api'

interface Order {
  id: string
  items: Array<{
    name: string
    quantity: number
    price_kobo: number
    image_url?: string
  }>
  shipping_address: {
    address: string
    city: string
    state: string
  }
  payment_method: string
  subtotal: number
  platform_fee: number
  delivery_fee: number
  total: number
  status: string
  payment_status: string
  created_at: string
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) {
      void Promise.resolve().then(() => {
        setError('No order ID provided')
        setLoading(false)
      })
      return
    }

    async function fetchOrder() {
      try {
        const data = await apiJson<{ order: Order }>(`/commerce/orders/${orderId}`)
        setOrder(data.order)
      } catch (err) {
        console.error('Failed to fetch order:', err)
        setError('Failed to load order details')
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 lg:py-24 animate-fade-in">
        <div className="max-w-2xl mx-auto space-y-8 animate-pulse">
          <div className="text-center space-y-4">
            <div className="h-10 w-1/3 bg-ink-raised/50 rounded-lg mx-auto" />
            <div className="h-6 w-1/2 bg-ink-raised/50 rounded-lg mx-auto" />
          </div>
          <Card variant="elevated">
            <CardContent className="p-6 space-y-4">
              <div className="h-6 w-1/4 bg-ink-raised/50 rounded mx-auto" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-ink-raised/50 rounded" />
                <div className="h-4 w-full bg-ink-raised/50 rounded" />
              </div>
              <div className="h-4 w-full bg-ink-raised/50 rounded" />
              <div className="h-10 w-full bg-ink-raised/50 rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-16 lg:py-24 animate-fade-in">
        <Card variant="outlined" className="max-w-md mx-auto text-center p-8">
          <CardContent className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Order Not Found</h2>
              <p className="text-text-secondary mt-1">{error || 'Unable to load order details'}</p>
            </div>
            <Link href="/marketplace">
              <Button className="w-full">Continue Shopping</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>
      case 'confirmed':
        return <Badge variant="success">Confirmed</Badge>
      case 'processing':
        return <Badge variant="secondary">Processing</Badge>
      case 'shipped':
        return <Badge variant="info">Shipped</Badge>
      case 'delivered':
        return <Badge variant="success">Delivered</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>
      case 'paid':
        return <Badge variant="success">Paid</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      case 'refunded':
        return <Badge variant="info">Refunded</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 animate-fade-in">
      {/* Success Header */}
      <div className="text-center mb-12 animate-slide-up">
        <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold font-display text-text-primary mb-2">Order Confirmed!</h1>
        <p className="text-text-secondary text-lg">Thank you for your order. We&apos;ll send a confirmation to your email.</p>
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-coral-dim text-coral font-medium">
          <span className="font-mono text-sm">Order #{order.id}</span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a2 2 0 00-2-2H6a2 2 0 00-2 2v18a2 2 0 002 2h12a2 2 0 002-2v-4" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11l2 2m0 0l2-2m-2 2l-2-2" />
                </svg>
                Order Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-4 pb-4 last:pb-0 last:border-0 border-b border-ink-raised/30">
                  <div className="w-16 h-16 bg-ink-raised/50 rounded-xl flex-shrink-0 overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="font-medium text-text-primary truncate">{item.name}</h4>
                    <p className="text-sm text-text-secondary">Qty: {item.quantity}</p>
                    <p className="text-sm font-medium text-text-primary">{formatKobo(item.price_kobo * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Shipping & Payment Info */}
          <div className="grid gap-6 sm:grid-cols-2">
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <address className="text-text-secondary not-italic space-y-1">
                  <p className="font-medium text-text-primary">{order.shipping_address.address}</p>
                  <p>{order.shipping_address.city}, {order.shipping_address.state}</p>
                </address>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <svg className="w-5 h-5 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-6 bg-ink rounded flex items-center justify-center text-xs font-mono text-text-tertiary">
                    {order.payment_method.toUpperCase()}
                  </div>
                  <span className="text-text-primary font-medium capitalize">{order.payment_method.replace('_', ' ')}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Status */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <svg className="w-5 h-5 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {getStatusBadge(order.status)}
                <span className="text-text-secondary">Payment: </span>
                {getPaymentStatusBadge(order.payment_status)}
              </div>
              <p className="text-sm text-text-tertiary mt-2">Placed on {new Date(order.created_at).toLocaleDateString('en-NG', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Subtotal</span>
                <span className="text-text-primary">{formatKobo(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Platform fee (5%)</span>
                <span className="text-text-primary">{formatKobo(order.platform_fee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Delivery fee</span>
                <span className="text-text-primary">{order.delivery_fee > 0 ? formatKobo(order.delivery_fee) : 'Free'}</span>
              </div>
              <div className="flex justify-between text-lg font-bold font-display text-text-primary border-t border-ink-raised/30 pt-3">
                <span>Total</span>
                <span className="text-coral">{formatKobo(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          <Card variant="outlined" className="p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-coral mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div className="text-sm text-text-secondary space-y-1">
                <p className="font-medium text-text-primary">What happens next?</p>
                <p>We&apos;ll confirm your order and notify you when it ships. Track your order in <Link href="/orders" className="text-coral hover:underline">My Orders</Link>.</p>
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-3">
            <Link href="/orders">
              <Button variant="outline" className="w-full">
                View All Orders
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="default" className="w-full">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return <Suspense fallback={<div className="container mx-auto px-4 py-12"><div className="h-48 animate-pulse rounded-xl bg-surface-muted" /></div>}><OrderConfirmationContent /></Suspense>
}
