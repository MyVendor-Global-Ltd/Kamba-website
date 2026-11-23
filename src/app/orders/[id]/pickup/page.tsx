'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Clock3, MapPin, PackageCheck, QrCode } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { isMockMode } from '@/lib/mock-api'
import { getPickupDemo, type PickupDemo } from '@/lib/pickup-prototype'
import { PickupQr } from '@/components/marketplace/pickup-qr'
import { formatDateTime } from '@/lib/formatting'

export default function BuyerPickupPage() {
  const params = useParams<{ id: string }>()
  const [pickup, setPickup] = useState<PickupDemo | null>(null)
  useEffect(() => {
    if (!isMockMode) return
    const refreshPickup = () => setPickup(getPickupDemo(params.id))
    void Promise.resolve().then(refreshPickup)
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'kamba_pickup_prototype') refreshPickup()
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [params.id])
  if (!isMockMode) return <div className="container mx-auto max-w-2xl px-4 py-16"><Card><CardContent className="space-y-3 p-6"><AlertCircle className="h-7 w-7 text-gold" /><h1 className="text-2xl">Pickup verification is not connected yet</h1><p className="text-text-secondary">The backend currently documents pickup checkout, but not a vendor pickup-code issuance or collection-verification endpoint. This screen will activate when that contract is available.</p></CardContent></Card></div>
  const stage = pickup?.stage || 'awaiting_confirmation'
  return <div className="container mx-auto max-w-3xl space-y-6 px-4 py-10">
    <div><p className="text-sm font-semibold uppercase tracking-wider text-primary">Order collection</p><h1 className="mt-2 text-3xl">Your pickup details</h1><p className="mt-2 text-text-secondary">Order {pickup?.orderNumber || params.id}</p></div>
    <Card><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>Pickup progress</CardTitle><Badge variant="outline">{stage.replaceAll('_',' ')}</Badge></div></CardHeader><CardContent className="space-y-5">
      <div className="flex items-start gap-3"><PackageCheck className="mt-1 h-5 w-5 text-primary" /><div><p className="font-semibold">Vendor confirmation</p><p className="text-sm text-text-secondary">{stage === 'awaiting_confirmation' ? 'Your order is waiting for the vendor to confirm it.' : 'The vendor has accepted the order.'}</p></div></div>
      {stage === 'confirmed' && <p className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">The vendor confirmed your order. It will appear here once preparation begins.</p>}
      {stage === 'preparing' && <p className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">Your order is being prepared. Pickup details will appear when it is marked ready.</p>}
      {stage === 'ready_for_pickup' && <><div className="rounded-xl border border-primary/20 bg-secondary p-5 text-center"><p className="text-sm font-medium text-secondary-foreground">Your one-time pickup code</p><p className="my-2 font-display text-4xl font-bold tracking-[0.25em] text-primary">{pickup?.pickupCode}</p><p className="text-xs text-secondary-foreground">Show this code to the vendor when collecting your order.</p></div><div className="flex items-start gap-3"><MapPin className="mt-1 h-5 w-5 text-primary" /><div><p className="font-semibold">Approved collection point</p><p className="text-sm text-text-secondary">{pickup?.pickupLocation}</p></div></div><div className="rounded-lg border border-border p-4"><div className="mb-3 flex items-center gap-2 font-medium"><QrCode className="h-5 w-5 text-primary" /> QR pickup pass</div><PickupQr value={pickup?.pickupCode || ''} /><p className="mt-3 text-center text-xs text-text-tertiary">This QR encodes the same one-time code shown above. The vendor can scan it or enter the code manually.</p></div></>}
      {stage === 'collected' && <div className="space-y-3"><div className="flex items-center gap-2 text-primary"><CheckCircle2 className="h-6 w-6" /><span className="font-semibold">Collection recorded in the prototype</span></div><div className="rounded-lg bg-secondary p-4"><div className="flex items-center gap-2 font-semibold"><Clock3 className="h-4 w-4" /> 24-hour dispute window</div><p className="mt-1 text-sm text-secondary-foreground">Ends: {pickup?.disputeWindowEndsAt ? formatDateTime(pickup.disputeWindowEndsAt) : 'Not available'}</p><p className="mt-2 text-sm text-secondary-foreground">Vendor payout status: {pickup?.payoutStatus === 'awaiting_dispute_window' ? 'Awaiting the 24-hour dispute window and backend eligibility confirmation' : pickup?.payoutStatus}</p></div></div>}
      {stage === 'awaiting_confirmation' && <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">The pickup location and code are intentionally hidden until the order reaches Ready for pickup.</div>}
    </CardContent></Card>
    <div className="flex flex-wrap gap-3"><Link href="/orders" className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-text-primary">Back to orders</Link><Link href="/vendor/pickup" className="inline-flex h-10 items-center rounded-lg bg-secondary px-4 text-sm font-semibold text-secondary-foreground">Open vendor prototype</Link></div>
    <p className="text-xs text-text-tertiary">Development prototype only. No real collection, identity check, payment release or bank transfer is performed.</p>
  </div>
}
