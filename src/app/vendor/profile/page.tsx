'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiJson } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BusinessListingEditor } from '@/components/vendor/business-listing-editor'
import { VendorPaymentsSettings } from '@/components/vendor/vendor-payments-settings'

type Section='overview'|'business'|'service'|'payouts'|'contacts'
interface BusinessProfile { business_name?:string|null;location_visibility?:'private'|'public'|null;location_text?:string|null;service_area_text?:string|null;online_url?:string|null }
interface VendorStore { store_name?:string|null;slug?:string|null;category?:string|null;business_profiles?:BusinessProfile|BusinessProfile[]|null }
interface VendorService { service_title?:string|null;slug?:string|null;category?:string|null;business_profiles?:BusinessProfile|BusinessProfile[]|null }
interface VendorProfile { id:string;vendor_type:'products'|'services'|'both';verification_tier?:string|null;is_active?:boolean;is_banned?:boolean;contact_whatsapp?:string|null;contact_phone?:string|null;stores?:VendorStore[]|VendorStore|null;service_profiles?:VendorService[]|VendorService|null }
function first<T>(value:T[]|T|null|undefined):T|null{return Array.isArray(value)?value[0]||null:value||null}
const sections:Array<{id:Section;label:string;description:string}>= [
 {id:'overview',label:'Overview',description:'Business status and shortcuts'},
 {id:'business',label:'Business',description:'Identity, storefront and pickup location'},
 {id:'service',label:'Service',description:'Service listing details'},
 {id:'payouts',label:'Payouts',description:'Bank account and payment history'},
 {id:'contacts',label:'Contacts',description:'Business phone and WhatsApp'},
]
export default function VendorProfilePage(){
 const router=useRouter()
 const [profile,setProfile]=useState<VendorProfile|null>(null)
 const [section,setSection]=useState<Section>('overview')
 const [whatsapp,setWhatsapp]=useState('')
 const [phone,setPhone]=useState('')
 const [loading,setLoading]=useState(true)
 const [saving,setSaving]=useState(false)
 const [error,setError]=useState('')
 const [success,setSuccess]=useState('')
 const loadProfile=useCallback(async()=>{
  setLoading(true);setError('')
  try{const data=await apiJson<{vendor_profile:VendorProfile}>('/vendors/profile');if(!data.vendor_profile?.id)throw new Error('The server did not return your vendor profile.');setProfile(data.vendor_profile);setWhatsapp(data.vendor_profile.contact_whatsapp||'');setPhone(data.vendor_profile.contact_phone||'')}
  catch(err){setError(err instanceof Error?err.message:'Could not load your vendor profile.')}finally{setLoading(false)}
 },[])
 useEffect(()=>{void loadProfile()},[loadProfile])
 useEffect(()=>{const requested=new URLSearchParams(window.location.search).get('section');if(['overview','business','service','payouts','contacts'].includes(requested||''))setSection(requested as Section)},[])
 const saveContacts=async(event:React.FormEvent)=>{
  event.preventDefault();setSaving(true);setError('');setSuccess('')
  try{const data=await apiJson<{vendor_profile:VendorProfile}>('/vendors/profile',{method:'PATCH',body:JSON.stringify({contact_whatsapp:whatsapp.trim()||null,contact_phone:phone.trim()||null})});if(!data.vendor_profile?.id)throw new Error('The server did not confirm the profile update.');setProfile(data.vendor_profile);setWhatsapp(data.vendor_profile.contact_whatsapp||'');setPhone(data.vendor_profile.contact_phone||'');setSuccess('Your business contact details have been saved.')}
  catch(err){setError(err instanceof Error?err.message:'Could not save your contact details.')}finally{setSaving(false)}
 }
 const changeSection=(next:Section)=>{setSection(next);const url=new URL(window.location.href);url.searchParams.set('section',next);window.history.replaceState({},'',url)}
 if(loading)return <div className="container mx-auto max-w-5xl px-4 py-12"><div className="h-64 animate-pulse rounded-xl bg-surface-muted"/></div>
 if(!profile)return <div className="container mx-auto max-w-4xl space-y-4 px-4 py-12"><h1 className="font-display text-3xl font-bold text-text-primary">Business settings</h1><p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error||'No vendor profile was returned.'}</p><Button variant="outline" onClick={()=>void loadProfile()}>Retry</Button></div>
 const store=first(profile.stores),service=first(profile.service_profiles),business=first(store?.business_profiles)||first(service?.business_profiles)
 const businessName=business?.business_name||store?.store_name||service?.service_title||'Your business'
 const visibleSections=sections.filter(item=>item.id!=='service'||profile.vendor_type==='services'||profile.vendor_type==='both')
 const verification=profile.is_banned?'Restricted':(profile.verification_tier||'pending').replaceAll('_',' ')
 return <div className="container mx-auto max-w-5xl space-y-6 px-4 py-8 lg:py-12">
  <header><p className="text-sm font-semibold uppercase tracking-wider text-primary">Vendor workspace</p><h1 className="mt-2 font-display text-3xl font-bold text-text-primary">Business settings</h1><p className="mt-2 max-w-2xl text-sm text-text-secondary">One place for your business identity, listings, location, contact details and payouts. Your dashboard remains for managing orders and daily activity.</p></header>
  <nav aria-label="Business settings sections" className="flex flex-wrap gap-2 border-b border-border pb-3">
   {visibleSections.map(item=><button key={item.id} type="button" onClick={()=>changeSection(item.id)} aria-current={section===item.id?'page':undefined} className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${section===item.id?'bg-primary text-primary-foreground':'border border-border text-text-secondary hover:bg-surface-muted'}`}>{item.label}</button>)}
  </nav>
  {error&&<p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
  {success&&<p role="status" className="rounded-lg bg-secondary p-4 text-sm text-secondary-foreground">{success}</p>}
  {section==='overview'&&<div className="space-y-5">
   <Card variant="outlined"><CardHeader><CardTitle>{businessName}</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
    <div><p className="text-xs text-text-tertiary">Business type</p><p className="mt-1 font-medium capitalize text-text-primary">{profile.vendor_type}</p></div>
    <div><p className="text-xs text-text-tertiary">Verification</p><p className="mt-1 font-medium capitalize text-text-primary">{verification}</p></div>
    <div><p className="text-xs text-text-tertiary">Account status</p><p className="mt-1 font-medium text-text-primary">{profile.is_banned?'Restricted':profile.is_active?'Active':'Inactive'}</p></div>
    <div><p className="text-xs text-text-tertiary">Business / pickup location</p><p className="mt-1 font-medium text-text-primary">{business?.location_text||business?.service_area_text||business?.online_url||'Not provided'}</p><p className="mt-1 text-xs text-text-tertiary">{business?.location_text?business.location_visibility==='public'?'Exact address is public.':'Exact address stays private on public pages.':'Add a physical location if you intend to offer pickup.'}</p></div>
    {store&&<div><p className="text-xs text-text-tertiary">Storefront</p><p className="mt-1 font-medium text-text-primary">{store.store_name}</p>{store.slug&&<a className="text-sm text-primary underline" href={`/store/${store.slug}`}>View public store</a>}</div>}
    {service&&<div><p className="text-xs text-text-tertiary">Service listing</p><p className="mt-1 font-medium text-text-primary">{service.service_title}</p>{service.slug&&<a className="text-sm text-primary underline" href={`/marketplace/services/${service.slug}`}>View public service</a>}</div>}
   </CardContent></Card>
   <div className="grid gap-3 sm:grid-cols-2"><Card variant="outlined"><CardContent className="space-y-2 p-5"><h2 className="font-semibold text-text-primary">Manage your business</h2><p className="text-sm text-text-secondary">Edit the business name, listing information and one shared physical pickup location.</p><Button onClick={()=>changeSection('business')}>Business details</Button></CardContent></Card><Card variant="outlined"><CardContent className="space-y-2 p-5"><h2 className="font-semibold text-text-primary">Manage money</h2><p className="text-sm text-text-secondary">Manage your verified bank beneficiary and review payment activity.</p><Button variant="outline" onClick={()=>changeSection('payouts')}>Payout settings</Button></CardContent></Card></div>
   <Card variant="outlined"><CardContent className="flex flex-wrap items-center justify-between gap-4 p-5"><div><h2 className="font-semibold text-text-primary">Pickup desk</h2><p className="mt-1 text-sm text-text-secondary">Confirm, prepare and verify collection for paid pickup orders.</p></div><Button variant="outline" onClick={()=>router.push('/vendor/pickup')}>Open pickup desk</Button></CardContent></Card>
  </div>}
  {section==='business'&&<BusinessListingEditor kind="store"/>}
  {section==='service'&&<BusinessListingEditor kind="service"/>}
  {section==='payouts'&&<VendorPaymentsSettings/>}
  {section==='contacts'&&<Card variant="outlined"><CardHeader><CardTitle>Business contact details</CardTitle></CardHeader><CardContent><form onSubmit={saveContacts} className="max-w-xl space-y-4"><Input label="Business WhatsApp number" type="tel" value={whatsapp} onChange={event=>setWhatsapp(event.target.value)} placeholder="+234…"/><Input label="Business phone number" type="tel" value={phone} onChange={event=>setPhone(event.target.value)} placeholder="+234…"/><p className="text-xs text-text-tertiary">These are public business contact details. They do not change the phone number or verification status on your personal Kamba account.</p><Button type="submit" disabled={saving}>{saving?'Saving…':'Save contact details'}</Button></form></CardContent></Card>}
 </div>
}
