'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { apiJson } from '@/lib/api'
import { formatDateTime, formatOrderStatus } from '@/lib/formatting'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StoreLaunchProgress } from '@/components/vendor/store-launch-progress'
import { ArrowUpRight, BriefcaseBusiness, MapPin, Package, RefreshCw, ShoppingBag, Star, Users, Heart, Settings2 } from 'lucide-react'

type VendorType = 'products' | 'services' | 'both'
interface BusinessProfile {
  business_name?: string | null
  location_mode?: string | null
  location_visibility?: 'private' | 'public' | null
  location_text?: string | null
  service_area_text?: string | null
  online_url?: string | null
}
interface ListingSummary {
  store_name?: string | null
  service_title?: string | null
  slug?: string | null
  business_profiles?: BusinessProfile | BusinessProfile[] | null
}
interface VendorProfile {
  vendor_type: VendorType
  verification_tier?: string | null
  is_active?: boolean
  is_banned?: boolean
  stores?: ListingSummary | ListingSummary[] | null
  service_profiles?: ListingSummary | ListingSummary[] | null
}
interface DashboardOrder { id: string; status: string; created_at?: string; item_count?: number; total?: number; total_amount?: number }
interface DashboardProduct { id: string; is_active: boolean; stock_quantity?: number }
interface DashboardRequest { id: string; status: string; request_type?: 'booking' | 'quotation'; service_title?: string; created_at?: string; buyer_username?: string }
function first<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] || null : value || null
}
function firstBusiness(value: ListingSummary['business_profiles']): BusinessProfile | null {
  return Array.isArray(value) ? value[0] || null : value || null
}

