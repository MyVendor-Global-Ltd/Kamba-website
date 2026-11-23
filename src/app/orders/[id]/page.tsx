'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiJson } from '@/lib/api'
import { formatKobo, formatDateTime, formatOrderStatus } from '@/lib/formatting'
import { useToast } from '@/components/ui/toast'
import { ChevronLeft, ChevronRight, Truck, Package, CheckCircle, Clock, MapPin, RotateCcw, X, RefreshCw, RefreshCcw } from 'lucide-react'

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
  delivery_type?: 'delivery' | 'pickup'
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
  tracking?: {
    number: string
    carrier: string
    url: string
    events: Array<{
      timestamp: string
      status: string
      location: string
      description: string
    }>
  }
}

const statusSteps = [
  { key: 'pending', label: 'Order Placed', icon: Package },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'processing', label: 'Processing', icon: Clock },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: MapPin },
]

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { addToast } = useToast()
  const id = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'details' | 'tracking'>('details')

  useEffect(() => {
    apiJson<{ order: Order }>(`/commerce/orders/${id}`)
      .then((data) => {
        setOrder(data.order)
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load order')
        setLoading(false)
      })
  }, [id])

  const handleReorder = async () => {
    if (!order) return
    try {
      for (const item of order.items) {
        await apiJson('/commerce/cart/items', {
          method: 'POST',
          body: JSON.stringify({
            product_id: item.product_id,
            quantity: item.quantity,
            name: item.product_name,
            price_kobo: item.price,
            image_url: item.image_url,
          }),
        })
      }
      addToast({
        type: 'success',
        title: 'Items added to cart',
        message: 'All items from this order have been added to your cart.',
      })
      router.push('/cart')
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Failed to reorder',
        message: err instanceof Error ? err.message : 'Please try again.',
      })
    }
  }

  const handleRequestReturn = async () => {
    if (!order) return
    if (!confirm('Are you sure you want to request a return for this order?')) return
    try {
      throw new Error('Return-request submission is not part of the currently documented commerce API contract. Please contact Kamba support for this order.')
      addToast({
        type: 'success',
        title: 'Return requested',
        message: 'Your return request has been submitted. We\'ll contact you shortly.',
      })
      setOrder({ ...order, status: 'return_requested' })
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Failed to request return',
        message: 'Please try again.',
      })
    }
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
      case 'return_requested':
        return 'warning'
      default:
        return 'outline'
    }
  }

  const getPaymentStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'success'
      case 'pending':
        return 'warning'
      case 'failed':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getCurrentStepIndex = (status: string) => {
    const index = statusSteps.findIndex(s => s.key === status.toLowerCase())
    return index >= 0 ? index : 0
  }

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
          <p className="text-text-tertiary">The order you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/orders" className="mt-4 inline-block">
            <Button variant="outline">Back to orders</Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentStepIndex = getCurrentStepIndex(order.status)

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8">
      {order.delivery_type === 'pickup' && (
        <Card variant="outlined">
          <CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>Vendor pickup</CardTitle><Badge variant="outline">Collection workflow</Badge></div></CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-text-secondary">Your order is set for vendor pickup. The approved collection point and one-time pickup code become available only after the vendor confirms and prepares the order.</p>
            <Link href={`/orders/${order.id}/pickup`} className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">View pickup details</Link>
          </CardContent>
        </Card>
      )}
      <header className="animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold font-display text-text-primary">Order #{order.order_number}</h1>
          <p className="text-text-secondary mt-2">{formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={getStatusVariant(order.status)} size="md">
            {formatOrderStatus(order.status)}
          </Badge>
          <Badge variant={getPaymentStatusVariant(order.payment_status)} size="md">
            {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
          </Badge>
        </div>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-slide-up flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={() => router.refresh()}>
                      <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {/* Order Progress Timeline */}
      <Card variant="elevated" className="animate-slide-up" style={{ animationDelay: '100ms' }}>
        <CardHeader>
          <CardTitle className="text-text-primary">Order Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-ink-raised/30" aria-hidden="true" />
            
            <div className="flex items-start gap-4">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= currentStepIndex
                const isCurrent = index === currentStepIndex && order.status.toLowerCase() !== 'cancelled' && order.status.toLowerCase() !== 'return_requested'
                const Icon = step.icon
                
                return (
                  <div key={step.key} className="flex flex-col items-center flex-1 relative">
                    <div className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted ? 'bg-coral text-ink' : 'bg-ink-raised/50 border-2 border-border'
                    } ${isCurrent ? 'ring-4 ring-coral/20 animate-pulse' : ''}`}>
                      {isCompleted ? (
                        <CheckCircle className="w-8 h-8" />
                      ) : (
                        <Icon className={`w-6 h-6 ${isCompleted ? 'text-ink' : 'text-text-tertiary'}`} />
                      )}
                    </div>
                    <p className={`mt-2 text-center text-sm font-medium ${isCompleted ? 'text-text-primary' : 'text-text-tertiary'}`}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <p className="text-center text-xs text-coral font-medium">Current</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Cancelled/Return status message */}
          {(order.status.toLowerCase() === 'cancelled' || order.status.toLowerCase() === 'return_requested') && (
            <div className="mt-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-3">
                <X className="w-5 h-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">
                    {order.status.toLowerCase() === 'cancelled' ? 'This order has been cancelled' : 'Return requested for this order'}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {order.status.toLowerCase() === 'cancelled' 
                      ? 'If you have questions, please contact support.' 
                      : 'We\'ll contact you shortly with return instructions.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="flex border-b border-ink-raised/30">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details' 
                ? 'border-coral text-coral' 
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            Order Details
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'tracking' 
                ? 'border-coral text-coral' 
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            Tracking
          </button>
        </div>

        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Items */}
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="text-text-primary">Items ({order.items.length})</CardTitle>
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

              {/* Shipping Address */}
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="text-text-primary flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-coral" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <address className="text-text-secondary not-italic space-y-1">
                    <p className="font-medium text-text-primary">{order.shipping_address?.address}</p>
                    <p>{order.shipping_address?.city}, {order.shipping_address?.state}</p>
                  </address>
                                </CardContent>
                              </Card>
            </div>

            <div className="lg:col-span-1 space-y-6">
              {/* Order Summary */}
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="text-text-primary">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 border-b border-ink-raised/30 pb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Subtotal</span>
                      <span className="text-text-primary font-medium">{formatKobo(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Platform fee (5%)</span>
                      <span className="text-text-primary font-medium">{formatKobo(order.platform_fee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Delivery fee</span>
                      <span className="text-text-primary font-medium">{order.delivery_fee > 0 ? formatKobo(order.delivery_fee) : 'Free'}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold font-display text-text-primary border-t border-ink-raised/30 pt-3">
                      <span>Total</span>
                      <span className="text-coral">{formatKobo(order.total)}</span>
                    </div>
                  </div>
                  <div className="space-y-4 pt-2 border-t border-ink-raised/30">
                    <div>
                      <p className="text-sm text-text-tertiary mb-1">Payment method</p>
                      <p className="text-text-primary capitalize">{order.payment_method.replace('_', ' ')}</p>
                    </div>
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

              {/* Actions */}
              <Card variant="elevated">
                <CardContent className="space-y-3">
                  <Link href={`/marketplace/products/${order.items[0]?.product_id}`}>
                    <Button variant="outline" className="w-full">
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      View Product
                    </Button>
                  </Link>
                  {(order.status.toLowerCase() === 'delivered' || order.status.toLowerCase() === 'cancelled') && (
                    <Button variant="secondary" className="w-full" onClick={handleReorder}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reorder Items
                    </Button>
                  )}
                  {order.status.toLowerCase() === 'delivered' && order.delivery_status.toLowerCase() === 'delivered' && (
                    <Button variant="outline" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30" onClick={handleRequestReturn}>
                      <Truck className="w-4 h-4 mr-2" />
                      Request Return
                    </Button>
                  )}
                </CardContent>
                              </Card>
            </div>
          </div>
        )}

        {activeTab === 'tracking' && (
          <div className="mt-6 space-y-6">
            {order.tracking ? (
              <>
                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle className="text-text-primary flex items-center gap-2">
                      <Truck className="w-5 h-5 text-coral" />
                      Shipment Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4 p-4 bg-ink-raised/30 rounded-lg">
                      <div>
                        <p className="text-sm text-text-tertiary">Tracking Number</p>
                        <p className="font-mono text-text-primary">{order.tracking.number}</p>
                      </div>
                      <div>
                        <p className="text-sm text-text-tertiary">Carrier</p>
                        <p className="font-medium text-text-primary">{order.tracking.carrier}</p>
                      </div>
                      {order.tracking.url && (
                        <a href={order.tracking.url} target="_blank" rel="noopener noreferrer" className="ml-auto">
                          <Button variant="outline" size="sm">
                            View on Carrier Site
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </a>
                      )}
                    </div>
                    
                    {/* Tracking Events */}
                    <div className="relative">
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-ink-raised/30" aria-hidden="true" />
                      
                      {order.tracking.events.map((event, index) => (
                        <div key={index} className="flex gap-4 relative">
                          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-coral text-ink' : 'bg-ink-raised/50 border-2 border-border'
                          }`}>
                            {index === 0 ? (
                              <CheckCircle className="w-6 h-6" />
                            ) : (
                              <Truck className="w-5 h-5 text-text-tertiary" />
                            )}
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="font-medium text-text-primary">{event.status}</p>
                            <p className="text-sm text-text-tertiary">{event.location}</p>
                            <p className="text-sm text-text-secondary">{event.description}</p>
                            <p className="text-xs text-text-tertiary mt-1">{formatDateTime(event.timestamp)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                                  </Card>
              </>
            ) : (
              <Card variant="outlined">
                <CardContent className="p-8 text-center">
                  <Truck className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">No tracking information yet</h3>
                  <p className="text-text-secondary mb-4">
                    Tracking details will appear here once your order ships.
                  </p>
                  <p className="text-sm text-text-tertiary">
                    Current status: <span className="font-medium text-text-primary capitalize">{formatOrderStatus(order.status)}</span>
                  </p>
                </CardContent>
                              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
