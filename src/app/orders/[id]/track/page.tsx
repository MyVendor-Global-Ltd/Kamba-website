'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatKobo } from '@/lib/formatting'
import { 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Circle, 
  AlertCircle,
  Phone,
  MessageSquare,
  Navigation,
  Package,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Map,
  Home,
  Building2,
} from 'lucide-react'

interface OrderItem {
  id: string
  name: string
  price_kobo: number
  quantity: number
  image_url?: string
  store_id: string
  store_name?: string
}

interface Order {
  id: string
  order_number: string
  status: string
  subtotal_kobo: number
  delivery_fee_kobo: number
  platform_fee_kobo: number
  total_kobo: number
  items: OrderItem[]
  shipping_address: {
    full_name: string
    phone: string
    address_line_1: string
    address_line_2?: string
    city: string
    state: string
    landmark?: string
  }
  payment_method: string
  payment_status: string
  created_at: string
  updated_at: string
  estimated_delivery?: string
  tracking_number?: string
  driver?: {
    name: string
    phone: string
    vehicle: string
    rating: number
    current_location?: { lat: number; lng: number }
  }
  timeline: TrackingEvent[]
}

interface TrackingEvent {
  id: string
  status: string
  title: string
  description: string
  timestamp: string
  location?: string
  completed: boolean
  current: boolean
}

const STATUS_ORDER = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'return_requested',
  'returned',
  'refunded',
]

const STATUS_LABELS: Record<string, string> = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  return_requested: 'Return Requested',
  returned: 'Returned',
  refunded: 'Refunded',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Package className="w-5 h-5" />,
  confirmed: <CheckCircle className="w-5 h-5" />,
  processing: <Building2 className="w-5 h-5" />,
  shipped: <Truck className="w-5 h-5" />,
  out_for_delivery: <Navigation className="w-5 h-5" />,
  delivered: <CheckCircle className="w-5 h-5 text-green-500" />,
  cancelled: <AlertCircle className="w-5 h-5 text-red-500" />,
  return_requested: <AlertCircle className="w-5 h-5 text-orange-500" />,
  returned: <Package className="w-5 h-5 text-gray-500" />,
  refunded: <CheckCircle className="w-5 h-5 text-blue-500" />,
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-coral/10 text-coral border-coral/20',
  confirmed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  processing: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  shipped: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  out_for_delivery: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  delivered: 'bg-green-500/10 text-green-500 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
  return_requested: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  returned: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  refunded: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
}

