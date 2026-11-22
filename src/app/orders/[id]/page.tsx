'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiJson } from '@/lib/api'
import { formatKobo, formatDateTime } from '@/lib/formatting'

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  price: number
  image_url?: string
}

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  delivery_status: string
  subtotal: number
  platform_fee: number
  delivery_fee: number
  total: number
  created_at: string
  items: OrderItem[]
}

export default function OrderDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiJson<{ order: Order }>(`/commerce/orders/${id}`)
      .then((data) => {
        setOrder(data.order)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load order')
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8 animate-fade-in">
        <div className="space-y-4 animate-pulse">
          <div className="h-10 w-1/3 bg-ink-raised/50 rounded-lg" />
          <div className="h-6 w-1/2 bg-ink-raised/50 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} variant="elevated">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-ink-raised/50 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 w-1/3 bg-ink-raised/50 rounded" />
                      <div className="h-4 w-1/4 bg-ink-raised/50 rounded" />
                    </div>
                    <div className="h-6 w-24 bg-ink-raised/50 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="lg:col-span-1">
            <Card variant="elevated">
              <CardContent className="space-y-4 p-4">
                <div className="h-6 w-1/3 bg-ink-raised/50 rounded" />
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <div className="h-4 w-1/3 bg-ink-raised/50 rounded" />
                      <div className="h-4 w-1/4 bg-ink-raised/50 rounded" />
                    </div>
                  ))}
                </div>
                <div className="h-6 w-full bg-ink-raised/50 rounded border-t border-ink-raised/30 pt-4" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 lg:py-12 flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-ink-raised/50 flex items-center justify-center mx-auto mb-4 text-text-tertiary">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Order not found</h2>
          <p className="text-text-tertiary">The order you're looking for doesn't exist.</p>
          <Link href="/orders" className="mt-4 inline-block">
            <Button variant="outline">Back to orders</Button>
          </Link>
        </div>
      </div>
    )
  }

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'success'
      case 'shipped':
      case 'processing':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getPaymentStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'success'
      case 'pending':
        return 'secondary'
      case 'failed':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8">
      <header className="animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold font-display text-text-primary">Order #{order.order_number}</h1>
          <p className="text-text-secondary mt-2">{formatDateTime(order.created_at)}</p>
        </div>
        <Badge variant={getStatusVariant(order.status)} size="md">
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-slide-up">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="lg:col-span-2 space-y-6">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-text-primary">Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(order.items || []).map((item) => (
                <div key={item.id} className="flex gap-4 border-b border-ink-raised/30 pb-4 last:border-0 last:pb-0">
                  <div className="w-16 h-16 bg-ink-raised/50 rounded-xl flex-shrink-0 overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-text-primary truncate">{item.product_name}</h4>
                    <p className="text-sm text-text-tertiary">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-medium text-text-primary whitespace-nowrap">{formatKobo(item.price * item.quantity)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card variant="elevated" className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-text-primary">Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 border-b border-ink-raised/30 pb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="text-text-primary font-medium">{formatKobo(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Platform fee</span>
                  <span className="text-text-primary font-medium">{formatKobo(order.platform_fee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Delivery fee</span>
                  <span className="text-text-primary font-medium">{formatKobo(order.delivery_fee)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold font-display text-text-primary border-t border-ink-raised/30 pt-4">
                  <span>Total</span>
                  <span>{formatKobo(order.total)}</span>
                </div>
              </div>
              <div className="space-y-4 pt-2 border-t border-ink-raised/30">
                <div>
                  <p className="text-sm text-text-tertiary mb-1">Payment status</p>
                  <Badge variant={getPaymentStatusVariant(order.payment_status)} size="sm">
                    {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-text-tertiary mb-1">Delivery status</p>
                  <Badge variant={getStatusVariant(order.delivery_status)} size="sm">
                    {order.delivery_status.charAt(0).toUpperCase() + order.delivery_status.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
