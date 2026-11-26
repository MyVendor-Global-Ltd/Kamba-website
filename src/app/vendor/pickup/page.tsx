'use client'

import { useCallback,useEffect,useMemo,useRef,useState } from 'react'
import { AlertCircle,CheckCircle2,PackageCheck,RefreshCw,ScanLine,Camera,CameraOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card,CardContent,CardHeader,CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { apiJson } from '@/lib/api'

interface PickupOrder {id:string;order_number?:string;status:string;delivery_type:'pickup'|'delivery';store_name?:string;total?:number;total_amount?:number;created_at?:string}
type Detector = {detect:(source:HTMLVideoElement)=>Promise<Array<{rawValue:string}>>}
type DetectorConstructor = new(options?:{formats:string[]})=>Detector
export default function VendorPickupPage(){
 const [orders,setOrders]=useState<PickupOrder[]>([])
 const [orderId,setOrderId]=useState('')
 const [code,setCode]=useState('')
 const [loading,setLoading]=useState(true)
 const [saving,setSaving]=useState(false)
 const [feedback,setFeedback]=useState('')
 const [error,setError]=useState('')
 const [scanning,setScanning]=useState(false)
 const [scannerMessage,setScannerMessage]=useState('')
 const videoRef=useRef<HTMLVideoElement|null>(null)
 const selectedOrder=useMemo(()=>orders.find(order=>order.id===orderId),[orders,orderId])
 const stage=selectedOrder?.status==='paid_held'?'awaiting_confirmation':selectedOrder?.status==='confirmed'?'confirmed':selectedOrder?.status==='processing'?'preparing':['shipped'].includes(selectedOrder?.status||'')?'ready_for_pickup':selectedOrder?.status==='delivered'?'collected':selectedOrder?.status||'unknown'
 const loadOrders=useCallback(async()=>{
  setLoading(true);setError('')
  try{const data=await apiJson<{orders:PickupOrder[]}>('/commerce/vendor/orders',{params:{limit:100,offset:0}});const rows=(data.orders||[]).filter(order=>order.delivery_type==='pickup');setOrders(rows);setOrderId(current=>rows.some(order=>order.id===current)?current:rows[0]?.id||'')}
  catch(e){setError(e instanceof Error?e.message:'Could not load pickup orders.')}finally{setLoading(false)}
 },[])
 useEffect(()=>{void loadOrders()},[loadOrders])
 useEffect(()=>{
  if(!scanning)return
  let active=true,stream:MediaStream|null=null,frame=0
  const start=async()=>{
   const DetectorClass=(window as Window&{BarcodeDetector?:DetectorConstructor}).BarcodeDetector
   if(!DetectorClass){setScannerMessage('QR camera scanning is not supported in this browser. Enter the six-digit code manually.');setScanning(false);return}
   if(!navigator.mediaDevices?.getUserMedia){setScannerMessage('Camera access is unavailable. Enter the six-digit code manually.');setScanning(false);return}
   try{
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}})
    if(!active){stream.getTracks().forEach(track=>track.stop());return}
    if(videoRef.current){videoRef.current.srcObject=stream;await videoRef.current.play()}
    const detector=new DetectorClass({formats:['qr_code']})
    const scan=async()=>{if(!active||!videoRef.current)return;try{const found=await detector.detect(videoRef.current);if(found[0]?.rawValue){setCode(found[0].rawValue.trim());setScannerMessage('QR code scanned. Confirm collection below.');setScanning(false);return}}catch{setScannerMessage('Unable to read this QR yet. Keep it centred or enter the code manually.')}frame=requestAnimationFrame(()=>void scan())}
    frame=requestAnimationFrame(()=>void scan())
   }catch(e){setScannerMessage(e instanceof Error?e.message:'Could not open the camera. Enter the code manually.');setScanning(false)}
  }
  void start()
  return()=>{active=false;cancelAnimationFrame(frame);stream?.getTracks().forEach(track=>track.stop());if(videoRef.current)videoRef.current.srcObject=null}
 },[scanning])
 const advance=async(next:'confirmed'|'processing'|'shipped')=>{
  if(!orderId)return
  setSaving(true);setError('');setFeedback('')
  try{const result=await apiJson<{status:string}>(`/commerce/vendor/orders/${encodeURIComponent(orderId)}`,{method:'PATCH',body:JSON.stringify({status:next})});setOrders(current=>current.map(order=>order.id===orderId?{...order,status:result.status}:order));setFeedback(next==='shipped'?'Pickup marked ready. The buyer can now view the private collection address and QR pass.':next==='confirmed'?'Order accepted.':'Order moved to preparation.')}
  catch(e){setError(e instanceof Error?e.message:'Could not update this pickup order.')}finally{setSaving(false)}
 }
 const verify=async()=>{
  if(!orderId||!code.trim())return
  setSaving(true);setError('');setFeedback('')
  try{const result=await apiJson<{verified:boolean;order_status:string}>(`/commerce/vendor/orders/${encodeURIComponent(orderId)}/pickup/verify`,{method:'POST',body:JSON.stringify({code:code.trim()})});setOrders(current=>current.map(order=>order.id===orderId?{...order,status:result.order_status}:order));setCode('');setScanning(false);setFeedback('Collection verified. This QR code cannot be used again.');}
  catch(e){setError(e instanceof Error?e.message:'Pickup verification failed.')}finally{setSaving(false)}
 }
 return <div className="container mx-auto max-w-3xl space-y-6 px-4 py-10">
  <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold uppercase tracking-wider text-primary">Vendor workspace</p><h1 className="mt-2 text-3xl font-bold text-text-primary">Pickup desk</h1><p className="mt-2 text-text-secondary">Prepare paid pickup orders and verify collection with the buyer&apos;s one-time QR pass.</p></div><Button variant="outline" onClick={()=>void loadOrders()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4"/>Refresh orders</Button></div>
  {error&&<p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
  {feedback&&<p role="status" className="rounded-lg bg-secondary p-3 text-sm text-secondary-foreground">{feedback}</p>}
  <Card><CardHeader><CardTitle>Pickup orders</CardTitle></CardHeader><CardContent className="space-y-4">
   {loading?<p className="text-sm text-text-secondary">Loading pickup orders…</p>:orders.length===0?<div className="space-y-2 py-3"><PackageCheck className="h-7 w-7 text-text-tertiary"/><p className="font-medium text-text-primary">No pickup orders yet</p><p className="text-sm text-text-secondary">Paid orders placed with pickup will appear here.</p></div>:<>
    <label className="block text-sm font-medium text-text-secondary" htmlFor="pickup-order">Select order</label>
    <select id="pickup-order" value={orderId} onChange={event=>{setOrderId(event.target.value);setCode('');setFeedback('');setError('')}} className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary">{orders.map(order=><option key={order.id} value={order.id}>{order.order_number||order.id} · {order.store_name||'Store'} · {order.status}</option>)}</select>
    <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary p-3"><span className="text-sm text-secondary-foreground">Pickup stage</span><strong className="text-sm capitalize text-text-primary">{stage.replaceAll('_',' ')}</strong></div>
    <div className="flex flex-wrap gap-3"><Button variant="outline" onClick={()=>void advance('confirmed')} disabled={saving||stage!=='awaiting_confirmation'}>Accept order</Button><Button variant="outline" onClick={()=>void advance('processing')} disabled={saving||stage!=='confirmed'}>Start preparing</Button><Button onClick={()=>void advance('shipped')} disabled={saving||stage!=='preparing'}>Mark ready for pickup</Button></div>
   </>}
  </CardContent></Card>
  {selectedOrder&&stage==='ready_for_pickup'&&<Card><CardHeader><CardTitle>Verify buyer collection</CardTitle></CardHeader><CardContent className="space-y-4">
   <div className="flex items-center gap-2"><ScanLine className="h-5 w-5 text-primary"/><p className="text-sm text-text-secondary">Scan the QR pass on the buyer&apos;s screen or enter its six-digit value.</p></div>
   {scanning&&<div className="space-y-2"><video ref={videoRef} playsInline muted className="aspect-video w-full rounded-xl bg-black object-cover"/><p className="text-xs text-text-tertiary">Point the rear camera at the buyer&apos;s Kamba QR pass.</p><Button type="button" variant="outline" onClick={()=>setScanning(false)}><CameraOff className="mr-2 h-4 w-4"/>Stop camera</Button></div>}
   {!scanning&&<Button type="button" variant="outline" onClick={()=>{setScannerMessage('');setScanning(true)}}><Camera className="mr-2 h-4 w-4"/>Scan QR with camera</Button>}
   {scannerMessage&&<p role="status" className="text-xs text-text-tertiary">{scannerMessage}</p>}
   <Input label="Six-digit pickup code" inputMode="numeric" maxLength={6} placeholder="Enter scanned code" value={code} onChange={event=>setCode(event.target.value.replace(/\D/g,'').slice(0,6))}/>
   <Button onClick={()=>void verify()} disabled={saving||code.length!==6}><CheckCircle2 className="mr-2 h-4 w-4"/>Verify collection</Button>
   <p className="text-xs text-text-tertiary">Codes expire after 24 hours and lock after five incorrect attempts. Verification records collection; it does not release payment. The buyer still confirms receipt through their order.</p>
  </CardContent></Card>}
  {selectedOrder&&stage==='collected'&&<Card><CardContent className="space-y-2 p-5"><CheckCircle2 className="h-6 w-6 text-primary"/><p className="font-semibold text-text-primary">Collection verified</p><p className="text-sm text-text-secondary">This order has been marked delivered. The buyer must still confirm receipt before settlement can proceed.</p></CardContent></Card>}
  <p className="text-xs text-text-tertiary">The vendor never sees the buyer&apos;s pickup code in this workspace. Private pickup addresses are revealed only to the buyer on the ready order.</p>
 </div>
}
