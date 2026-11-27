'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiJson } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowUpRight, Package, ShoppingBag, Store, QrCode, Settings2 } from 'lucide-react'

interface StoreProfile { store_name?: string; slug?: string; category?: string; store_image_url?: string | null; store_logo_url?: string | null }
interface OrderRow { status?: string }
interface ProductRow { is_active?: boolean }
interface VendorProfile { vendor_type?: 'products' | 'services' | 'both' }
const actions = [
  { title: 'Storefront & branding', detail: 'Update your store name, description, logo, cover and public page.', href: '/vendor/profile?section=business', icon: Store, action: 'Edit storefront' },
  { title: 'Products', detail: 'Create listings, update prices, manage stock and archive items.', href: '/vendor/products', icon: Package, action: 'Manage products' },
  { title: 'Product orders', detail: 'Review paid orders, confirm them and manage fulfilment.', href: '/vendor/orders', icon: ShoppingBag, action: 'Manage orders' },
  { title: 'Pickup desk', detail: 'Prepare pickup orders and verify the buyer’s one-time QR pass.', href: '/vendor/pickup', icon: QrCode, action: 'Open pickup desk' },
]
export default function VendorStorePage() {
  const [store, setStore] = useState<StoreProfile | null>(null)
  const [products, setProducts] = useState<ProductRow[]>([])
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const profile = await apiJson<{ vendor_profile?: VendorProfile }>('/vendors/profile')
        if (profile.vendor_profile?.vendor_type === 'services') {
          window.location.replace('/vendor/service')
          return
        }
        const [storeResult, productResult, orderResult] = await Promise.all([
          apiJson<{ store?: StoreProfile }>('/vendors/store'),
          apiJson<{ products: ProductRow[] }>('/commerce/vendor/products', { params: { limit: 100, offset: 0 } }),
          apiJson<{ orders: OrderRow[] }>('/commerce/vendor/orders', { params: { limit: 100, offset: 0 } }),
        ])
        if (!active) return
        setStore(storeResult.store || null)
        setProducts(productResult.products || [])
        setOrders(orderResult.orders || [])
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Could not load your store workspace.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [])

  const pendingOrders = orders.filter(order => order.status === 'paid_held').length
  const activeProducts = products.filter(product => product.is_active).length

  return (
    <main className="container mx-auto max-w-7xl space-y-8 px-4 py-8 lg:py-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Vendor workspace / Store</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-text-primary sm:text-4xl">Manage your store.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">Your storefront, product catalogue, product orders and pickup collection all live here. Service enquiries are kept in Manage Services.</p>
        </div>
        <Link href="/vendor/products/new"><Button><Package className="mr-2 h-4 w-4" /> Add a product</Button></Link>
      </header>
      {error && <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
      {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><div className="h-32 animate-pulse rounded-xl bg-surface-muted" /><div className="h-32 animate-pulse rounded-xl bg-surface-muted" /><div className="h-32 animate-pulse rounded-xl bg-surface-muted" /></div> : <>
        <section className="grid gap-3 sm:grid-cols-3" aria-label="Store overview">
          <Card variant="outlined"><CardContent className="p-5"><p className="text-xs text-text-tertiary">Storefront</p><p className="mt-2 truncate font-display text-xl font-bold text-text-primary">{store?.store_name || 'Store profile unavailable'}</p><p className="mt-1 text-xs text-text-secondary">{store?.category || 'Business listing'}</p></CardContent></Card>
          <Card variant="outlined"><CardContent className="p-5"><p className="text-xs text-text-tertiary">Active products</p><p className="mt-2 font-display text-2xl font-bold text-text-primary tabular-nums">{activeProducts}</p><p className="mt-1 text-xs text-text-secondary">{products.length} products in your catalogue</p></CardContent></Card>
          <Card variant="outlined"><CardContent className="p-5"><div className="flex items-center justify-between gap-2"><p className="text-xs text-text-tertiary">Orders needing attention</p>{pendingOrders > 0 && <Badge variant="destructive">{pendingOrders} pending</Badge>}</div><p className="mt-2 font-display text-2xl font-bold text-text-primary tabular-nums">{pendingOrders}</p><p className="mt-1 text-xs text-text-secondary">Paid orders waiting for your confirmation</p></CardContent></Card>
        </section>
        <section className="grid gap-4 md:grid-cols-2">
          {actions.map(item => {
            const Icon = item.icon
            const pending = item.href === '/vendor/orders' ? pendingOrders : 0
            return <Card key={item.href} variant="outlined" className="group transition-colors hover:border-primary/40">
              <CardContent className="flex h-full flex-col gap-5 p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                  {pending > 0 && <Badge variant="destructive">{pending} needs attention</Badge>}
                </div>
                <div className="flex-1"><h2 className="font-display text-xl font-bold text-text-primary">{item.title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">{item.detail}</p></div>
                <Link href={item.href} className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary transition-colors group-hover:gap-3">{item.action}<ArrowUpRight className="h-4 w-4" /></Link>
              </CardContent>
            </Card>
          })}
        </section>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <p className="max-w-2xl text-xs leading-5 text-text-tertiary">Business name, public location, address visibility and map position are managed once in your Business profile. They are not repeated across product and order screens.</p>
          <Link href="/vendor/profile?section=business" className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary hover:text-primary"><Settings2 className="h-4 w-4" /> Business profile settings</Link>
        </div>
      </>}
    </main>
  )
}