const MOCK_ORDER: Order = {
  id: 'ord_123456',
  order_number: 'KMB-2024-001234',
  status: 'out_for_delivery',
  subtotal_kobo: 4500000,
  delivery_fee_kobo: 150000,
  platform_fee_kobo: 225000,
  total_kobo: 4875000,
  items: [
    {
      id: 'item_1',
      name: 'Wireless Noise-Cancelling Headphones',
      price_kobo: 2500000,
      quantity: 1,
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
      store_id: 'store_1',
      store_name: 'TechHub Electronics',
    },
    {
      id: 'item_2',
      name: 'Premium Leather Wallet',
      price_kobo: 850000,
      quantity: 1,
      image_url: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop',
      store_id: 'store_2',
      store_name: 'StyleCraft Leather',
    },
    {
      id: 'item_3',
      name: 'Organic Green Tea - 50 Pack',
      price_kobo: 1150000,
      quantity: 1,
      image_url: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5?w=400&h=400&fit=crop',
      store_id: 'store_3',
      store_name: 'Nature\'s Best',
    },
  ],
  shipping_address: {
    full_name: 'Adebayo Johnson',
    phone: '+234 801 234 5678',
    address_line_1: '15 Admiralty Way',
    address_line_2: 'Lekki Phase 1',
    city: 'Lagos',
    state: 'Lagos',
    landmark: 'Near Lekki Conservation Centre',
  },
  payment_method: 'card',
  payment_status: 'paid',
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-16T14:22:00Z',
  estimated_delivery: '2024-01-16T18:00:00Z',
  tracking_number: 'KMB-TRK-789456123',
  driver: {
    name: 'Michael Okonkwo',
    phone: '+234 805 555 0123',
    vehicle: 'Honda CG 125 - LAG 456 KMB',
    rating: 4.8,
    current_location: { lat: 6.4654, lng: 3.4064 },
  },
  timeline: [
    {
      id: 'evt_1',
      status: 'pending',
      title: 'Order Placed',
      description: 'Your order has been received and is being processed',
      timestamp: '2024-01-15T10:30:00Z',
      completed: true,
      current: false,
    },
    {
      id: 'evt_2',
      status: 'confirmed',
      title: 'Order Confirmed',
      description: 'Store has confirmed your order and started preparation',
      timestamp: '2024-01-15T10:45:00Z',
      location: 'TechHub Electronics, Victoria Island',
      completed: true,
      current: false,
    },
    {
      id: 'evt_3',
      status: 'processing',
      title: 'Order Processing',
      description: 'Items are being picked, packed, and prepared for shipment',
      timestamp: '2024-01-15T14:20:00Z',
      location: 'Kamba Fulfillment Center, Ikeja',
      completed: true,
      current: false,
    },
    {
      id: 'evt_4',
      status: 'shipped',
      title: 'Order Shipped',
      description: 'Package has been handed to delivery partner',
      timestamp: '2024-01-16T08:15:00Z',
      location: 'Kamba Logistics Hub, Ikeja',
      completed: true,
      current: false,
    },
    {
      id: 'evt_5',
      status: 'out_for_delivery',
      title: 'Out for Delivery',
      description: 'Driver Michael Okonkwo is on the way with your order',
      timestamp: '2024-01-16T14:22:00Z',
      location: 'Lekki Phase 1, Lagos',
      completed: false,
      current: true,
    },
    {
      id: 'evt_6',
      status: 'delivered',
      title: 'Delivered',
      description: 'Order has been delivered to your address',
      timestamp: '2024-01-16T18:00:00Z',
      completed: false,
      current: false,
    },
  ],
}

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [mapView, setMapView] = useState<'overview' | 'live'>('overview')

  useEffect(() => {
    // Simulate API fetch
    const fetchOrder = async () => {
      await new Promise(resolve => setTimeout(resolve, 800))
      setOrder(MOCK_ORDER)
      setDriverLocation(MOCK_ORDER.driver?.current_location || null)
      setLoading(false)
    }
    fetchOrder()

    // Simulate real-time driver location updates
    const interval = setInterval(() => {
      if (order?.driver?.current_location) {
        // Simulate small movement
        const newLat = order.driver.current_location.lat + (Math.random() - 0.5) * 0.001
        const newLng = order.driver.current_location.lng + (Math.random() - 0.5) * 0.001
        setDriverLocation({ lat: newLat, lng: newLng })
        setLastUpdate(new Date())
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-ink py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-ink-raised/50 rounded w-1/4" />
            <div className="h-4 bg-ink-raised/50 rounded w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-ink-raised/50 rounded-xl" />
              <div className="h-64 bg-ink-raised/50 rounded-xl" />
            </div>
            <div className="h-96 bg-ink-raised/50 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-ink py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-primary mb-2">Order Not Found</h1>
          <p className="text-muted-foreground mb-6">The order you&apos;re looking for doesn&apos;t exist.</p>
          <Link href="/orders">
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentStatusIndex = STATUS_ORDER.indexOf(order.status.toLowerCase())
  const progress = currentStatusIndex >= 0 ? ((currentStatusIndex + 1) / STATUS_ORDER.length) * 100 : 0

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-NG', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatRelativeTime = (isoString: string) => formatTime(isoString)

  return (
    <div className="min-h-screen bg-ink">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-ink/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/orders" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </Link>
            <h1 className="text-lg font-semibold text-primary">Track Order</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Order Header Card */}
        <Card variant="elevated" className="overflow-hidden">
          <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-coral/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-coral" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="font-mono font-semibold text-primary">{order.order_number}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="default" className={STATUS_COLORS[order.status.toLowerCase()] || 'bg-muted text-muted-foreground'}>
                {STATUS_ICONS[order.status.toLowerCase()]}
                <span className="ml-1">{STATUS_LABELS[order.status.toLowerCase()] || order.status}</span>
              </Badge>
              {order.tracking_number && (
                <Button variant="ghost" size="sm" className="gap-1">
                  <span className="font-mono text-xs">{order.tracking_number}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-4 py-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-primary">Delivery Progress</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
            </div>
            <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-coral to-gold rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
              {/* Status markers */}
              <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between px-1.5 pointer-events-none">
                {STATUS_ORDER.slice(0, 6).map((status, index) => (
                  <div key={status} className="flex flex-col items-center">
                    <div 
                      className={`w-2.5 h-2.5 rounded-full border-2 transition-all ${
                        index <= currentStatusIndex 
                          ? 'bg-coral border-coral' 
                          : 'bg-ink border-white/20'
                      }`}
                    />
                    <span className="text-[10px] text-muted-foreground/60 mt-1 hidden sm:block">
                      {STATUS_LABELS[status]?.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Estimated Delivery */}
          {order.estimated_delivery && (
            <div className="px-4 py-4 bg-coral/5 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-coral/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-coral" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                  <p className="font-semibold text-primary">
                    {new Date(order.estimated_delivery).toLocaleString('en-NG', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {order.driver && (
                  <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Driver arriving in</span>
                    <span className="font-mono font-semibold text-coral">~15 min</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Map View Toggle */}
        <div className="flex gap-2">
          <Button
            variant={mapView === 'overview' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setMapView('overview')}
          >
            <Map className="w-4 h-4 mr-2" />
            Route Overview
          </Button>
          <Button
            variant={mapView === 'live' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setMapView('live')}
          >
            <Navigation className="w-4 h-4 mr-2" />
            Live Tracking
          </Button>
        </div>

        {/* Map / Route View */}
        <Card variant="elevated" className="overflow-hidden">
          <div className="aspect-video relative bg-ink-raised/50">
            {mapView === 'overview' ? (
              <RouteOverviewMap 
                order={order} 
                driverLocation={driverLocation}
              />
            ) : (
              <LiveTrackingMap 
                order={order} 
                driverLocation={driverLocation}
                lastUpdate={lastUpdate}
              />
            )}
          </div>
        </Card>

        {/* Driver Info Card */}
        {order.driver && mapView === 'live' && (
          <Card variant="elevated">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-coral" />
                Your Driver
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-coral/10 flex items-center justify-center">
                  <User className="w-8 h-8 text-coral" />
                </div>
                <div className="flex-1">
                                  {order.driver && (
                                    <>
                                      <p className="font-semibold text-primary">{order.driver.name}</p>
                                      <p className="text-sm text-muted-foreground">{order.driver.vehicle}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="flex items-center gap-1 text-sm text-gold">
                                          <span>★</span>
                                          {order.driver.rating}
                                        </span>
                                        <span className="text-muted-foreground">·</span>
                                        <Button variant="ghost" size="sm" className="gap-1 h-8 px-2" onClick={() => order.driver && window.open(`tel:${order.driver.phone}`)}>
                                          <Phone className="w-4 h-4" />
                                          Call
                                        </Button>
                                        <Button variant="ghost" size="sm" className="gap-1 h-8 px-2">
                                          <MessageSquare className="w-4 h-4" />
                                          Chat
                                        </Button>
                                      </div>
                                    </>
                                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Last update</p>
                  <p className="font-mono text-primary">{formatRelativeTime(lastUpdate.toISOString())}</p>
                  <Button variant="ghost" size="sm" className="mt-2 gap-1" onClick={() => setLastUpdate(new Date())}>
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card variant="elevated">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-coral" />
              Delivery Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10" />
              
              {order.timeline.map((event, index) => (
                <div key={event.id} className="relative pl-14 pb-8 last:pb-0">
                  <div className="absolute left-6 top-1 flex items-center justify-center">
                    <div 
                      className={`w-3 h-3 rounded-full border-2 ${
                        event.completed 
                          ? 'bg-coral border-coral' 
                          : event.current 
                            ? 'bg-coral border-coral animate-pulse ring-2 ring-coral/30' 
                            : 'bg-ink border-white/20'
                      }`}
                    />
                  </div>
                  <div className="ml-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className={`font-medium ${event.current ? 'text-primary' : event.completed ? 'text-primary' : 'text-muted-foreground'}`}>
                          {event.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">{event.description}</p>
                        {event.location && (
                          <p className="text-sm text-muted-foreground/70 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </p>
                        )}
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <p className="text-sm font-mono text-muted-foreground">{formatTime(event.timestamp)}</p>
                        {event.current && (
                          <Badge variant="default" className="bg-coral/10 text-coral border-coral/20 mt-1 text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Items Summary */}
        <Card variant="elevated">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-coral" />
              Order Items
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-16 h-16 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-muted-foreground/50 mx-auto my-auto" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-primary truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.store_name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{formatKobo(item.price_kobo * item.quantity)}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-primary">{formatKobo(order.subtotal_kobo)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span className="text-primary">{formatKobo(order.delivery_fee_kobo)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Platform Fee</span>
                <span className="text-primary">{formatKobo(order.platform_fee_kobo)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold pt-2 border-t border-white/10">
                <span className="text-primary">Total</span>
                <span className="text-primary">{formatKobo(order.total_kobo)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Address */}
        <Card variant="elevated">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-coral" />
              Delivery Address
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-coral/10 flex items-center justify-center flex-shrink-0">
                <Home className="w-5 h-5 text-coral" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-primary">{order.shipping_address.full_name}</p>
                <p className="text-sm text-muted-foreground">{order.shipping_address.phone}</p>
                <p className="text-sm text-primary mt-1">
                  {order.shipping_address.address_line_1}
                  {order.shipping_address.address_line_2 && `, ${order.shipping_address.address_line_2}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.shipping_address.city}, {order.shipping_address.state}
                </p>
                {order.shipping_address.landmark && (
                  <p className="text-sm text-muted-foreground/70 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    Near {order.shipping_address.landmark}
                  </p>
                )}
              </div>
              <Button variant="outline" size="sm">
                <Navigation className="w-4 h-4 mr-1" />
                Navigate
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" className="flex-1" onClick={() => window.open(`tel:${order.shipping_address.phone}`)}>
            <Phone className="w-4 h-4 mr-2" />
            Call Recipient
          </Button>
          <Button variant="default" className="flex-1" onClick={() => window.open(`tel:${order.driver?.phone}`)}>
            <Truck className="w-4 h-4 mr-2" />
            Contact Driver
          </Button>
        </div>

        <Link href="/orders" className="block text-center text-sm text-muted-foreground hover:text-primary transition-colors py-4">
          ← Back to All Orders
        </Link>
      </main>
    </div>
  )
}

function RouteOverviewMap({ order, driverLocation }: { order: Order; driverLocation: { lat: number; lng: number } | null }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Simulated map view */}
      <div className="absolute inset-0 bg-gradient-to-br from-ink-raised/50 to-ink/50" />
      
      {/* Route line */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none">
        <defs>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B47" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFD23F" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <path 
          d="M 40 260 Q 100 200 180 150 Q 250 100 320 60" 
          stroke="url(#routeGradient)" 
          strokeWidth="3" 
          fill="none" 
          strokeLinecap="round"
          strokeDasharray="10,5"
        />
        {/* Store location */}
        <circle cx="40" cy="260" r="10" fill="#FF6B47" />
        <text x="40" y="285" textAnchor="middle" fill="#F8FAFC" fontSize="10" fontFamily="system-ui">Store</text>
        {/* Delivery location */}
        <circle cx="320" cy="60" r="10" fill="#10B981" />
        <text x="320" y="40" textAnchor="middle" fill="#F8FAFC" fontSize="10" fontFamily="system-ui">Delivery</text>
        {/* Driver position */}
        {driverLocation && (
          <g>
            <circle cx="200" cy="150" r="8" fill="#FFD23F" />
            <text x="200" y="130" textAnchor="middle" fill="#F8FAFC" fontSize="9" fontFamily="system-ui">Driver</text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2 bg-ink/80 backdrop-blur px-3 py-2 rounded-lg">
          <div className="w-3 h-3 rounded-full bg-coral" />
          <span className="text-primary">Pickup</span>
        </div>
        <div className="flex items-center gap-2 bg-ink/80 backdrop-blur px-3 py-2 rounded-lg">
          <div className="w-3 h-3 rounded-full bg-gold" />
          <span className="text-primary">Driver</span>
        </div>
        <div className="flex items-center gap-2 bg-ink/80 backdrop-blur px-3 py-2 rounded-lg">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-primary">Delivery</span>
        </div>
      </div>

      {/* Distance/Time info */}
      <div className="absolute top-4 left-4 right-4 flex justify-center gap-4">
        <div className="bg-ink/80 backdrop-blur px-4 py-2 rounded-lg text-center">
          <p className="text-xs text-muted-foreground">Distance</p>
          <p className="font-semibold text-primary">12.4 km</p>
        </div>
        <div className="bg-ink/80 backdrop-blur px-4 py-2 rounded-lg text-center">
          <p className="text-xs text-muted-foreground">Est. Time</p>
          <p className="font-semibold text-primary">18 min</p>
        </div>
      </div>
    </div>
  )
}

function LiveTrackingMap({ order, driverLocation, lastUpdate }: { order: Order; driverLocation: { lat: number; lng: number } | null; lastUpdate: Date }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Simulated live map view */}
      <div className="absolute inset-0 bg-gradient-to-br from-ink-raised/50 to-ink/50" />
      
      {/* Grid pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 400 300" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#F8FAFC" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Route path */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none">
        <path 
          d="M 40 260 Q 100 200 180 150 Q 250 100 320 60" 
          stroke="#FFFFFF" 
          strokeWidth="2" 
          fill="none" 
          strokeLinecap="round"
          strokeDasharray="8,4"
          opacity="0.3"
        />
        {/* Store */}
        <circle cx="40" cy="260" r="10" fill="#FF6B47" />
        <text x="40" y="285" textAnchor="middle" fill="#F8FAFC" fontSize="10" fontFamily="system-ui">Store</text>
        {/* Delivery */}
        <circle cx="320" cy="60" r="10" fill="#10B981" />
        <text x="320" y="40" textAnchor="middle" fill="#F8FAFC" fontSize="10" fontFamily="system-ui">Delivery</text>
      </svg>

      {/* Animated driver marker */}
      {driverLocation && (
        <div className="absolute" style={{ left: '48%', top: '45%' }}>
          <div className="relative">
            {/* Pulse rings */}
            <div className="absolute -top-2 -left-2 w-10 h-10 rounded-full border-2 border-gold/50 animate-ping" />
            <div className="absolute -top-3 -left-3 w-12 h-12 rounded-full border-2 border-gold/30 animate-ping" style={{ animationDelay: '500ms' }} />
            {/* Driver icon */}
            <div className="w-6 h-6 rounded-full bg-gold flex items-center justify-center relative z-10">
              <Truck className="w-4 h-4 text-ink" />
            </div>
          </div>
        </div>
      )}

      {/* Live status badge */}
      <div className="absolute top-4 left-4 bg-coral/90 backdrop-blur px-3 py-2 rounded-lg flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
        <span className="text-sm font-medium text-ink">LIVE</span>
        <span className="text-xs text-ink/70 font-mono">{formatRelativeTime(lastUpdate.toISOString())}</span>
      </div>

      {/* Info cards */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3">
        <div className="bg-ink/80 backdrop-blur px-4 py-3 rounded-xl text-center min-w-[120px]">
          <p className="text-xs text-muted-foreground">Speed</p>
          <p className="font-semibold text-primary text-lg">28 km/h</p>
        </div>
        <div className="bg-ink/80 backdrop-blur px-4 py-3 rounded-xl text-center min-w-[120px]">
          <p className="text-xs text-muted-foreground">Distance Left</p>
          <p className="font-semibold text-primary text-lg">3.2 km</p>
        </div>
        <div className="bg-ink/80 backdrop-blur px-4 py-3 rounded-xl text-center min-w-[120px]">
          <p className="text-xs text-muted-foreground">ETA</p>
          <p className="font-semibold text-primary text-lg">8 min</p>
        </div>
      </div>
    </div>
  )
}

