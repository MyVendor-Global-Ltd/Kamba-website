'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, ScanLine, PackageCheck, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { apiJson } from '@/lib/api'
import { isMockMode } from '@/lib/mock-api'
import { confirmPickupDemo, confirmPickupOrderDemo, getPickupDemo, listPickupDemos, setPickupStage, type PickupDemo } from '@/lib/pickup-prototype'

interface PickupOrder {
  id: string
  order_number?: string
  status: string
  delivery_type: 'pickup' | 'delivery'
  store_name?: string
  total?: number
  total_amount?: number
  created_at?: string
}

export default function VendorPickupPage() {
  const [orders, setOrders] = useState<PickupOrder[]>([])
  const [orderId, setOrderId] = useState('')
  const [pickup, setPickup] = useState<PickupDemo | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [scannerActive, setScannerActive] = useState(false)
  const [scannerError, setScannerError] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiJson<{ orders: PickupOrder[] }>('/commerce/vendor/orders', { params: { limit: 100, offset: 0 } })
      const pickupOrders = (data.orders || []).filter((order) => order.delivery_type === 'pickup')
      setOrders(pickupOrders)
      setOrderId((current) => pickupOrders.some((order) => order.id === current) ? current : pickupOrders[0]?.id || '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load pickup orders.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (isMockMode) void loadOrders() }, [loadOrders])

  useEffect(() => {
    if (!orderId || !isMockMode) { setPickup(null); return }
    setPickup(getPickupDemo(orderId))
    setCode('')
    setFeedback('')
  }, [orderId])

  const selectedOrder = useMemo(() => orders.find((order) => order.id === orderId), [orders, orderId])

  const refreshPickup = () => {
    if (orderId) setPickup(getPickupDemo(orderId))
  }

  const confirmOrder = () => {
    try {
      setError(''); setFeedback('')
      const next = confirmPickupOrderDemo(orderId)
      setPickup(next)
      setFeedback('Order confirmed. You can now prepare it.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not confirm this order.') }
  }

  const update = (nextStage: 'preparing' | 'ready_for_pickup') => {
    try {
      setError(''); setFeedback('')
      const next = setPickupStage(orderId, nextStage)
      setPickup(next)
      setFeedback(nextStage === 'preparing' ? 'Order moved to Preparing.' : 'Order marked Ready for pickup. The buyer can now view the one-time code and approved collection point.')
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not update this prototype order.') }
  }

  const verify = () => {
    try {
      setError(''); setFeedback('')
      const next = confirmPickupDemo(orderId, code)
      setPickup(next)
      setFeedback('Collection recorded in the development prototype. The 24-hour dispute window has started.')
      setCode('')
    } catch (e) { setError(e instanceof Error ? e.message : 'Pickup verification failed.') }
  }

  if (!isMockMode) return <div className="container mx-auto max-w-2xl px-4 py-16"><Card><CardContent className="space-y-3 p-6"><AlertCircle className="h-7 w-7 text-gold" /><h1 className="text-2xl">Vendor pickup verification is not connected</h1><p className="text-text-secondary">The backend documents pickup checkout, but does not yet expose vendor pickup-token issuance or collection-verification contracts. No production status changes can be made from this screen.</p></CardContent></Card></div>

  return <div className="container mx-auto max-w-3xl space-y-6 px-4 py-10">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-wider text-primary">Vendor workspace</p><h1 className="mt-2 text-3xl font-bold text-text-primary">Pickup desk</h1><p className="mt-2 text-text-secondary">Manage pickup orders created from the marketplace checkout.</p></div><Button variant="outline" onClick={() => void loadOrders()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" /> Refresh orders</Button></div>
    {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    <Card><CardHeader><CardTitle>Pickup orders</CardTitle></CardHeader><CardContent className="space-y-4">
      {loading ? <p className="text-sm text-text-secondary">Loading pickup orders…</p> : orders.length === 0 ? <div className="space-y-2 py-3"><PackageCheck className="h-7 w-7 text-text-tertiary" /><p className="font-medium text-text-primary">No pickup orders yet</p><p className="text-sm text-text-secondary">Create a prototype order using pickup at checkout. It will appear here automatically.</p></div> : <>
        <label className="block text-sm font-medium text-text-secondary" htmlFor="pickup-order">Select order</label>
        <select id="pickup-order" value={orderId} onChange={(event) => setOrderId(event.target.value)} className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary">
          {orders.map((order) => <option key={order.id} value={order.id}>{order.order_number || order.id} · {order.store_name || 'Store'} · {order.status}</option>)}
        </select>
        {selectedOrder && <p className="text-xs text-text-tertiary">Order {selectedOrder.order_number || selectedOrder.id} · {selectedOrder.store_name || 'Kamba vendor'}</p>}
        <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary p-3"><span className="text-sm text-secondary-foreground">Pickup workflow stage</span><strong className="text-sm capitalize text-text-primary">{(pickup?.stage || 'awaiting_confirmation').replaceAll('_', ' ')}</strong></div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={confirmOrder} disabled={pickup?.stage !== 'awaiting_confirmation'}>Confirm order</Button>
          <Button variant="outline" onClick={() => update('preparing')} disabled={pickup?.stage !== 'confirmed'}>Mark preparing</Button>
          <Button onClick={() => update('ready_for_pickup')} disabled={pickup?.stage !== 'preparing'}>Mark ready for pickup</Button>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={refreshPickup}>Refresh selected order status</Button>
      </>}
    </CardContent></Card>
    {orderId && <Card><CardHeader><CardTitle>Verify collection</CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="flex items-center gap-2"><ScanLine className="h-5 w-5 text-primary" /><p className="text-sm text-text-secondary">QR scanning awaits the backend pickup-token contract. For this prototype, enter the buyer&apos;s one-time code.</p></div>
      {pickup?.stage === 'ready_for_pickup' && <p className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">Buyer code: <strong className="font-mono tracking-widest text-text-primary">{pickup.pickupCode}</strong>. This is visible in the shared local development session only.</p>}
      <label className="block text-sm font-medium text-text-secondary" htmlFor="pickup-code">Buyer&apos;s pickup code</label>
      <Input id="pickup-code" inputMode="numeric" maxLength={6} placeholder="6-digit code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} />
      <Button onClick={verify} disabled={pickup?.stage !== 'ready_for_pickup' || code.length !== 6}><CheckCircle2 className="mr-2 h-4 w-4" /> Confirm collection</Button>
      {feedback && <p role="status" className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">{feedback}</p>}
      {pickup?.stage === 'collected' && <div className="rounded-lg bg-gold-soft p-3 text-sm text-text-primary"><p className="font-semibold">Collection recorded in prototype</p><p className="mt-1">24-hour dispute window ends: {pickup.disputeWindowEndsAt ? new Date(pickup.disputeWindowEndsAt).toLocaleString('en-NG') : 'Not available'}.</p><p className="mt-1">Payout eligibility remains subject to the backend, no unresolved dispute and no payment issue. Eligibility does not mean a transfer has completed.</p></div>}
      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    </CardContent></Card>}
    <p className="text-xs text-text-tertiary">Prototype only. This does not verify a real buyer or trigger a payment release. Never use a vendor&apos;s private phone number or residential address as a collection location.</p>
  </div>
}
