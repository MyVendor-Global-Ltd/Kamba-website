import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, BadgeCheck, MapPin, ShoppingBag, Wrench } from 'lucide-react'
import { getSeoBusiness } from '@/lib/seo-data'

type BusinessPageProps = { params: Promise<{ slug: string }> }

type BusinessData = {
  id: string
  name: string
  slug: string
  tagline?: string | null
  location?: { location_text?: string | null; service_area_text?: string | null } | null
  verification_tier?: string | null
  is_verified?: boolean
  follower_count?: number
  capabilities: { products: boolean; services: boolean }
  store?: {
    store_name: string
    slug: string
    category?: string
    description?: string | null
    store_image_url?: string | null
    store_logo_url?: string | null
    store_slideshow_images?: string[] | null
  } | null
  services?: {
    service_title: string
    slug: string
    category?: string
    description?: string | null
    service_images?: string[] | null
  } | null
}

async function loadBusiness(slug: string): Promise<BusinessData | null> {
  const business = await getSeoBusiness(slug)
  return business && typeof business === 'object' ? business as BusinessData : null
}

function businessUrl(slug: string) {
  return `https://www.kamba.ng/${encodeURIComponent(slug)}`
}

export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
  const { slug } = await params
  const business = await loadBusiness(slug)
  if (!business) return { title: 'Business unavailable', robots: { index: false, follow: true } }

  const description = (business.tagline || `Discover ${business.name} on Kamba. Explore its products and services.`).slice(0, 300)
  const image = business.store?.store_image_url || business.services?.service_images?.[0]
  const url = businessUrl(slug)

  return {
    title: `${business.name} | Kamba`,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'website', title: business.name, description, url, siteName: 'Kamba', locale: 'en_NG', images: image ? [image] : [] },
    twitter: { card: 'summary_large_image', title: business.name, description, images: image ? [image] : [] },
  }
}

export default async function PublicBusinessPage({ params }: BusinessPageProps) {
  const { slug } = await params
  const business = await loadBusiness(slug)
  if (!business) notFound()

  const location = business.location?.location_text || business.location?.service_area_text
  const cover = business.store?.store_image_url || business.store?.store_slideshow_images?.[0] || business.services?.service_images?.[0]
  const hasStore = business.capabilities?.products && Boolean(business.store?.slug)
  const hasServices = business.capabilities?.services && Boolean(business.services?.slug)

  return (
    <main className="pb-16">
      <section className="relative isolate min-h-[440px] overflow-hidden bg-[#f3f2ed]">
        {cover && <div aria-hidden="true" className="absolute inset-0 -z-20 bg-cover bg-center" style={{ backgroundImage: `url("${cover}")` }} />}
        {cover && <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-white via-white/90 to-white/35" />}
        {!cover && <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#e8eadc] via-[#f5f3ec] to-white" />}
        <div className="container flex min-h-[440px] items-end py-12 sm:py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Kamba business</p>
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-text-primary sm:text-6xl">{business.name}</h1>
            {business.tagline && <p className="mt-5 max-w-xl text-base leading-7 text-text-secondary sm:text-lg">{business.tagline}</p>}
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
              {business.is_verified && <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-primary" /> Verified business</span>}
              {location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{location}</span>}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {hasStore && <Link href={`/marketplace/stores/${encodeURIComponent(business.store!.slug)}`} className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"><ShoppingBag className="h-4 w-4" /> Explore store <ArrowRight className="h-4 w-4" /></Link>}
              {hasServices && <Link href={`/marketplace/services/${encodeURIComponent(business.services!.slug)}`} className="inline-flex h-12 items-center gap-2 rounded-lg border border-border bg-white/85 px-5 text-sm font-semibold text-text-primary transition-colors hover:bg-white"><Wrench className="h-4 w-4" /> Explore services <ArrowRight className="h-4 w-4" /></Link>}
            </div>
          </div>
        </div>
      </section>

      <section className="container -mt-6">
        <div className="grid gap-5 md:grid-cols-2">
          {hasStore && <Link href={`/marketplace/stores/${encodeURIComponent(business.store!.slug)}`} className="group overflow-hidden rounded-2xl border border-border bg-surface transition-shadow hover:shadow-lg">
            <div className="aspect-[16/8] overflow-hidden bg-surface-muted">
              {business.store?.store_image_url && <div className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.03]" style={{ backgroundImage: `url("${business.store.store_image_url}")` }} />}
            </div>
            <div className="flex items-center justify-between gap-4 p-5">
              <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Store</p><h2 className="mt-1 text-xl font-semibold text-text-primary">{business.store?.store_name || business.name}</h2><p className="mt-1 text-sm text-text-secondary">{business.store?.category || 'Products and shopping'}</p></div>
              <ArrowRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
            </div>
          </Link>}
          {hasServices && <Link href={`/marketplace/services/${encodeURIComponent(business.services!.slug)}`} className="group overflow-hidden rounded-2xl border border-border bg-surface transition-shadow hover:shadow-lg">
            <div className="aspect-[16/8] overflow-hidden bg-surface-muted">
              {business.services?.service_images?.[0] && <div className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.03]" style={{ backgroundImage: `url("${business.services.service_images[0]}")` }} />}
            </div>
            <div className="flex items-center justify-between gap-4 p-5">
              <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Services</p><h2 className="mt-1 text-xl font-semibold text-text-primary">{business.services?.service_title || business.name}</h2><p className="mt-1 text-sm text-text-secondary">{business.services?.category || 'Services and bookings'}</p></div>
              <ArrowRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
            </div>
          </Link>}
        </div>
      </section>
    </main>
  )
}
