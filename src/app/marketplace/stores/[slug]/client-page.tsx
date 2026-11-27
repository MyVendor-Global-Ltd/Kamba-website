'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowDown, ArrowLeft, ArrowUpRight, MapPin, Package, ShieldCheck, ShoppingBag } from 'lucide-react'
import type { Store, Product } from '@/types'
import { apiJson } from '@/lib/api'
import { formatKobo } from '@/lib/formatting'

type PublicStore = Store & {
  store_name?: string
  store_image_url?: string | null
  store_logo_url?: string | null
  store_slideshow_images?: string[] | null
  store_logo_in_slideshow?: boolean
  location_photos?: string[] | null
  location_text?: string | null
  contact_phone?: string | null
  contact_phone_verified_method?: 'sms' | null
  follower_count?: number
  users?: { username?: string; profile_picture_url?: string | null } | null
  business_profiles?: { business_name?: string; tagline?: string | null; location_mode?: string; location_visibility?: 'private' | 'public'; location_text?: string | null; service_area_text?: string | null; operating_hours?: Record<string, { closed: boolean; open?: string | null; close?: string | null }> | null } | null
  vendor_profiles?: { is_verified?: boolean; verification_tier?: string } | null
}

function StoreProduct({ product, index }: { product: Product; index: number }) {
  const image = product.images?.[0] || product.image_url
  return (
    <article className="group min-w-0">
      <Link href={'/marketplace/products/' + product.id} className="block min-w-0">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-muted">
          {image ? <img src={image} alt={product.name} loading={index < 3 ? 'eager' : 'lazy'} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]" /> : <div className="grid h-full w-full place-items-center bg-primary-soft text-primary"><Package className="h-9 w-9 opacity-70" /></div>}
          <span className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-sm bg-background/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary-strong">{product.category || 'From the collection'}</span>
          <span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-background text-primary opacity-0 shadow-md transition-all group-hover:opacity-100"><ArrowUpRight className="h-4 w-4" /></span>
        </div>
        <div className="flex min-w-0 items-start justify-between gap-3 py-3 sm:py-4">
          <div className="min-w-0 flex-1">
            <h3 className="break-words text-sm font-semibold tracking-tight text-text-primary sm:text-base">{product.name}</h3>
            {product.description && <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-text-secondary">{product.description}</p>}
          </div>
          <p className="shrink-0 whitespace-nowrap text-sm font-bold tabular-nums text-primary-strong">{formatKobo(product.price)}</p>
        </div>
      </Link>
    </article>
  )
}

const CATEGORY_COVER_IMAGES: Record<string, string[]> = {
  "Electronics & Gadgets": ['https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1800&auto=format&fit=crop&q=85', 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1800&auto=format&fit=crop&q=85'],
  "Fashion & Clothing": ['https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1800&auto=format&fit=crop&q=85', 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1800&auto=format&fit=crop&q=85'],
  "Beauty & Personal Care": ['https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=1800&auto=format&fit=crop&q=85', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1800&auto=format&fit=crop&q=85'],
  "Home & Living": ['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1800&auto=format&fit=crop&q=85', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1800&auto=format&fit=crop&q=85'],
  "Food & Groceries": ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=1800&auto=format&fit=crop&q=85', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1800&auto=format&fit=crop&q=85'],
  "Health & Wellness": ['https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1800&auto=format&fit=crop&q=85', 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1800&auto=format&fit=crop&q=85'],
  "Automotive": ['https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1800&auto=format&fit=crop&q=85', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1800&auto=format&fit=crop&q=85'],
  "Sports & Fitness": ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1800&auto=format&fit=crop&q=85', 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1800&auto=format&fit=crop&q=85'],
  "Books & Stationery": ['https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1800&auto=format&fit=crop&q=85', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1800&auto=format&fit=crop&q=85'],
  "Home Services": ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1800&auto=format&fit=crop&q=85', 'https://images.unsplash.com/photo-1523413651479-597eb2da0ad6?w=1800&auto=format&fit=crop&q=85'],
  "Repairs & Maintenance": ['https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=1800&auto=format&fit=crop&q=85', 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1800&auto=format&fit=crop&q=85'],
  "Professional Services": ['https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1800&auto=format&fit=crop&q=85', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1800&auto=format&fit=crop&q=85'],
  "Education & Tutoring": ['https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1800&auto=format&fit=crop&q=85', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1800&auto=format&fit=crop&q=85'],
  "Events & Photography": ['https://images.unsplash.com/photo-1492684223066-81342ee0f30?w=1800&auto=format&fit=crop&q=85', 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1800&auto=format&fit=crop&q=85']
}
const DEFAULT_COVER_IMAGES = ['https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1800&auto=format&fit=crop&q=85', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1800&auto=format&fit=crop&q=85']

export default function StoreDetailPage({ initialStore, initialProducts }: { initialStore?: PublicStore | null; initialProducts?: Product[] }) {
  const params = useParams()
  const slug = params.slug as string
  const [store, setStore] = useState<PublicStore | null>(initialStore ?? null)
  const [products, setProducts] = useState<Product[]>(initialProducts ?? [])
  const [loading, setLoading] = useState(!initialStore)
  const [error, setError] = useState('')
  const [productsError, setProductsError] = useState('')
  const [highlightedProductId, setHighlightedProductId] = useState('')
  const [failedCoverUrl, setFailedCoverUrl] = useState('')
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [activeLocationPhotoIndex, setActiveLocationPhotoIndex] = useState(0)

  useEffect(() => {
    let cancelled = false
    if (initialStore?.slug === slug) {
      setStore(initialStore)
      setProducts(initialProducts ?? [])
      setError('')
      setProductsError('')
      setHighlightedProductId(new URLSearchParams(window.location.search).get('product') || '')
      setLoading(false)
      return () => { cancelled = true }
    }
    async function loadStorefront() {
      setLoading(true)
      setError('')
      setProductsError('')
      setHighlightedProductId(new URLSearchParams(window.location.search).get('product') || '')
      try {
        const storeRes = await apiJson<{ store: PublicStore | null; unavailable?: boolean; banned?: boolean; message?: string }>('/vendors/stores/' + encodeURIComponent(slug))
        if (cancelled) return
        if (!storeRes.store) {
          setStore(null)
          setError(storeRes.message || (storeRes.unavailable || storeRes.banned ? 'This store is currently unavailable.' : 'We could not find this storefront. Check the address and try again.'))
          return
        }
        setStore(storeRes.store)
        try {
          const productsRes = await apiJson<{ products: Product[] }>('/commerce/products', { params: { store: slug, limit: 100, stock_status: 'all' } })
          if (!cancelled) setProducts((productsRes.products || []).map((product) => ({ ...product, image_url: product.image_url || product.images?.[0], compare_at_price: product.compare_at_price ?? product.original_price })))
        } catch {
          if (!cancelled) setProductsError('The storefront is live, but the collection could not be loaded. Please refresh to try again.')
        }
      } catch (err) {
        if (!cancelled) {
          setStore(null)
          setError(err instanceof Error ? err.message : 'We could not load this storefront.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void Promise.resolve().then(loadStorefront)
    return () => { cancelled = true }
  }, [slug, initialStore])

  useEffect(() => {
    if (!store) return
    const configuredImages = [store.store_image_url, ...(store.store_slideshow_images || [])].filter((image): image is string => !!image)
    const defaultImages = CATEGORY_COVER_IMAGES[store.category || ''] || DEFAULT_COVER_IMAGES
    const images = configuredImages.length ? configuredImages : defaultImages
    const slides = [...images, ...(store.store_logo_in_slideshow && store.store_logo_url ? [store.store_logo_url] : [])]
    if (slides.length < 2) return
    const logoIndex = images.length
    const duration = store.store_logo_in_slideshow && activeSlideIndex % slides.length === logoIndex ? 10000 : 3000
    const timeout = window.setTimeout(() => setActiveSlideIndex((index) => (index + 1) % slides.length), duration)
    return () => window.clearTimeout(timeout)
  }, [store, activeSlideIndex])

  useEffect(() => {
    const photos = store?.location_photos || []
    if (photos.length < 2) return
    const timer = window.setTimeout(() => setActiveLocationPhotoIndex((index) => (index + 1) % photos.length), 4500)
    return () => window.clearTimeout(timer)
  }, [store?.location_photos, activeLocationPhotoIndex])

  useEffect(() => {
    if (loading || !highlightedProductId) return
    document.getElementById('store-product-' + highlightedProductId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [loading, highlightedProductId, products])

  if (loading) return (
    <main className="min-h-screen w-full overflow-x-clip bg-background px-4 py-8 sm:px-8">
      <div className="mx-auto w-full max-w-7xl"><div className="h-[48vh] min-h-[320px] animate-pulse rounded-sm bg-muted" /><div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="aspect-[4/5] animate-pulse rounded-sm bg-muted" />)}</div></div>
    </main>
  )

  if (!store) return (
    <main className="flex min-h-[70vh] w-full items-center justify-center overflow-x-clip bg-background px-6 py-16 text-text-primary">
      <div className="max-w-md text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Kamba storefront</p>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight">This page is out of view.</h1>
        <p className="mt-4 text-sm leading-6 text-text-secondary">{error || 'This storefront is not available right now.'}</p>
        <Link href="/marketplace/stores" className="mt-8 inline-flex items-center gap-2 border-b border-primary pb-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">Browse stores <ArrowUpRight className="h-4 w-4" /></Link>
      </div>
    </main>
  )

  const name = store.store_name || store.name || 'Independent store'
  const categoryImages = CATEGORY_COVER_IMAGES[store.category || ''] || DEFAULT_COVER_IMAGES
  const configuredImages = [store.store_image_url, ...(store.store_slideshow_images || [])].filter((image): image is string => !!image)
  const slideshow = [...(configuredImages.length ? configuredImages : categoryImages)]
  const logoSlideIndex = slideshow.length
  if (store.store_logo_in_slideshow && store.store_logo_url) slideshow.push(store.store_logo_url)
  const activeSlide = slideshow[activeSlideIndex % slideshow.length] || DEFAULT_COVER_IMAGES[0]
  const activeSlideIsLogo = !!store.store_logo_in_slideshow && !!store.store_logo_url && activeSlideIndex % slideshow.length === logoSlideIndex
  const location = store.location_text || store.business_profiles?.location_text || store.business_profiles?.service_area_text || store.city
  const username = store.users?.username ? '@' + store.users.username.replace(/^@/, '') : null
  const isVerified = store.vendor_profiles?.is_verified === true

  return (
    <main className="min-h-screen w-full min-w-0 overflow-x-clip bg-background text-text-primary">
      <section className="w-full border-b border-border bg-background text-text-primary">
        <div className="mx-auto grid w-full max-w-[1440px] min-w-0 grid-cols-1 lg:min-h-[650px] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)]">
          <div className="flex min-w-0 flex-col px-5 pb-10 pt-6 sm:px-8 sm:pb-14 sm:pt-8 lg:px-12 lg:py-10 xl:px-16">
            <div className="flex min-w-0 items-center justify-between gap-4">
              <Link href="/marketplace/stores" className="inline-flex min-w-0 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-text-secondary hover:text-text-primary"><ArrowLeft className="h-4 w-4 shrink-0" /><span>All stores</span></Link>
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">Kamba / Store</span>
            </div>
            <div className="mt-16 min-w-0 sm:mt-24 lg:my-auto lg:py-16">
              <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-bold uppercase tracking-[0.17em] text-text-secondary">
                <span>{store.category || 'Independent label'}</span>
                <span className="h-px w-7 bg-gold" />
                <span>Made close to home</span>
                {isVerified && <span className="inline-flex items-center gap-1 text-gold"><ShieldCheck className="h-3.5 w-3.5" />Verified seller</span>}
              </div>
              {store.store_logo_url && <div className="mb-6 flex items-center gap-3"><img src={store.store_logo_url} alt={name + ' logo'} className="h-12 w-12 rounded-full border border-border bg-white object-contain p-1.5" /><span className="text-[10px] font-bold uppercase tracking-[0.16em] text-text-secondary">Official storefront</span></div>}
              <h1 className="max-w-full break-words [overflow-wrap:anywhere] font-display text-[clamp(2.7rem,8vw,6.8rem)] font-semibold leading-[0.94] tracking-[-0.065em] text-text-primary">{name}</h1>
              {store.business_profiles?.tagline && <p className="mt-5 max-w-xl break-words text-sm font-semibold leading-6 text-primary sm:text-base">{store.business_profiles.tagline}</p>}
              {store.description && <p className="mt-3 max-w-xl break-words text-sm leading-7 text-text-secondary sm:text-base">{store.description}</p>}
              <div className="mt-6 flex min-w-0 flex-wrap items-center gap-x-5 gap-y-3 text-xs text-text-secondary">
                {location && <span className="inline-flex min-w-0 items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0 text-gold" /><span className="break-words">{location}</span></span>}
                {username && <span>{username}</span>}
                {typeof store.follower_count === 'number' && <span>{store.follower_count.toLocaleString()} followers</span>}
              </div>
              <a href="#collection" className="mt-8 inline-flex min-h-12 max-w-full items-center justify-center gap-4 border border-gold/70 px-5 py-3 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-text-primary hover:bg-gold hover:text-primary-strong">Explore the collection <ArrowDown className="h-4 w-4 shrink-0" /></a>
            </div>
            <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted lg:mt-0"><span>Independent business</span><span>Discover local, shop Kamba</span></div>
          </div>
          <div className="relative min-h-[360px] min-w-0 overflow-hidden bg-primary sm:min-h-[480px] lg:min-h-full">
            {activeSlide && failedCoverUrl !== activeSlide ? (activeSlideIsLogo
              ? <div className="absolute inset-0 grid place-items-center bg-white/95 p-12"><img src={activeSlide} alt={name + ' logo'} onError={() => setFailedCoverUrl(activeSlide)} className="max-h-full max-w-full object-contain" /></div>
              : <img src={activeSlide} alt={name + ' storefront'} onError={() => setFailedCoverUrl(activeSlide)} className="absolute inset-0 h-full w-full object-cover" />)
              : <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_25%,var(--gold)_0%,var(--primary)_42%,var(--primary-strong)_100%)]" />}
            <div className="absolute inset-0 bg-gradient-to-t from-primary-strong/55 via-transparent to-primary-strong/10" />
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4 sm:bottom-8 sm:left-8 sm:right-8">
              <div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70">The Kamba directory</p><p className="mt-1 break-words font-display text-xl font-semibold text-white sm:text-2xl">{name}</p></div>
              <span className="shrink-0 rounded-full border border-white/50 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white">Local finds</span>
            </div>
          </div>
        </div>
      </section>

      <section id="collection" className="mx-auto w-full max-w-[1440px] min-w-0 px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20 xl:px-16">
        <div className="mb-8 flex min-w-0 flex-col justify-between gap-5 border-b border-border pb-6 sm:mb-10 sm:flex-row sm:items-end">
          <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">A collection from {name}</p><h2 className="mt-3 break-words font-display text-[clamp(2.1rem,5.5vw,4.6rem)] font-semibold leading-none tracking-[-0.055em]">The collection<span className="text-gold">.</span></h2></div>
          <div className="inline-flex shrink-0 items-center gap-2 text-xs font-medium text-text-secondary"><ShoppingBag className="h-4 w-4 text-primary" />{products.length} {products.length === 1 ? 'piece' : 'pieces'} listed</div>
        </div>
        {productsError && <p role="status" className="mb-6 rounded-sm border border-border bg-surface px-4 py-3 text-sm text-text-secondary">{productsError}</p>}
        {products.length > 0 ? <div className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-7">
          {products.map((product, index) => <div id={'store-product-' + product.id} key={product.id} className={'min-w-0 ' + (highlightedProductId === product.id ? 'rounded-sm outline outline-2 outline-gold outline-offset-4' : '')}><StoreProduct product={product} index={index} /></div>)}
        </div> : <div className="grid min-h-[280px] place-items-center border-y border-border px-5 py-14 text-center"><div className="max-w-md"><Package className="mx-auto h-8 w-8 text-gold" /><h3 className="mt-5 font-display text-2xl font-semibold sm:text-3xl">A collection in the making.</h3><p className="mt-3 text-sm leading-6 text-text-secondary">This store is open, but its products are not listed yet. Check back soon.</p></div></div>}
      </section>

      {(() => {
        const business = store.business_profiles
        const publicLocation = business?.location_visibility === 'public'
          ? (business.location_text || store.location_text || null)
          : null
        const serviceArea = business?.service_area_text || null
        const hours = business?.operating_hours || null
        const hasHours = !!hours && Object.values(hours).some((entry) => entry && (entry.closed || entry.open || entry.close))
        const photos = store.location_photos || []
        const locationImage = photos[activeLocationPhotoIndex % Math.max(photos.length, 1)] || store.store_image_url || store.store_slideshow_images?.[0] || DEFAULT_COVER_IMAGES[0]
        const displayLocation = publicLocation || serviceArea
        const mapQuery = displayLocation ? encodeURIComponent(displayLocation) : ''
        const formatTime = (value?: string | null) => {
          if (!value) return ''
          const [hour, minute] = value.split(':').map(Number)
          const suffix = hour >= 12 ? 'PM' : 'AM'
          return `${hour % 12 || 12}:${String(minute || 0).padStart(2, '0')} ${suffix}`
        }
        const dayLabels = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        const hasBusinessDetails = !!displayLocation || hasHours
        if (!hasBusinessDetails) return null
        return (
          <section aria-labelledby="store-location-heading" className="mx-auto w-full max-w-[1440px] px-5 pb-14 pt-4 sm:px-8 sm:pb-20 lg:px-12 xl:px-16">
            <div className="grid overflow-hidden border-y border-border lg:grid-cols-2">
              <div className="relative min-h-[360px] overflow-hidden bg-[#eeeee8] sm:min-h-[440px] lg:min-h-[540px]">
                <img src={locationImage} alt={name + ' business location'} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(250,250,246,0.96)_0%,rgba(250,250,246,0.78)_42%,rgba(250,250,246,0.12)_100%)]" />
                <div className="relative flex min-h-[360px] max-w-xl flex-col justify-end p-7 sm:min-h-[440px] sm:p-10 lg:min-h-[540px] lg:p-12">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Find the business</p>
                  <h2 id="store-location-heading" className="mt-4 max-w-lg font-display text-[clamp(2.3rem,5vw,4.6rem)] font-semibold leading-[0.96] tracking-[-0.055em] text-primary-strong">A little closer than you think.</h2>
                  <p className="mt-4 max-w-md text-sm leading-7 text-[#4f5c52]">Get to know where {name} operates, when the business is available, and how to find the right place to connect.</p>
                  {displayLocation && <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noreferrer" className="mt-7 inline-flex min-h-12 w-fit items-center gap-3 border border-primary/70 bg-white/65 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-primary-strong backdrop-blur-sm transition hover:bg-primary hover:text-white">{business?.location_mode === 'service_area' || business?.location_mode === 'mobile' ? 'Explore service area' : 'Get directions'} <ArrowUpRight className="h-4 w-4" /></a>}
                </div>
                {photos.length > 1 && <div className="absolute bottom-5 right-5 flex items-center gap-2 sm:bottom-7 sm:right-7">{photos.map((photo, index) => <button key={photo + index} type="button" aria-label={`Show location photo ${index + 1}`} aria-current={activeLocationPhotoIndex === index ? 'true' : undefined} onClick={() => setActiveLocationPhotoIndex(index)} className={`h-1.5 rounded-full transition-all ${activeLocationPhotoIndex === index ? 'w-8 bg-primary' : 'w-3 bg-primary/35 hover:bg-primary/70'}`} />)}</div>}
              </div>
              <div className="flex min-w-0 flex-col justify-center bg-background px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Location & opening hours</p>
                <h3 className="mt-4 font-display text-[clamp(1.8rem,3.4vw,3rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-text-primary">Plan your visit.</h3>
                {publicLocation && <div className="mt-8 border-t border-border pt-5"><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted">Business location</p><div className="mt-3 flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" /><p className="text-sm leading-6 text-text-primary">{publicLocation}</p></div></div>}
                {serviceArea && !publicLocation && <div className="mt-8 border-t border-border pt-5"><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted">Service coverage</p><div className="mt-3 flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" /><p className="text-sm leading-6 text-text-primary">{serviceArea}</p></div></div>}
                {store.contact_phone && store.contact_phone_verified_method === 'sms' && <div className="mt-8 border-t border-border pt-5"><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted">Business contact · SMS verified</p><p className="mt-3 text-sm font-semibold text-text-primary">{store.contact_phone}</p><div className="mt-3 flex flex-wrap gap-2"><a href={`tel:${store.contact_phone}`} className="inline-flex min-h-10 items-center border border-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-primary hover:bg-primary hover:text-white">Call</a><a href={`sms:${store.contact_phone}`} className="inline-flex min-h-10 items-center border border-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-primary hover:bg-primary hover:text-white">SMS</a></div></div>}
                {hasHours && <div className="mt-8 border-t border-border pt-5"><p className="text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted">Opening hours</p><dl className="mt-4 space-y-3">{dayLabels.filter((day) => hours?.[day]).map((day) => { const entry = hours?.[day]; return <div key={day} className="flex items-center justify-between gap-4 text-sm"><dt className="capitalize text-text-secondary">{day}</dt><dd className="text-right font-medium tabular-nums text-text-primary">{entry?.closed ? 'Closed' : entry?.open && entry?.close ? `${formatTime(entry.open)} – ${formatTime(entry.close)}` : 'Hours not set'}</dd></div> })}</dl></div>}
                {!publicLocation && serviceArea && <p className="mt-6 text-xs leading-5 text-text-tertiary">This business serves the areas listed above. Exact residential addresses are not displayed publicly.</p>}
              </div>
            </div>
          </section>
        )
      })()}
      <section className="w-full border-t border-border bg-background px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        <div className="mx-auto flex w-full max-w-[1440px] min-w-0 flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="min-w-0 max-w-2xl"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Independent. Local. Yours to discover.</p><h2 className="mt-4 break-words font-display text-[clamp(2rem,5vw,4rem)] font-semibold leading-[1.02] tracking-[-0.05em] text-primary-strong">Find your next favourite, closer to home.</h2></div>
          <Link href="/marketplace/stores" className="inline-flex shrink-0 items-center gap-3 border-b border-primary pb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Discover more stores <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </main>
  )
}
