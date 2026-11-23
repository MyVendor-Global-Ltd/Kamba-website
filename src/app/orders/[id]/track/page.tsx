'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { apiJson } from '@/lib/api'
import { formatDateTime, formatKobo, formatOrderStatus } from '@/lib/formatting'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, ChevronLeft, Clock, MapPin, Package, RefreshCw, Truck } from 'lucide-react'

interface OrderItem {
  product_id: string
  name: string
  quantity: number
  unit_amount: number
  image_url?: string
}
interface DeliveryAddress {
  recipient_name?: string
  address_line?: string
  city?: string
  state?: string
}
interface ApiOrder {
  id: string
  order_number?: string
  status: string
  payment_status?: string
  delivery_status?: string
  delivery_type: 'pickup' | 'delivery'
  delivery_id?: string | null
  subtotal: number
  platform_fee: number
  shipping_amount: number
  total: number
  created_at: string
  delivery_address?: DeliveryAddress | null
  order_items?: OrderItem[]
  items?: OrderItem[]
}
interface TrackingEvent {
  event_type: string
  note?: string | null
  created_at: string
}
interface Delivery {
  id: string
  status: string
  provider_name?: string | null
  estimated_delivery_at?: string | null
  tracking?: TrackingEvent[]
}

export default function OrderTrackingPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [order, setOrder] = useState<ApiOrder | null>(null)
  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [deliveryError, setDeliveryError] = useState('')

  const loadOrder = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      setError('')
      const data = await apiJson<ApiOrder & { order?: ApiOrder }>(`/commerce/orders/${encodeURIComponent(id)}`)
      const raw = data.order || data
      setOrder(raw)
      setDelivery(null)
      setDeliveryError('')
      if (raw.delivery_type === 'delivery' && raw.delivery_id) {
        try {
          const deliveryData = await apiJson<Delivery & { delivery?: Delivery }>(`/delivery/deliveries/${encodeURIComponent(raw.delivery_id)}`)
          setDelivery(deliveryData.delivery || deliveryData)
        } catch (err) {
          setDeliveryError(err instanceof Error ? err.message : 'Delivery tracking is not available yet.')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this order.')
      setOrder(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [id])

  useEffect(() => {
    void Promise.resolve().then(() => loadOrder(false))
  }, [loadOrder])

  if (loading) {
    return <div className="container mx-auto space-y-5 px-4 py-12"><div className="h-8 w-1/3 animate-pulse rounded bg-surface-muted" /><div className="h-64 animate-pulse rounded-xl bg-surface-muted" /></div>
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card variant="outlined" className="mx-auto max-w-lg p-8 text-center">
          <CardContent className="space-y-4">
            <AlertCircle className="mx-auto h-10 w-10 text-text-tertiary" />
            <h1 className="text-xl font-semibold text-text-primary">Order tracking unavailable</h1>
            <p role="alert" className="text-sm text-text-secondary">{error || 'This order could not be found.'}</p>
            <Link href="/orders"><Button className="w-full">Back to orders</Button></Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const items = order.order_items || order.items || []
  const isPickup = order.delivery_type === 'pickup'

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8 lg:py-12">
      <div className="flex items-center justify-between gap-3">
        <Link href={`/orders/${order.id}`} className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary"><ChevronLeft className="h-4 w-4" /> Order details</Link>
        <Button type="button" size="sm" variant="outline" onClick={() => void loadOrder(true)} disabled={refreshing}><RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh</Button>
      </div>

      <header className="space-y-2">
        <p className="text-sm font-medium text-primary">Order {order.order_number || order.id}</p>
        <h1 className="font-display text-3xl font-bold text-text-primary">Order tracking</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{formatOrderStatus(order.status)}</Badge>
          <Badge variant={order.payment_status === 'succeeded' || order.payment_status === 'paid' ? 'success' : 'warning'}>{formatOrderStatus(order.payment_status || 'unknown')}</Badge>
        </div>
      </header>

      {isPickup ? (
        <Card variant="elevated">
          <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Vendor pickup</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-6 text-text-secondary">This order is for collection. The approved pickup point and one-time verification details are shown only when the vendor marks the order ready.</p>
            <Link href={`/orders/${order.id}/pickup`}><Button>View pickup instructions</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <Card variant="elevated">
          <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /> Delivery progress</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!order.delivery_id ? (
              <p className="rounded-lg bg-secondary p-4 text-sm leading-6 text-secondary-foreground">A delivery provider has not been assigned yet. Tracking information will appear here after the order is dispatched.</p>
            ) : delivery ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><p className="text-xs text-text-tertiary">Delivery status</p><p className="font-semibold text-text-primary">{formatOrderStatus(delivery.status)}</p></div>
                  {delivery.provider_name && <div><p className="text-xs text-text-tertiary">Delivery provider</p><p className="font-medium text-text-primary">{delivery.provider_name}</p></div>}
                </div>
                {delivery.estimated_delivery_at && <p className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">Estimated delivery: {formatDateTime(delivery.estimated_delivery_at)}</p>}
                {delivery.tracking?.length ? (
                  <ol className="space-y-4 border-l border-border pl-4">
                    {delivery.tracking.map((event, index) => (
                      <li key={`${event.event_type}-${event.created_at}-${index}`} className="relative">
                        <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                        <p className="font-medium text-text-primary">{formatOrderStatus(event.event_type)}</p>
                        {event.note && <p className="mt-1 text-sm text-text-secondary">{event.note}</p>}
                        <p className="mt-1 text-xs text-text-tertiary">{formatDateTime(event.created_at)}</p>
                      </li>
                    ))}
                  </ol>
                ) : <p className="text-sm text-text-secondary">The delivery has been created, but no tracking events have been recorded yet.</p>}
              </>
            ) : <p role="status" className="text-sm text-text-secondary">{deliveryError || 'Loading delivery details…'}</p>}
            {deliveryError && <p role="alert" className="text-sm text-text-tertiary">{deliveryError}</p>}
          </CardContent>
        </Card>
      )}

      {order.delivery_address && !isPickup && (
        <Card variant="outlined">
          <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Delivery address</CardTitle></CardHeader>
          <CardContent>
            {order.delivery_address.recipient_name && <p className="font-medium text-text-primary">{order.delivery_address.recipient_name}</p>}
            <p className="text-sm text-text-secondary">{order.delivery_address.address_line}</p>
            <p className="text-sm text-text-secondary">{[order.delivery_address.city, order.delivery_address.state].filter(Boolean).join(', ')}</p>
          </CardContent>
        </Card>
      )}

      <Card variant="outlined">
        <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Items in this order</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => (
            <div key={item.product_id} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0">
              <div className="min-w-0"><p className="font-medium text-text-primary">{item.name}</p><p className="text-xs text-text-secondary">Quantity: {item.quantity}</p></div>
              <span className="shrink-0 text-sm font-semibold text-text-primary">{formatKobo(item.unit_amount * item.quantity)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader><CardTitle>Payment summary</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-text-secondary">Subtotal</span><span>{formatKobo(order.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-text-secondary">Kamba platform fee</span><span>{formatKobo(order.platform_fee)}</span></div>
          <div className="flex justify-between"><span className="text-text-secondary">{isPickup ? 'Pickup' : 'Delivery'}</span><span>{order.shipping_amount > 0 ? formatKobo(order.shipping_amount) : 'No delivery charge'}</span></div>
          <div className="flex justify-between border-t border-border pt-3 font-semibold"><span>Total</span><span className="text-primary">{formatKobo(order.total)}</span></div>
          <p className="flex items-center gap-2 pt-2 text-xs text-text-tertiary"><Clock className="h-3.5 w-3.5" /> Placed {formatDateTime(order.created_at)}</p>
        </CardContent>
      </Card>
    </div>
  )
}
