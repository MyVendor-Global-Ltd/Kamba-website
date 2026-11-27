'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { isMockMode } from '@/lib/mock-api'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProductFilters } from '@/components/marketplace/product-filters'
import { useServiceSearch } from '@/hooks/useServiceSearch'
import { ArrowUpRight, BriefcaseBusiness, ChevronLeft, ChevronRight, MapPin, Search, Star } from 'lucide-react'
import type { Service } from '@/types/vendor'

function ServiceGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0)
  const validImages = images.filter(Boolean)
  if (!validImages.length) {
    return <div className="relative grid aspect-[5/4] place-items-center overflow-hidden bg-secondary text-primary/40"><BriefcaseBusiness className="h-12 w-12" /><span className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-[0.18em] text-text-tertiary">Service portfolio</span></div>
  }
  const move = (direction: number) => setActive(current => (current + direction + validImages.length) % validImages.length)
  return (
    <div className="group/gallery relative aspect-[5/4] overflow-hidden bg-secondary">
      <img src={validImages[active]} alt={`${name} service image ${active + 1}`} className="h-full w-full object-cover transition-transform duration-700 group-hover/gallery:scale-[1.035]" loading="lazy" />
      {validImages.length > 1 && <>
        <button type="button" onClick={() => move(-1)} aria-label="Previous service image" className="absolute left-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-background/90 text-text-primary opacity-0 shadow-sm transition-opacity group-hover/gallery:opacity-100 focus:opacity-100"><ChevronLeft className="h-4 w-4" /></button>
        <button type="button" onClick={() => move(1)} aria-label="Next service image" className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-background/90 text-text-primary opacity-0 shadow-sm transition-opacity group-hover/gallery:opacity-100 focus:opacity-100"><ChevronRight className="h-4 w-4" /></button>
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-background/85 px-2.5 py-1.5 backdrop-blur">{validImages.map((_, index) => <button key={index} type="button" aria-label={`Show image ${index + 1}`} aria-pressed={active === index} onClick={() => setActive(index)} className={`h-1.5 rounded-full transition-all ${active === index ? 'w-5 bg-primary' : 'w-1.5 bg-text-tertiary/70'}`} />)}</div>
      </>}
    </div>
  )
}