export function LiveVendorDashboard() {
  const [profile, setProfile] = useState<VendorProfile | null>(null)
  const [orders, setOrders] = useState<DashboardOrder[]>([])
  const [products, setProducts] = useState<DashboardProduct[]>([])
  const [requests, setRequests] = useState<DashboardRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadData = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true)
    else setLoading(true)
    try {
      setError('')
      const profileResponse = await apiJson<{ vendor_profile: VendorProfile }>('/vendors/profile')
      const vendor = profileResponse.vendor_profile
      if (!vendor) throw new Error('Your vendor profile could not be found.')
      const [orderResponse, productResponse, requestResponse] = await Promise.all([
        vendor.vendor_type === 'services' ? Promise.resolve({ orders: [] as DashboardOrder[] }) :
          apiJson<{ orders: DashboardOrder[] }>('/commerce/vendor/orders', { params: { limit: 100, offset: 0 } }),
        vendor.vendor_type === 'services' ? Promise.resolve({ products: [] as DashboardProduct[] }) :
          apiJson<{ products: DashboardProduct[] }>('/commerce/vendor/products', { params: { limit: 100, offset: 0 } }),
        vendor.vendor_type === 'products' ? Promise.resolve({ requests: [] as DashboardRequest[] }) :
          apiJson<{ requests: DashboardRequest[] }>('/service-bookings/requests', { params: { limit: 100 } }),
      ])
      setProfile(vendor)
      setOrders(orderResponse.orders || [])
      setProducts(productResponse.products || [])
      setRequests(requestResponse.requests || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your business overview.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { void loadData() }, [loadData])

  if (loading) return <div className="container mx-auto max-w-7xl space-y-5 px-4 py-10"><div className="h-9 w-1/3 animate-pulse rounded bg-surface-muted" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map(item => <div key={item} className="h-28 animate-pulse rounded-xl bg-surface-muted" />)}</div></div>
  if (!profile) return <main className="container mx-auto max-w-3xl space-y-4 px-4 py-12"><h1 className="font-display text-3xl font-bold text-text-primary">Business dashboard</h1><p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error || 'Your vendor profile is unavailable.'}</p><Button variant="outline" onClick={() => void loadData(true)}>Try again</Button></main>

  const store = first(profile.stores)
  const service = first(profile.service_profiles)
  const business = firstBusiness(store?.business_profiles) || firstBusiness(service?.business_profiles)
  const businessName = business?.business_name || store?.store_name || service?.service_title || 'Your business'
  const location = business?.location_text || business?.service_area_text || business?.online_url || 'No business location added yet'
  const pendingOrders = orders.filter(order => order.status === 'paid_held').length
  const activeProducts = products.filter(product => product.is_active).length
  const openRequests = requests.filter(request => !['completed', 'declined', 'cancelled'].includes(request.status)).length
  const requestsNeedingAttention = requests.filter(request => ['requested', 'accepted'].includes(request.status)).length
  const verification = profile.is_banned ? 'Restricted' : (profile.verification_tier || 'pending').replaceAll('_', ' ')
  const isProducts = profile.vendor_type !== 'services'
  const isServices = profile.vendor_type !== 'products'
  const settingsHref = profile.vendor_type === 'services' ? '/vendor/profile?section=business' : '/vendor/profile?section=business'

  return (
    <main className="container mx-auto max-w-7xl space-y-8 px-4 py-8 lg:py-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Your business / Overview</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-text-primary sm:text-4xl">Good business starts with a clear picture.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">Your business overview, location and incoming activity. Store orders and service requests are kept in their own workspaces.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => void loadData(true)} disabled={refreshing}><RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh</Button>
      </header>

      {error && <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Business activity">
        {isProducts && <Card variant="outlined"><CardContent className="p-5"><div className="flex items-center justify-between"><p className="text-xs font-medium text-text-tertiary">Orders to action</p><ShoppingBag className="h-4 w-4 text-primary" /></div><p className="mt-3 font-display text-3xl font-bold text-text-primary tabular-nums">{pendingOrders}</p><p className="mt-1 text-xs text-text-secondary">Paid product orders awaiting confirmation</p><Link href="/vendor/orders" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">Open orders <ArrowUpRight className="h-3 w-3" /></Link></CardContent></Card>}
        {isProducts && <Card variant="outlined"><CardContent className="p-5"><div className="flex items-center justify-between"><p className="text-xs font-medium text-text-tertiary">Active products</p><Package className="h-4 w-4 text-primary" /></div><p className="mt-3 font-display text-3xl font-bold text-text-primary tabular-nums">{activeProducts}</p><p className="mt-1 text-xs text-text-secondary">{products.length} products in your catalogue</p><Link href="/vendor/products" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">Manage products <ArrowUpRight className="h-3 w-3" /></Link></CardContent></Card>}
        {isServices && <Card variant="outlined"><CardContent className="p-5"><div className="flex items-center justify-between"><p className="text-xs font-medium text-text-tertiary">Requests to action</p><BriefcaseBusiness className="h-4 w-4 text-primary" /></div><p className="mt-3 font-display text-3xl font-bold text-text-primary tabular-nums">{requestsNeedingAttention}</p><p className="mt-1 text-xs text-text-secondary">New requests or accepted work to schedule</p><Link href="/vendor/service-requests" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">Open requests <ArrowUpRight className="h-3 w-3" /></Link></CardContent></Card>}
        {isServices && <Card variant="outlined"><CardContent className="p-5"><div className="flex items-center justify-between"><p className="text-xs font-medium text-text-tertiary">Open service requests</p><ClipboardIcon /></div><p className="mt-3 font-display text-3xl font-bold text-text-primary tabular-nums">{openRequests}</p><p className="mt-1 text-xs text-text-secondary">Bookings and quotation requests in progress</p><Link href="/vendor/service" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">Manage services <ArrowUpRight className="h-3 w-3" /></Link></CardContent></Card>}
        <Card variant="outlined"><CardContent className="p-5"><div className="flex items-center justify-between"><p className="text-xs font-medium text-text-tertiary">Business status</p><Badge variant={profile.is_banned ? 'destructive' : profile.is_active ? 'success' : 'warning'}>{profile.is_banned ? 'Restricted' : profile.is_active ? 'Active' : 'Inactive'}</Badge></div><p className="mt-3 font-display text-2xl font-bold capitalize text-text-primary">{verification}</p><p className="mt-1 text-xs text-text-secondary">Current verification level</p><Link href="/vendor/profile" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">Business settings <ArrowUpRight className="h-3 w-3" /></Link></CardContent></Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <Card variant="outlined">
          <CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle>Business profile</CardTitle><Badge variant="outline" className="capitalize">{profile.vendor_type === 'both' ? 'Store + services' : profile.vendor_type}</Badge></div></CardHeader>
          <CardContent className="space-y-5">
            <div><p className="text-xs uppercase tracking-wider text-text-tertiary">Business name</p><h2 className="mt-1 font-display text-2xl font-bold text-text-primary">{businessName}</h2></div>
            <div className="flex items-start gap-3 rounded-xl bg-surface-muted p-4"><MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-text-primary">Business location</p><p className="mt-1 text-sm text-text-secondary">{location}</p><p className="mt-2 text-xs leading-5 text-text-tertiary">{business?.location_text ? business.location_visibility === 'public' ? 'Your address is set to public visibility.' : 'Your exact address is private on public listings.' : 'Add a location or service area to help customers understand where you operate.'}</p></div></div>
            <div className="flex flex-wrap gap-2"><Link href={settingsHref}><Button><Settings2 className="mr-2 h-4 w-4" /> Edit business profile & location</Button></Link>{store?.slug && <Link href={`/store/${store.slug}`} target="_blank" rel="noreferrer"><Button variant="outline">View storefront</Button></Link>}{service?.slug && <Link href={`/marketplace/services/${service.slug}`} target="_blank" rel="noreferrer"><Button variant="outline">View service page</Button></Link>}</div>
            <p className="text-xs leading-5 text-text-tertiary">Your business location is managed in one place. The same address and visibility settings are shared across your eligible listings.</p>
          </CardContent>
        </Card>
        <Card variant="outlined">
          <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {isProducts && <Link href="/vendor/store" className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-surface-muted"><span className="flex items-center gap-3"><Store className="h-5 w-5 text-primary" /><span><strong className="block text-sm text-text-primary">Manage Store</strong><span className="text-xs text-text-tertiary">Storefront, products and orders</span></span></span><ArrowUpRight className="h-4 w-4 text-text-tertiary" /></Link>}
            {isServices && <Link href="/vendor/service" className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-surface-muted"><span className="flex items-center gap-3"><BriefcaseBusiness className="h-5 w-5 text-primary" /><span><strong className="block text-sm text-text-primary">Manage Services</strong><span className="text-xs text-text-tertiary">Listings, requests and quotations</span></span></span><ArrowUpRight className="h-4 w-4 text-text-tertiary" /></Link>}
            <Link href="/vendor/profile?section=payouts" className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-surface-muted"><span className="flex items-center gap-3"><Settings2 className="h-5 w-5 text-primary" /><span><strong className="block text-sm text-text-primary">Payout settings</strong><span className="text-xs text-text-tertiary">Bank beneficiary and payment details</span></span></span><ArrowUpRight className="h-4 w-4 text-text-tertiary" /></Link>
          </CardContent>
        </Card>
      </section>

      {isProducts && <StoreLaunchProgress />}

      <section className="space-y-3">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Community & trust</p><h2 className="mt-1 font-display text-2xl font-bold text-text-primary">Your audience, in one place.</h2><p className="mt-1 text-sm text-text-secondary">These indicators will only show once verified engagement data is available.</p></div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[{label:'Customer ratings',icon:Star},{label:'Followers',icon:Users},{label:'Likes',icon:Heart}].map(item => { const Icon=item.icon; return <Card key={item.label} variant="outlined"><CardContent className="flex items-center gap-3 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-muted text-text-tertiary"><Icon className="h-5 w-5" /></span><div><p className="text-sm font-semibold text-text-primary">{item.label}</p><p className="mt-0.5 text-xs text-text-tertiary">Not connected yet</p></div></CardContent></Card> })}
        </div>
      </section>
    </main>
  )
}

function ClipboardIcon() {
  return <BriefcaseBusiness className="h-4 w-4 text-primary" />
}
