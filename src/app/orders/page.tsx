'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiJson } from '@/lib/api'
import { formatKobo, formatDateTime, formatOrderStatus } from '@/lib/formatting'
import { useToast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Filter, RotateCcw, RefreshCw, X } from 'lucide-react'
import { useCartContext } from '@/context/CartContext'

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  delivery_status?: string
  delivery_type?: 'delivery' | 'pickup'
  total: number
  created_at: string
  item_count?: number
  store_name?: string
  items: Array<{
    id: string
    product_id: string
    product_name: string
    quantity: number
    price: number
    image_url?: string
  }>
}

interface OrderListResponse {
  orders: Array<{
    id: string
    status: string
    subtotal: number
    platform_fee: number
    shipping_amount: number
    total: number
    delivery_type: 'delivery' | 'pickup'
    created_at: string
    store_name?: string
    item_count: number
  }>
}
interface OrderDetailItem {
  product_id: string
  name?: string
  product_name?: string
  quantity: number
  unit_amount?: number
  price?: number
  image_url?: string
}
interface OrderDetailResponse {
  order?: { order_items?: OrderDetailItem[]; items?: OrderDetailItem[] }
  order_items?: OrderDetailItem[]
  items?: OrderDetailItem[]
}

type StatusFilter = 'all' | 'awaiting_payment' | 'paid_held' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'disputed' | 'cancelled'

export default function OrdersPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const { refresh: refreshCart } = useCartContext()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [page, setPage] = useState(1)
  const limit = 10

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiJson<OrderListResponse>('/commerce/orders')
      setOrders((data.orders || []).map((order) => ({
        id: order.id,
        order_number: order.id,
        status: order.status,
        payment_status: order.status === 'paid_held' ? 'held' : 'See order details',
        delivery_status: 'not available',
        delivery_type: order.delivery_type,
        total: order.total,
        created_at: order.created_at,
        item_count: order.item_count,
        store_name: order.store_name,
        items: [],
      })))
      setPage(1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(fetchOrders)
  }, [fetchOrders])

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'all') return true
    if (statusFilter === 'awaiting_payment') return ['pending', 'pending_payment', 'payment_pending'].includes(order.status)
    return order.status === statusFilter
  })
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / limit))
  const visibleOrders = filteredOrders.slice((page - 1) * limit, page * limit)

  const handleReorder = async (order: Order) => {
    try {
      const detail = await apiJson<OrderDetailResponse>(`/commerce/orders/${encodeURIComponent(order.id)}`)
      const raw = detail.order || detail
      const items = raw.order_items || raw.items || order.items
      if (!items.length) throw new Error('The backend did not return the item snapshots required to reorder this purchase.')
      for (const item of items) {
        await apiJson('/commerce/cart/items', {
          method: 'POST',
          body: JSON.stringify({ product_id: item.product_id, quantity: item.quantity }),
        })
      }
      addToast({ type: 'success', title: 'Items added to cart', message: 'Available items from this order have been added to your cart.' })
      await refreshCart()
      router.push('/cart')
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to reorder', message: err instanceof Error ? err.message : 'Please try again.' })
    }
  }



  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'success'
      case 'paid_held':
        return 'warning'
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
      case 'held':
        return 'warning'
      case 'failed':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const canReorder = (status: string) => {
    return ['delivered', 'cancelled'].includes(status.toLowerCase())
  }


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

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8">
      <header className="animate-fade-in flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold font-display text-text-primary">My Orders</h1>
          <p className="text-text-secondary mt-2">Track and manage your purchases.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1) }}
              className="appearance-none pl-10 pr-8 py-2 bg-ink-raised/50 border border-border/50 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent"
            >
              <option value="all">All Orders</option>
              <option value="awaiting_payment">Awaiting payment</option>
              <option value="paid_held">Paid — awaiting vendor</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="disputed">Disputed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-slide-up flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={fetchOrders}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Retry
          </Button>
        </div>
      )}

      <div className="space-y-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
        {visibleOrders.map((order) => (
          <Card key={order.id} variant="elevated">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-text-primary">Order #{order.order_number}</h3>
                    <Badge variant={getStatusVariant(order.status)} size="sm">
                      {formatOrderStatus(order.status)}
                    </Badge>
                    <Badge variant={getPaymentStatusVariant(order.payment_status)} size="sm">
                      {formatOrderStatus(order.payment_status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-text-tertiary">{formatDateTime(order.created_at)} · {order.store_name || 'Kamba vendor'} · {order.delivery_type === 'pickup' ? 'Pickup' : 'Delivery'}</p>
                  <p className="text-sm text-text-secondary mt-1">{order.item_count ?? order.items.length} item{(order.item_count ?? order.items.length) !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:ml-4">
                  <div className="text-right sm:text-left flex-1">
                    <span className="text-text-secondary text-sm">Total</span>
                    <div className="font-bold text-text-primary text-lg">{formatKobo(order.total)}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                    {canReorder(order.status) && (
                      <Button variant="secondary" size="sm" onClick={() => handleReorder(order)}>
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Reorder
                      </Button>
                    )}

                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredOrders.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-ink-raised/50 flex items-center justify-center mx-auto mb-6 text-text-tertiary">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No orders found</h3>
            <p className="text-text-tertiary mb-6">
              {statusFilter !== 'all' ? 'No orders match this filter.' : 'When you place an order, it will appear here.'}
            </p>
            {statusFilter !== 'all' && (
              <Button variant="outline" onClick={() => setStatusFilter('all')}>
                <X className="w-4 h-4 mr-1" />
                Clear filter
              </Button>
            )}
            {statusFilter === 'all' && (
              <Link href="/marketplace/products">
                <Button size="lg">Browse products</Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                  className="w-10 h-10"
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="text-center text-sm text-text-tertiary animate-fade-in" style={{ animationDelay: '300ms' }}>
        Showing {visibleOrders.length} of {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
