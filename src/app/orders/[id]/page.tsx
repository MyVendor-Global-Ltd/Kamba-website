'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatKobo, formatDateTime } from '@/lib/formatting'
import { apiJson } from '@/lib/api'
import { Order } from '@/types/commerce'

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
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Order not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Order #{order.order_number}</h1>
          <p className="text-muted-foreground">{formatDateTime(order.created_at)}</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {order.status}
        </Badge>
      </div>

      {error && (
        <div className="p-4 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(order.items || []).map((item) => (
                <div key={item.id} className="flex gap-4 border-b pb-4 last:border-0">
                  <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center text-muted-foreground text-xs">
                    {item.product_id.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.product?.name || 'Product'}</h4>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-medium">{formatKobo(item.price * item.quantity)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatKobo(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Platform fee</span>
                <span>{formatKobo(order.platform_fee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery fee</span>
                <span>{formatKobo(order.delivery_fee)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-4">
                <span>Total</span>
                <span>{formatKobo(order.total)}</span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Payment status</p>
                <p className="font-medium">{order.payment_status}</p>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Delivery status</p>
                <p className="font-medium">{order.delivery_status}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