function ServiceListingCard({ service }: { service: Service }) {
  const businessName = service.business_profiles?.business_name || service.name
  const images = service.service_images || []
  const isVerified = service.verification_status !== 'pending' && service.verification_status !== 'rejected'
  return (
    <Card variant="outlined" className="group h-full overflow-hidden border-border/80 bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg">
      <div className="relative">
        <ServiceGallery images={images} name={businessName} />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {service.category && <Badge variant="secondary" className="border border-background/60 bg-background/90 text-text-primary backdrop-blur">{service.category}</Badge>}
          {isVerified && <Badge variant="success" className="shadow-sm">{service.verification_status === 'business' ? 'Business verified' : 'Verified'}</Badge>}
        </div>
      </div>
      <CardContent className="flex min-h-[230px] flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold uppercase tracking-[0.16em] text-text-tertiary">{businessName}</p>
            <Link href={`/marketplace/services/${service.slug}`} className="mt-2 block rounded-sm font-display text-xl font-bold leading-tight text-text-primary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{service.name}</Link>
          </div>
          <Link href={`/marketplace/services/${service.slug}`} aria-label={`Explore ${businessName}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-text-secondary transition-colors group-hover:border-primary group-hover:text-primary"><ArrowUpRight className="h-4 w-4" /></Link>
        </div>
        {service.description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-text-secondary">{service.description}</p>}
        <div className="mt-auto space-y-3 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <span className="flex min-w-0 items-center gap-1.5 text-xs text-text-tertiary"><MapPin className="h-3.5 w-3.5 shrink-0 text-primary" /><span className="truncate">{[service.city, service.state].filter(Boolean).join(', ') || 'Location shared on request'}</span></span>
            {service.price_range && <span className="shrink-0 text-sm font-semibold text-text-primary">{service.price_range}</span>}
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-text-tertiary"><span className="inline-flex items-center gap-1.5"><Star className="h-3.5 w-3.5" /> Not rated yet</span><Link href={`/marketplace/services/${service.slug}`} className="font-semibold text-primary hover:underline">Explore provider <ArrowUpRight className="ml-1 inline h-3 w-3" /></Link></div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ServicesPage() {
  const {
    services,
    loading,
    error,
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    pagination,
    loadMore,
    hasMore,
    refresh,
  } = useServiceSearch({ pageSize: 100 })

  const categories = useMemo(() => Array.from(new Set([
    'Cleaning', 'Repairs', 'Plumbing', 'Electrical', 'Beauty', 'Tutoring', 'Delivery', 'Photography',
    ...services.map(service => service.category).filter((category): category is string => Boolean(category?.trim())),
  ])).sort((a, b) => a.localeCompare(b)), [services])

  const visibleServices = useMemo(() => services.filter(service => {
    const query = filters.query.trim().toLowerCase()
    const location = filters.location.trim().toLowerCase()
    const serviceText = `${service.name} ${service.business_profiles?.business_name || ''} ${service.description || ''} ${service.category || ''}`.toLowerCase()
    const serviceLocation = `${service.city || ''} ${service.state || ''}`.toLowerCase()
    return (!query || serviceText.includes(query)) && (!location || serviceLocation.includes(location))
  }), [services, filters.query, filters.location])

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 1000) loadMore()
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMore])

  return (
    <main className="container mx-auto max-w-[1600px] space-y-9 px-4 py-8 lg:py-12">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-border bg-secondary/35 px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-14">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[1px] border-primary/10" />
        <div className="pointer-events-none absolute -right-2 -top-10 h-52 w-52 rounded-full border-[1px] border-primary/10" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Kamba / The service directory</p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-tight text-text-primary sm:text-5xl lg:text-6xl">Good people.<br /><span className="text-primary">Useful skills.</span> Close by.</h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-text-secondary sm:text-base">Find local professionals, campus talent and service providers for the things you need done. Explore their work, compare details and send a request directly through Kamba.</p>
          </div>
          <div className="flex flex-col gap-2 lg:min-w-[210px] lg:items-end">
            <span className="text-3xl font-display font-bold tabular-nums text-text-primary">{pagination.total.toLocaleString()}</span>
            <span className="text-xs uppercase tracking-[0.15em] text-text-tertiary">Services listed</span>
            <Button variant="outline" onClick={() => refresh()} disabled={loading} className="mt-2">Refresh directory</Button>
          </div>
        </div>
        <div className="relative mt-8 max-w-2xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-text-tertiary" />
          <input type="search" aria-label="Search services and providers" placeholder="What do you need help with?" value={filters.query} onChange={event => setFilters({ query: event.target.value })} className="h-14 w-full rounded-xl border border-border bg-background pl-12 pr-4 text-sm text-text-primary shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15" />
        </div>
      </section>

      {!isMockMode && (filters.query.trim() || filters.location.trim()) && <p role="status" className="rounded-lg border border-gold-dim bg-gold-soft px-4 py-3 text-xs leading-5 text-text-primary">Search and city matching refine the first 100 listings loaded from the service directory. Category and nearby-coordinate filters are applied by the API.</p>}
      {error && <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

      <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:gap-9">
        <aside className="w-full shrink-0 lg:sticky lg:top-36 lg:w-[270px]" aria-label="Service filters">
          <div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Refine your search</p><h2 className="mt-1 font-display text-xl font-bold text-text-primary">Find your fit.</h2></div>{hasActiveFilters && <button type="button" onClick={clearFilters} className="text-xs font-semibold text-primary hover:underline">Clear all</button>}</div>
          <ProductFilters filters={filters} onFiltersChange={setFilters} categories={categories} mode="services" showSearch={false} onClearAll={clearFilters} hasActiveFilters={hasActiveFilters} />
        </aside>

        <section className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-text-tertiary">Browse local talent</p><h2 className="mt-1 font-display text-2xl font-bold text-text-primary">{filters.query || filters.category ? 'Matching services' : 'Explore services'}</h2><p className="mt-1 text-xs text-text-tertiary">{visibleServices.length} shown{filters.query.trim() || filters.location.trim() ? ` from ${services.length} loaded` : ` of ${pagination.total}`}</p></div>
            <span className="text-xs text-text-tertiary">A closer look at the people behind the work</span>
          </div>

          {loading && services.length === 0 ? <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{[1,2,3,4,5,6,7,8].map(item => <div key={item} className="overflow-hidden rounded-2xl border border-border"><div className="aspect-[5/4] animate-pulse bg-surface-muted" /><div className="space-y-3 p-4"><div className="h-4 w-2/3 animate-pulse rounded bg-surface-muted" /><div className="h-6 w-4/5 animate-pulse rounded bg-surface-muted" /><div className="h-3 w-full animate-pulse rounded bg-surface-muted" /></div></div>)}</div> :
            visibleServices.length > 0 ? <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{visibleServices.map(service => <ServiceListingCard key={service.id} service={service} />)}</div> :
            <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center"><BriefcaseBusiness className="mx-auto h-10 w-10 text-text-tertiary" /><h3 className="mt-4 font-display text-xl font-bold text-text-primary">No services found</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-text-secondary">Try a different keyword, category or location. New local providers are added as businesses join Kamba.</p>{hasActiveFilters && <Button variant="outline" className="mt-5" onClick={clearFilters}>Clear filters</Button>}</div>
          }

          {hasMore && <div className="mt-8 text-center"><Button variant="outline" size="lg" onClick={loadMore} disabled={loading}>Load more services</Button></div>}
          {!hasMore && services.length > 0 && <p className="mt-8 border-t border-border pt-5 text-center text-xs text-text-tertiary">You’re all caught up. That’s the current directory.</p>}
        </section>
      </div>
    </main>
  )
}
