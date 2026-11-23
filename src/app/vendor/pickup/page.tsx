'use client'

import { useState } from 'react'
import { AlertCircle, CheckCircle2, ScanLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { isMockMode } from '@/lib/mock-api'
import { confirmPickupDemo, confirmPickupOrderDemo, getPickupDemo, setPickupStage } from '@/lib/pickup-prototype'

export default function VendorPickupPage() {
  const [orderId, setOrderId] = useState('demo-pickup-order-001')
  const [code, setCode] = useState('')
  const [stage, setStage] = useState('awaiting_confirmation')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const refresh = () => setStage(getPickupDemo(orderId).stage)
  const confirmOrder = () => {
    try { setError(''); setFeedback(''); confirmPickupOrderDemo(orderId); refresh(); setFeedback('Order confirmed. You can now prepare it.') }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not confirm this order.') }
  }
  const update = (next: 'preparing' | 'ready_for_pickup') => {
    try { setError(''); setFeedback(''); setPickupStage(orderId, next); refresh(); setFeedback(next === 'preparing' ? 'Order moved to Preparing.' : 'Order marked Ready for pickup. The buyer now has a one-time code.') }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not update this prototype order.') }
  }
  const verify = () => {
    try { setError(''); setFeedback(''); const record = confirmPickupDemo(orderId, code); setStage(record.stage); setFeedback('Collection recorded in the development prototype. The 24-hour dispute window has started.') }
    catch (e) { setError(e instanceof Error ? e.message : 'Pickup verification failed.') }
  }
  if (!isMockMode) return <div className="container mx-auto max-w-2xl px-4 py-16"><Card><CardContent className="space-y-3 p-6"><AlertCircle className="h-7 w-7 text-gold" /><h1 className="text-2xl">Vendor pickup verification is not connected</h1><p className="text-text-secondary">A vendor-owned pickup verification endpoint and collection-point contract are not documented in the backend yet. No production status changes can be made from this screen.</p></CardContent></Card></div>
  return <div className="container mx-auto max-w-3xl space-y-6 px-4 py-10">
    <div><p className="text-sm font-semibold uppercase tracking-wider text-primary">Vendor workspace</p><h1 className="mt-2 text-3xl">Pickup desk</h1><p className="mt-2 text-text-secondary">Prepare orders, issue the buyer&apos;s pickup code and record collection.</p></div>
    <Card><CardHeader><CardTitle>Order preparation</CardTitle></CardHeader><CardContent className="space-y-4">
      <div><label className="mb-2 block text-sm font-medium" htmlFor="pickup-order">Prototype order ID</label><Input id="pickup-order" value={orderId} onChange={e=>setOrderId(e.target.value)} onBlur={refresh} /></div>
      <p className="text-sm text-text-secondary">Current stage: <strong className="capitalize text-text-primary">{stage.replaceAll('_',' ')}</strong></p>
      <div className="flex flex-wrap gap-3"><Button variant="outline" onClick={confirmOrder} disabled={stage !== 'awaiting_confirmation'}>Confirm order</Button><Button variant="outline" onClick={()=>update('preparing')} disabled={stage !== 'confirmed'}>Mark preparing</Button><Button onClick={()=>update('ready_for_pickup')} disabled={stage !== 'preparing'}>Mark ready for pickup</Button></div>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Verify collection</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex items-center gap-2"><ScanLine className="h-5 w-5 text-primary" /><p className="text-sm text-text-secondary">QR scanning awaits the production pickup-token contract. Enter the buyer&apos;s one-time code for this prototype.</p></div><div><label className="mb-2 block text-sm font-medium" htmlFor="pickup-code">Buyer&apos;s pickup code</label><Input id="pickup-code" inputMode="numeric" maxLength={6} placeholder="6-digit code" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} /></div><Button onClick={verify} disabled={stage !== 'ready_for_pickup' || code.length !== 6}><CheckCircle2 className="mr-2 h-4 w-4" /> Confirm collection</Button>{feedback && <p role="status" className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">{feedback}</p>}{stage === 'collected' && <p className="rounded-lg bg-gold-soft p-3 text-sm text-text-primary">Expected payout: held until the 24-hour dispute window closes, provided there is no unresolved dispute or payment issue. Eligibility does not mean a transfer has completed.</p>}{error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}</CardContent></Card>
    <p className="text-xs text-text-tertiary">Prototype only. This does not verify a real buyer or trigger a payment release. Never use the vendor&apos;s private phone number or residential address as a collection location.</p>
  </div>
}
