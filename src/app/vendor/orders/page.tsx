'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatKobo, formatDateTime } from '@/lib/formatting'
import { apiJson } from '@/lib/api'

interface Order {
  id: string
  order_number: string
  status: string
  total: number
  created_at: string
  items: Array<{
    product_name: string
    quantity: number
    price: number
  }>
}

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiJson<{ orders: Order[] }>('/vendors/orders')
      .then((data) => {
        setOrders(data.orders || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load orders')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8 animate-fade-in">
        <div className="space-y-4 animate-pulse">
          <div className="h-10 w-1/3 bg-ink-raised/50 rounded-lg" />
          <div className="h-6 w-1/2 bg-ink-raised/50 rounded-lg" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} variant="elevated">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="h-5 w-1/4 bg-ink-raised/50 rounded" />
                    <div className="h-4 w-1/3 bg-ink-raised/50 rounded" />
                  </div>
                  <div className="h-6 w-24 bg-ink-raised/50 rounded" />
                </div>
                <div className="mt-4 flex justify-between">
                  <div className="h-4 w-16 bg-ink-raised/50 rounded" />
                  <div className="h-5 w-24 bg-ink-raised/50 rounded" />
                </div>
                          </CardContent>
                        </Card>
          ))}
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

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8">
      <header className="animate-fade-in">
        <h1 className="text-3xl lg:text-4xl font-bold font-display text-text-primary">Vendor Orders</h1>
        <p className="text-text-secondary mt-2">Manage orders for your store.</p>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-slide-up">
          {error}
        </div>
      )}

      <div className="space-y-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
        {orders.map((order) => (
          <Card key={order.id} variant="elevated">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-text-primary">Order #{order.order_number}</h3>
                  <p className="text-sm text-text-tertiary mt-1">{formatDateTime(order.created_at)}</p>
                </div>
                <Badge variant={getStatusVariant(order.status)} size="sm">
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-text-secondary">Total</span>
                <span className="font-bold text-text-primary text-lg">{formatKobo(order.total)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-ink-raised/50 flex items-center justify-center mx-auto mb-6 text-text-tertiary">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No orders yet</h3>
            <p className="text-text-tertiary">When customers place orders, they will appear here.</p>
          </div>
        )}
      </div>
    </div>
  )
}
