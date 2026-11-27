'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { apiJson } from '@/lib/api'
import { ChevronDown, LayoutDashboard, Store, BriefcaseBusiness } from 'lucide-react'

type VendorType = 'products' | 'services' | 'both'
interface VendorProfileResponse { vendor_profile?: { vendor_type?: VendorType } }
interface OrderRow { status?: string }
interface RequestRow { status?: string }

export function VendorWorkspaceNavigation() {
  const pathname = usePathname()
  const [vendorType, setVendorType] = useState<VendorType>('products')
  const [pendingOrders, setPendingOrders] = useState(0)
  const [pendingRequests, setPendingRequests] = useState(0)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const profile = await apiJson<VendorProfileResponse>('/vendors/profile')
        const type = profile.vendor_profile?.vendor_type || 'products'
        if (!active) return
        setVendorType(type)

        const [orders, requests] = await Promise.all([
          type === 'services' ? Promise.resolve({ orders: [] as OrderRow[] }) :
            apiJson<{ orders: OrderRow[] }>('/commerce/vendor/orders', { params: { limit: 100, offset: 0 } }),
          type === 'products' ? Promise.resolve({ requests: [] as RequestRow[] }) :
            apiJson<{ requests: RequestRow[] }>('/service-bookings/requests', { params: { limit: 100 } }),
        ])
        if (!active) return
        setPendingOrders((orders.orders || []).filter(order => order.status === 'paid_held').length)
        setPendingRequests((requests.requests || []).filter(request =>
          ['requested', 'accepted', 'scheduled', 'in_progress'].includes(request.status || '')
        ).length)
      } catch {
        // Navigation remains usable if a count endpoint is temporarily unavailable.
      }
    }
    void load()
    return () => { active = false }
  }, [pathname])

  const storeActive = pathname.startsWith('/vendor/store') || pathname.startsWith('/vendor/products') || pathname.startsWith('/vendor/orders') || pathname.startsWith('/vendor/pickup')
  const servicesActive = pathname.startsWith('/vendor/service')
  const dashboardActive = pathname === '/vendor/dashboard'

  const navLink = (href: string, active: boolean, label: string, Icon: typeof Store, pending = 0) => (
    <Link href={href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${active ? 'bg-primary/10 font-semibold text-primary' : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'}`}>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="min-w-0 flex-1">{label}</span>
      {pending > 0 && <span aria-label={`${pending} pending items`} className="relative mr-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-red-500"><span className="absolute inset-0 animate-ping rounded-full bg-red-500/50" /></span>}
    </Link>
  )

  return (
    <div className="sticky top-16 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="container mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2">
        <details className="group relative">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:border-primary/40 [&::-webkit-details-marker]:hidden">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary"><LayoutDashboard className="h-4 w-4" /></span>
            Vendor workspace
            <ChevronDown className="h-4 w-4 text-text-tertiary transition-transform group-open:rotate-180" />
          </summary>
          <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-2 shadow-xl">
            <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.18em] text-text-tertiary">Your workspace</p>
            {navLink('/vendor/dashboard', dashboardActive, 'Dashboard', LayoutDashboard)}
            {vendorType !== 'services' && navLink('/vendor/store', storeActive, 'Manage Store', Store, pendingOrders)}
            {vendorType !== 'products' && navLink('/vendor/service', servicesActive, 'Manage Services', BriefcaseBusiness, pendingRequests)}
          </div>
        </details>
        <Link href="/vendor/profile" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary">
          Business profile <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </div>
  )
}
