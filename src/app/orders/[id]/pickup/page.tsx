'use client'

import Link from 'next/link'
import {useCallback,useEffect,useState} from 'react'
import {useParams} from 'next/navigation'
import {AlertCircle,CheckCircle2,Clock3,MapPin,PackageCheck,RefreshCw,QrCode} from 'lucide-react'
import {Card,CardContent,CardHeader,CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {PickupQr} from '@/components/marketplace/pickup-qr'
import {apiJson,ApiError} from '@/lib/api'
interface PickupDetails{order_id:string;pickup_status:'confirmed'|'preparing'|'ready_for_pickup'|'collected';pickup_address:string;pickup_code:string|null;code_expires_at:string|null;collected_at:string|null}
export default function BuyerPickupPage(){
 const params=useParams<{id:string}>()
 const [pickup,setPickup]=useState<PickupDetails|null>(null)
 const [loading,setLoading]=useState(true)
 const [error,setError]=useState('')
 const [notReady,setNotReady]=useState(false)
 const load=useCallback(async()=>{
  setLoading(true);setError('');setNotReady(false)
  try{const data=await apiJson<PickupDetails>(`/commerce/orders/${encodeURIComponent(params.id)}/pickup`);setPickup(data)}
  catch(err){if(err instanceof ApiError&&err.code==='PICKUP_NOT_READY'){setNotReady(true);setPickup(null)}else setError(err instanceof Error?err.message:'Could not load pickup details.')}
  finally{setLoading(false)}
 },[params.id])
 useEffect(()=>{void load()},[load])
 const stage=pickup?.pickup_status||'awaiting_confirmation'
 return <div className="container mx-auto max-w-3xl space-y-6 px-4 py-10">
  <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-wider text-primary">Order collection</p><h1 className="mt-2 text-3xl font-bold text-text-primary">Your pickup details</h1><p className="mt-2 text-sm text-text-secondary">Order {params.id}</p></div><Button variant="outline" onClick={()=>void load()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4"/>Refresh</Button></div>
  {loading&&<Card><CardContent className="p-6 text-sm text-text-secondary">Checking pickup status…</CardContent></Card>}
  {!loading&&error&&<Card><CardContent className="space-y-3 p-6"><AlertCircle className="h-6 w-6 text-destructive"/><p role="alert" className="text-sm text-destructive">{error}</p><Button variant="outline" onClick={()=>void load()}>Try again</Button></CardContent></Card>}
  {!loading&&notReady&&<Card><CardHeader><CardTitle>Waiting for the vendor</CardTitle></CardHeader><CardContent className="space-y-3"><PackageCheck className="h-7 w-7 text-primary"/><p className="text-sm text-text-secondary">Your order is not ready for collection yet. The exact pickup address and one-time QR pass remain hidden until the vendor has accepted, prepared and marked the paid order ready.</p><Button variant="outline" onClick={()=>void load()}>Check again</Button></CardContent></Card>}
  {!loading&&pickup&&<><Card><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>Pickup progress</CardTitle><Badge variant={stage==='collected'?'success':'outline'}>{stage.replaceAll('_',' ')}</Badge></div></CardHeader><CardContent className="space-y-4"><div className="flex items-start gap-3"><PackageCheck className="mt-1 h-5 w-5 text-primary"/><div><p className="font-semibold text-text-primary">Vendor collection status</p><p className="text-sm text-text-secondary">{stage==='collected'?'Your collection has been verified.':stage==='ready_for_pickup'?'Your order is ready. Present this QR pass to the vendor.':'The vendor is preparing your order.'}</p></div></div></CardContent></Card>
  <Card><CardHeader><CardTitle>Approved pickup address</CardTitle></CardHeader><CardContent className="flex items-start gap-3"><MapPin className="mt-1 h-5 w-5 text-primary"/><address className="text-sm not-italic leading-6 text-text-primary">{pickup.pickup_address}</address></CardContent></Card>
  {pickup.pickup_code&&<Card><CardHeader><div className="flex items-center gap-2"><QrCode className="h-5 w-5 text-primary"/><CardTitle>One-time pickup QR</CardTitle></div></CardHeader><CardContent className="space-y-3 text-center"><PickupQr value={pickup.pickup_code}/><p className="font-mono text-3xl font-bold tracking-[0.25em] text-primary">{pickup.pickup_code}</p><p className="text-xs text-text-tertiary">Show this QR to the vendor. It expires {pickup.code_expires_at?new Date(pickup.code_expires_at).toLocaleString('en-NG'):'after 24 hours'} and can be used only once.</p></CardContent></Card>}
  {stage==='collected'&&<Card><CardContent className="space-y-2 p-5"><CheckCircle2 className="h-6 w-6 text-primary"/><p className="font-semibold text-text-primary">Collection verified</p><p className="text-sm text-text-secondary">The vendor has scanned your QR pass. Confirm receipt from the order page when you have received your items.</p><Link href={`/orders/${params.id}`} className="text-sm font-semibold text-primary underline">Return to order</Link></CardContent></Card>}</>}
  <p className="text-xs text-text-tertiary">Your address is revealed for this paid order only. It does not change the public/private address setting on the vendor&apos;s storefront.</p>
 </div>
}
