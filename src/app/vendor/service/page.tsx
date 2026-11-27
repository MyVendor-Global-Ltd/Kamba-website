'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiJson } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowUpRight, BriefcaseBusiness, ClipboardList, CreditCard, Settings2 } from 'lucide-react'

interface ServiceProfile { service_title?: string; slug?: string; category?: string; description?: string; service_images?: string[] }
interface RequestRow { status?: string; request_type?: 'booking' | 'quotation' }
interface VendorProfile { vendor_type?: 'products' | 'services' | 'both' }
export default function VendorServicePage() {
  const [service, setService] = useState<ServiceProfile | null>(null)
  const [requests, setRequests] = useState<RequestRow[]>([])
  const [vendorType, setVendorType] = useState<VendorProfile['vendor_type']>('services')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const profile = await apiJson<{ vendor_profile?: VendorProfile }>('/vendors/profile')
        const type = profile.vendor_profile?.vendor_type || 'services'
        if (!active) return
        setVendorType(type)
        if (type === 'products') {
          window.location.replace('/vendor/store')
          return
        }
        const [serviceResult, requestResult] = await Promise.all([
          apiJson<{ service_profile?: ServiceProfile }>('/vendors/service'),
          apiJson<{ requests: RequestRow[] }>('/service-bookings/requests', { params: { limit: 100 } }),
        ])
        if (!active) return
        setService(serviceResult.service_profile || null)
        setRequests(requestResult.requests || [])
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Could not load your services workspace.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [])

  const needsAttention = requests.filter(request => ['requested', 'accepted'].includes(request.status || '')).length
  const openRequests = requests.filter(request => !['completed', 'declined', 'cancelled'].includes(request.status || '')).length
  const serviceSettingsHref = vendorType === 'services' ? '/vendor/profile?section=business' : '/vendor/profile?section=service'

  const cards = [
    { title: 'Service listing', detail: 'Edit what you offer, your category, description, price range and service images.', href: serviceSettingsHref, label: 'Edit service listing', icon: BriefcaseBusiness },
    { title: 'Requests & quotations', detail: 'Handle booking requests, send proposals, agree schedules and update service progress.', href: '/vendor/service-requests', label: 'Manage requests', icon: ClipboardList },
    { title: 'Payments & payouts', detail: 'Review the payment and payout settings available to your vendor account.', href: '/vendor/payments', label: 'Payment settings', icon: CreditCard },
  ]

  return (
    <main className="container mx-auto max-w-7xl space-y-8 px-4 py-8 lg:py-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Vendor workspace / Services</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-text-primary sm:text-4xl">Manage your services.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">Your service listing, booking requests, quotation requests and agreed work stay together here. Product stock and product orders belong in Manage Store.</p>
        </div>
        <Link href="/vendor/service-requests"><Button variant="outline"><ClipboardList className="mr-2 h-4 w-4" /> Open requests</Button></Link>
      </header>
      {error && <p role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
      {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><div className="h-36 animate-pulse rounded-xl bg-surface-muted" /><div className="h-36 animate-pulse rounded-xl bg-surface-muted" /><div className="h-36 animate-pulse rounded-xl bg-surface-muted" /></div> : <>
        <section className="grid gap-3 sm:grid-cols-3" aria-label="Services overview">
          <Card variant="outlined"><CardContent className="p-5"><p className="text-xs text-text-tertiary">Service listing</p><p className="mt-2 truncate font-display text-xl font-bold text-text-primary">{service?.service_title || 'Service profile unavailable'}</p><p className="mt-1 text-xs text-text-secondary">{service?.category || 'Service business'}</p></CardContent></Card>
          <Card variant="outlined"><CardContent className="p-5"><div className="flex items-center justify-between gap-2"><p className="text-xs text-text-tertiary">Requests needing attention</p>{needsAttention > 0 && <Badge variant="destructive">{needsAttention} pending</Badge>}</div><p className="mt-2 font-display text-2xl font-bold text-text-primary tabular-nums">{needsAttention}</p><p className="mt-1 text-xs text-text-secondary">New requests or accepted work to schedule</p></CardContent></Card>
          <Card variant="outlined"><CardContent className="p-5"><p className="text-xs text-text-tertiary">Open service requests</p><p className="mt-2 font-display text-2xl font-bold text-text-primary tabular-nums">{openRequests}</p><p className="mt-1 text-xs text-text-secondary">Across bookings and quotations</p></CardContent></Card>
        </section>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map(item => {
            const Icon = item.icon
            return <Card key={item.href} variant="outlined" className="group transition-colors hover:border-primary/40"><CardContent className="flex h-full flex-col gap-5 p-5 sm:p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
              <div className="flex-1"><h2 className="font-display text-xl font-bold text-text-primary">{item.title}</h2><p className="mt-2 text-sm leading-6 text-text-secondary">{item.detail}</p></div>
              <Link href={item.href} className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary transition-all group-hover:gap-3">{item.label}<ArrowUpRight className="h-4 w-4" /></Link>
            </CardContent></Card>
          })}
        </section>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <p className="max-w-2xl text-xs leading-5 text-text-tertiary">Your business identity and location are shared across your Kamba listings. Manage the location once in Business profile settings instead of entering it again for each service.</p>
          <Link href={serviceSettingsHref} className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary hover:text-primary"><Settings2 className="h-4 w-4" /> Business profile settings</Link>
        </div>
      </>}
    </main>
  )
}
