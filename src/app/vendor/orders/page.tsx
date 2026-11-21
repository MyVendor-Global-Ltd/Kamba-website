'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatKobo, formatDateTime } from '@/lib/formatting'
import { apiJson } from '@/lib/api'

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiJson<{ orders: any[] }>('/vendors/orders')
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
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vendor Orders</h1>
        <p className="text-muted-foreground">Manage orders for your store.</p>
      </div>

      {error && (
        <div className="p-4 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold">Order #{order.order_number}</h3>
                  <p className="text-sm text-muted-foreground">{formatDateTime(order.created_at)}</p>
                </div>
                <Badge variant="outline" className="text-sm">
                  {order.status}
                </Badge>
              </div>
              <div className="mt-4 flex justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">{formatKobo(order.total)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No orders yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
