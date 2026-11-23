'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatKobo, formatDateTime, formatOrderStatus } from '@/lib/formatting'
import { apiJson } from '@/lib/api'
import { useToast } from '@/components/ui/toast'
import { Search, Filter, ChevronDown, ChevronUp, Truck, Package, CheckCircle, Clock, X, MoreHorizontal, Eye, Edit } from 'lucide-react'

interface OrderItem {
  id: string
  product_id: string
  product_name: string
  quantity: number
  price: number
  image_url?: string
}

interface VendorOrderDetailItem {
  product_id: string
  name?: string
  product_name?: string
  image_url?: string
  unit_amount?: number
  price?: number
  quantity: number
}
interface VendorOrderDetail {
  order_items?: VendorOrderDetailItem[]
  items?: VendorOrderDetailItem[]
  delivery_address?: { address_line?: string; city?: string; state?: string; recipient_name?: string } | null
  payment_status?: string
  delivery_status?: string
  payment_method?: string
}
interface VendorOrderDetailResponse extends VendorOrderDetail {
  order?: VendorOrderDetail
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
  updated_at: string
  shipping_address: {
    address: string
    city: string
    state: string
  }
  payment_method: string
  items: OrderItem[]
  customer: { name: string }
  item_count?: number
  delivery_type?: 'pickup' | 'delivery'
}

const statusFlow = [
  { key: 'paid_held', label: 'Paid — awaiting confirmation', next: 'confirmed' },
  { key: 'confirmed', label: 'Confirmed', next: 'processing' },
  { key: 'processing', label: 'Processing', next: 'shipped' },
  { key: 'shipped', label: 'Shipped', next: null },
  { key: 'delivered', label: 'Delivered', next: null },
  { key: 'cancelled', label: 'Cancelled', next: null },
]

const statusColors: Record<string, NonNullable<React.ComponentProps<typeof Badge>['variant']>> = {
  paid_held: 'warning',
  confirmed: 'secondary',
  processing: 'secondary',
  shipped: 'secondary',
  delivered: 'success',
  cancelled: 'destructive',
}

