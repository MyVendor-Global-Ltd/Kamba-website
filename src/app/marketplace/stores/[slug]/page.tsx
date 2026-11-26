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
  location_photos?: string[] | null
  location_text?: string | null
  follower_count?: number
  total_sales?: number
  users?: { username?: string; profile_picture_url?: string | null } | null
  business_profiles?: {
    business_name?: string
    location_mode?: string
    location_text?: string | null
    service_area_text?: string | null
  } | null
  vendor_profiles?: { is_verified?: boolean; verification_tier?: string } | null
}

function StoreProduct({ product, index }: { product: Product; index: number }) {
  const image = product.images?.[0] || product.image_url
  return (
    <article className={index === 0 ? 'group md:col-span-2 md:row-span-2' : 'group'}>
      <Link href={`/marketplace/products/${product.id}`} className="block">
        <div className={index === 0
          ? 'relative aspect-[4/5] overflow-hidden bg-[#e8e4da] md:aspect-[0.94]'
          : 'relative aspect-[4/5] overflow-hidden bg-[#e8e4da]'}>
          {image ? (
            <img src={image} alt={product.name} loading={index < 3 ? 'eager' : 'lazy'} className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e6e0d3] to-[#c9c0ae] text-[#756b5b]">
              <Package className="h-10 w-10 opacity-60" />
            </div>
          )}
          <span className="absolute left-4 top-4 bg-[#f7f4ed]/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#292a24]">
            {product.category || 'From the collection'}
          </span>
          <span className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-[#f7f4ed] text-[#20231e] opacity-0 transition-all duration-300 group-hover:opacity-100">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
        <div className="flex items-start justify-between gap-3 py-4">
          <div className="min-w-0">
            <h3 className="truncate font-medium tracking-tight text-[#222720]">{product.name}</h3>
            {product.description && <p className="mt-1 line-clamp-1 text-xs text-[#74776e]">{product.description}</p>}
          </div>
          <p className="shrink-0 text-sm font-semibold tabular-nums text-[#222720]">{formatKobo(product.price)}</p>
        </div>
      </Link>
    </article>
  )
}

export default function StoreDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const [store, setStore] = useState<PublicStore | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [productsError, setProductsError] = useState('')
  const [highlightedProductId, setHighlightedProductId] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setProductsError('')
    setHighlightedProductId(new URLSearchParams(window.location.search).get('product') || '')

    async function loadStorefront() {
      try {
        const storeRes = await apiJson<{
          store: PublicStore | null
          unavailable?: boolean
          banned?: boolean
          message?: string
        }>(`/vendors/stores/${encodeURIComponent(slug)}`)

        if (cancelled) return
        if (!storeRes.store) {
          setStore(null)
          setError(storeRes.message || (storeRes.unavailable || storeRes.banned
            ? 'This store is currently unavailable.'
            : 'We could not find this storefront. Check the address and try again.'))
          return
        }
        setStore(storeRes.store)

        try {
          const productsRes = await apiJson<{ products: Product[] }>('/commerce/products', {
            params: { store: slug, limit: 100, stock_status: 'all' },
          })
          if (!cancelled) {
            setProducts((productsRes.products || []).map((product) => ({
              ...product,
              image_url: product.image_url || product.images?.[0],
              compare_at_price: product.compare_at_price ?? product.original_price,
            })))
          }
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

    void loadStorefront()
    return () => { cancelled = true }
  }, [slug])

  useEffect(() => {
    if (loading || !highlightedProductId) return
    document.getElementById(`store-product-${highlightedProductId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [loading, highlightedProductId, products])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f4f1e9] px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="h-[58vh] min-h-[360px] animate-pulse bg-[#ded9cd]" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="aspect-[4/5] animate-pulse bg-[#e6e1d6]" />)}</div>
        </div>
      </main>
    )
  }

  if (!store) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#f4f1e9] px-6 py-16 text-[#20231e]">
        <div className="max-w-md text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#77786e]">Kamba storefront</p>
          <h1 className="mt-5 font-serif text-4xl font-normal tracking-tight" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)' }}>This page is out of view.</h1>
          <p className="mt-4 text-sm leading-6 text-[#6d7067]">{error || 'This storefront is not available right now.'}</p>
          <Link href="/marketplace/stores" className="mt-8 inline-flex items-center gap-2 border-b border-[#252a22] pb-2 text-xs font-semibold uppercase tracking-[0.16em]">Browse stores <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </main>
    )
  }

  const name = store.store_name || store.name || 'Independent store'
  const cover = store.store_image_url || store.location_photos?.[0] || products.find((product) => product.images?.[0] || product.image_url)?.images?.[0] || products.find((product) => product.image_url)?.image_url
  const location = store.location_text || store.business_profiles?.location_text || store.business_profiles?.service_area_text || store.city
  const username = store.users?.username ? '@' + store.users.username.replace(/^@/, '') : null
  const isVerified = store.vendor_profiles?.is_verified || store.verification_status !== 'pending'

  return (
    <main className="min-h-screen bg-[#f4f1e9] text-[#20231e]">
      <section className="relative isolate min-h-[680px] overflow-hidden bg-[#171a16] text-[#f6f2e9] sm:min-h-[760px]">
        {cover ? (
          <img src={cover} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_72%_24%,#77715e_0%,#353b31_35%,#171a16_78%)]" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/40 via-black/10 to-[#171a16]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />
        <div className="mx-auto flex min-h-[680px] max-w-[1600px] flex-col px-5 pb-10 pt-6 sm:min-h-[760px] sm:px-10 sm:pb-14 lg:px-16">
          <div className="flex items-center justify-between">
            <Link href="/marketplace/stores" className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 transition-colors hover:text-white"><ArrowLeft className="h-4 w-4" /> All stores</Link>
            <Link href="/search" className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 hover:text-white">Discover Kamba</Link>
          </div>
          <div className="mt-auto max-w-4xl pb-10 sm:pb-14">
            <div className="mb-5 flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/75">
              <span>{store.category || 'Independent label'}</span>
              <span className="h-px w-8 bg-white/50" />
              <span>On Kamba</span>
              {isVerified && <span className="inline-flex items-center gap-1 text-[#e8d6a9]"><ShieldCheck className="h-3.5 w-3.5" /> Verified seller</span>}
            </div>
            <h1 className="max-w-4xl font-serif font-normal leading-[0.92] tracking-[-0.045em] text-white" style={{ fontSize: 'clamp(3.4rem, 10vw, 8.5rem)' }}>{name}</h1>
            {store.description && <p className="mt-7 max-w-2xl text-sm leading-7 text-white/80 sm:text-base">{store.description}</p>}
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-white/75">
              {location && <span className="inline-flex items-center gap-2"><MapPin className="h-3.5 w-3.5" />{location}</span>}
              {username && <span>{username}</span>}
              {typeof store.follower_count === 'number' && <span>{store.follower_count.toLocaleString()} followers</span>}
            </div>
            <a href="#collection" className="mt-9 inline-flex h-12 items-center gap-4 border border-white/70 px-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-[#20231e]">
              Explore the collection <ArrowDown className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 hidden w-[28%] border-l border-t border-white/25 bg-[#f4f1e9]/95 px-7 py-6 text-[#20231e] backdrop-blur-md lg:block">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#77786e]">The Kamba edit</p>
          <p className="mt-2 font-serif text-2xl leading-tight">Good things, from close to home.</p>
        </div>
      </section>

      <section id="collection" className="mx-auto max-w-[1600px] px-5 py-16 sm:px-10 sm:py-24 lg:px-16">
        <div className="mb-10 flex flex-col justify-between gap-6 border-b border-[#d9d5ca] pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#858477]">Curated by {name}</p>
            <h2 className="mt-3 font-serif font-normal leading-none tracking-tight" style={{ fontSize: 'clamp(2.6rem, 6vw, 5.2rem)' }}>The collection<span className="text-[#a18a5b]">.</span></h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#77786e]"><ShoppingBag className="h-4 w-4" />{products.length} {products.length === 1 ? 'piece' : 'pieces'} available</div>
        </div>

        {productsError && <p role="status" className="mb-6 border border-[#d9d5ca] bg-white/60 px-4 py-3 text-sm text-[#6d7067]">{productsError}</p>}

        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-7 lg:gap-y-12">
            {products.map((product, index) => (
              <div id={`store-product-${product.id}`} key={product.id} className={highlightedProductId === product.id ? 'rounded-sm outline outline-2 outline-[#a18a5b] outline-offset-4' : ''}>
                <StoreProduct product={product} index={index} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid min-h-[320px] place-items-center border-y border-[#d9d5ca] py-16 text-center">
            <div className="max-w-md">
              <Package className="mx-auto h-8 w-8 text-[#a18a5b]" />
              <h3 className="mt-5 font-serif text-3xl font-normal">A collection in the making.</h3>
              <p className="mt-3 text-sm leading-6 text-[#77786e]">This store is open, but its products are not listed yet. Check back soon.</p>
            </div>
          </div>
        )}
      </section>

      <section className="bg-[#e8e3d7] px-5 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-[1600px] flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#858477]">Independent. Local. Yours to discover.</p>
            <h2 className="mt-4 font-serif font-normal leading-[1.02] tracking-tight" style={{ fontSize: 'clamp(2.4rem, 5vw, 4.6rem)' }}>Find your next favourite, closer to home.</h2>
          </div>
          <Link href="/marketplace/stores" className="inline-flex shrink-0 items-center gap-3 border-b border-[#252a22] pb-3 text-[10px] font-semibold uppercase tracking-[0.18em]">Discover more stores <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </main>
  )
}