export default function VendorOrdersPage() {
  const { addToast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'total'>('newest')
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [loadingOrderDetails, setLoadingOrderDetails] = useState<string | null>(null)
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      const data = await apiJson<{ orders: Array<{
        id: string
        status: string
        total?: number
        total_amount?: number
        subtotal: number
        platform_fee: number
        shipping_amount: number
        delivery_type: 'pickup' | 'delivery'
        created_at: string
        store_name?: string
        item_count: number
      }> }>('/commerce/vendor/orders', { params: { limit: 100, offset: 0 } })
      setOrders((data.orders || []).map((order) => ({
        id: order.id,
        order_number: order.id,
        status: order.status,
        payment_status: order.status === 'paid_held' ? 'held' : 'status managed by Kamba',
        delivery_status: 'not available',
        delivery_type: order.delivery_type,
        subtotal: order.subtotal,
        platform_fee: order.platform_fee,
        delivery_fee: order.shipping_amount,
        total: Number(order.total ?? order.total_amount ?? 0),
        created_at: order.created_at,
        updated_at: order.created_at,
        shipping_address: { address: order.delivery_type === 'pickup' ? 'Vendor pickup' : 'Open order details for the delivery address', city: '', state: '' },
        payment_method: 'Managed by Kamba',
        customer: { name: 'Buyer details protected' },
        item_count: order.item_count,
        items: [],
      })))
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadOrders)
  }, [loadOrders])

  const filteredOrders = orders
    .filter(order => {
      if (statusFilter !== 'all' && order.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          order.order_number.toLowerCase().includes(query) ||
          order.customer.name.toLowerCase().includes(query) ||
          order.items.some(item => item.product_name.toLowerCase().includes(query))
        )
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'total':
          return b.total - a.total
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId)
    try {
      await apiJson(`/commerce/vendor/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, status: newStatus, updated_at: new Date().toISOString() } : order
      ))
      addToast({
        type: 'success',
        title: 'Order updated',
        message: `Order status changed to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}.`,
      })
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Failed to update',
        message: err instanceof Error ? err.message : 'Please try again.',
      })
    } finally {
      setUpdatingOrder(null)
    }
  }

  const getNextStatus = (currentStatus: string) => {
    const current = statusFlow.find(s => s.key === currentStatus.toLowerCase())
    return current?.next || null
  }

  const handleBulkAction = async (action: string) => {
    if (selectedOrders.length === 0) return
    const targetStatus: Record<string, string> = { confirm: 'confirmed', process: 'processing', ship: 'shipped' }
    const target = targetStatus[action]
    if (!target) return
    const eligible = orders.filter(order => order.delivery_type !== 'pickup' && selectedOrders.includes(order.id) && getNextStatus(order.status) === target)
    if (eligible.length === 0) {
      addToast({ type: 'error', title: 'No eligible orders', message: 'Selected orders must be at the immediately preceding status before this action.' })
      return
    }
    try {
      await Promise.all(eligible.map(order => apiJson(`/commerce/vendor/orders/${order.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: target }),
      })))
      addToast({
        type: 'success',
        title: 'Bulk action completed',
        message: `${eligible.length} eligible orders moved to ${target}.`,
      })
      setSelectedOrders([])
      void loadOrders()
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Failed to complete bulk action',
        message: err instanceof Error ? err.message : 'Please try again.',
      })
    }
  }

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id))
    }
  }

  const toggleOrderDetails = async (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null)
      return
    }
    setExpandedOrder(orderId)
    const existing = orders.find((order) => order.id === orderId)
    if (existing && existing.items.length > 0) return

    setLoadingOrderDetails(orderId)
    try {
      const data = await apiJson<VendorOrderDetailResponse>(`/commerce/orders/${encodeURIComponent(orderId)}`)
      const raw = data.order || data
      const items = (raw.order_items || raw.items || []).map((item) => ({
        id: item.product_id,
        product_id: item.product_id,
        product_name: item.name || item.product_name || 'Product',
        quantity: item.quantity,
        price: Number(item.unit_amount ?? item.price ?? 0),
        image_url: item.image_url,
      }))
      setOrders((previous) => previous.map((order) => order.id === orderId ? {
        ...order,
        items,
        shipping_address: raw.delivery_address ? {
          address: raw.delivery_address.address_line || '',
          city: raw.delivery_address.city || '',
          state: raw.delivery_address.state || '',
        } : order.shipping_address,
        customer: { name: raw.delivery_address?.recipient_name || order.customer.name },
        payment_status: raw.payment_status || order.payment_status,
        delivery_status: raw.delivery_status || order.delivery_status,
        payment_method: raw.payment_method || order.payment_method,
      } : order))
    } catch (err) {
      addToast({ type: 'error', title: 'Could not load order details', message: err instanceof Error ? err.message : 'Please try again.' })
    } finally {
      setLoadingOrderDetails(null)
    }
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
      <header className="animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold font-display text-text-primary">Vendor Orders</h1>
          <p className="text-text-secondary mt-2">Manage orders for your store.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg bg-ink-raised/50 border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-coral"
          >
            <option value="all">All Statuses</option>
            <option value="paid_held">Paid — awaiting confirmation</option><option value="pending">Pending payment</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="return_requested">Return Requested</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'total')}
            className="px-4 py-2 rounded-lg bg-ink-raised/50 border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-coral"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="total">Highest Total</option>
          </select>
        </div>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-slide-up">
          {error}
        </div>
      )}

      {selectedOrders.length > 0 && (
        <div className="animate-slide-up bg-coral/10 border border-coral/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-text-primary font-medium">
            {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('confirm')}>
              Confirm
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('process')}>
              Process
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkAction('ship')}>
              Ship
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedOrders([])}>
              Clear
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
        {filteredOrders.map((order) => {
          const isExpanded = expandedOrder === order.id
          const nextStatus = getNextStatus(order.status)
          const canAdvance = order.delivery_type !== 'pickup' && nextStatus && !['delivered', 'cancelled', 'return_requested'].includes(order.status.toLowerCase())
          const variant = statusColors[order.status.toLowerCase()] || 'outline'

          return (
            <Card key={order.id} variant="elevated" className={selectedOrders.includes(order.id) ? 'ring-2 ring-coral/50' : ''}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => toggleSelectOrder(order.id)}
                      disabled={order.delivery_type === 'pickup'}
                      aria-label={order.delivery_type === 'pickup' ? 'Pickup orders are managed in the pickup desk' : `Select order ${order.order_number}`}
                      className="w-4 h-4 rounded border-border text-coral focus:ring-coral"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-text-primary">Order #{order.order_number}</h3>
                        <Badge variant={variant} size="sm">
                          {formatOrderStatus(order.status)}
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {order.payment_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-text-tertiary mt-1">
                        {formatDateTime(order.created_at)} • {order.item_count ?? order.items.length} item{(order.item_count ?? order.items.length) !== 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-text-secondary mt-1">
                        {order.customer.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="text-right">
                      <p className="font-bold text-text-primary text-lg">{formatKobo(order.total)}</p>
                      <p className="text-sm text-text-tertiary">Subtotal: {formatKobo(order.subtotal)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => void toggleOrderDetails(order.id)}>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setExpandedOrder(isExpanded ? null : order.id)} aria-label="View order details" disabled={loadingOrderDetails === order.id}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expandable Order Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-ink-raised/30 animate-slide-down">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Items */}
                      <div className="md:col-span-2">
                        <h4 className="font-medium text-text-primary mb-3">Items</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {order.items.length > 0 ? order.items.map((item) => (
                            <div key={item.id} className="flex gap-3 p-3 bg-ink-raised/30 rounded-lg">
                              <div className="w-12 h-12 bg-ink-raised/50 rounded-lg flex-shrink-0 overflow-hidden">
                                {item.image_url ? (
                                  <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                                    <Package className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-text-primary truncate">{item.product_name}</p>
                                <p className="text-sm text-text-tertiary">Qty: {item.quantity} × {formatKobo(item.price)}</p>
                              </div>
                              <span className="font-medium text-text-primary whitespace-nowrap">{formatKobo(item.price * item.quantity)}</span>
                            </div>
                          )) : <p className="rounded-lg bg-surface-muted p-3 text-sm text-text-secondary">Item details are available in the order record. The vendor list API currently returns item counts only.</p>}
                        </div>
                      </div>

                      {/* Shipping Address */}
                      <div>
                        <h4 className="font-medium text-text-primary mb-3">{order.delivery_type === 'pickup' ? 'Collection method' : 'Delivery address'}</h4>
                        <address className="text-text-secondary not-italic space-y-1 bg-ink-raised/30 p-3 rounded-lg">
                          <p className="font-medium text-text-primary">{order.shipping_address?.address}</p>
                          <p>{order.shipping_address?.city}, {order.shipping_address?.state}</p>
                        </address>
                      </div>

                      {/* Payment Info */}
                      <div>
                        <h4 className="font-medium text-text-primary mb-3">Payment</h4>
                        <div className="space-y-2 bg-ink-raised/30 p-3 rounded-lg">
                          <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Method</span>
                            <span className="text-text-primary capitalize">{order.payment_method}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Platform Fee</span>
                            <span className="text-text-primary">{formatKobo(order.platform_fee)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-text-secondary">Delivery Fee</span>
                            <span className="text-text-primary">{order.delivery_fee > 0 ? formatKobo(order.delivery_fee) : order.delivery_type === 'pickup' ? 'Pickup' : 'Not available'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Actions */}
                    <div className="mt-4 pt-4 border-t border-ink-raised/30">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-text-secondary">{order.delivery_type === 'pickup' ? 'Pickup workflow:' : 'Update Status:'}</span>
                        {order.delivery_type === 'pickup' ? (
                          <Link href="/vendor/pickup" className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground">Open pickup desk</Link>
                        ) : canAdvance && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(order.id, nextStatus!)}
                            disabled={updatingOrder === order.id}
                          >
                            {updatingOrder === order.id ? (
                              <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                                Updating...
                              </span>
                            ) : (
                              `Mark as ${nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}`
                            )}
                          </Button>
                        )}
                        {order.status.toLowerCase() === 'delivered' && (
                          <Badge variant="success" size="sm">Completed</Badge>
                        )}
                        {order.status.toLowerCase() === 'cancelled' && (
                          <Badge variant="destructive" size="sm">Cancelled</Badge>
                        )}
                        {order.status.toLowerCase() === 'return_requested' && (
                          <Badge variant="warning" size="sm">Return Requested</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {filteredOrders.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-ink-raised/50 flex items-center justify-center mx-auto mb-6 text-text-tertiary">
              <Package className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {searchQuery || statusFilter !== 'all' ? 'No matching orders' : 'No orders yet'}
            </h3>
            <p className="text-text-tertiary">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'When customers place orders, they will appear here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
