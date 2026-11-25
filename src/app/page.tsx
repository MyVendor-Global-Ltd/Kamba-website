'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, MapPin, Package, Search, Store, Wrench } from 'lucide-react'
import { apiJson } from '@/lib/api'
import type { Product } from '@/types/commerce'
import { formatKobo } from '@/lib/formatting'
import { useAuth } from '@/context/AuthContext'

export default function Home() {
  const router = useRouter()
  const { state } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!state.isLoading && state.isAuthenticated) router.replace('/marketplace')
  }, [state.isLoading, state.isAuthenticated, router])

  useEffect(() => {
    if (state.isLoading || state.isAuthenticated) return
    apiJson<{ products: Product[] }>('/commerce/products', { params: { offset: 0, limit: 4 } })
      .then((result) => setProducts((result.products || []).map((product) => ({ ...product, image_url: product.image_url || product.images?.[0] }))))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [state.isLoading, state.isAuthenticated])

  if (state.isLoading || state.isAuthenticated) return null

  return (
    <div className="pb-16">
      <section className="border-b border-border bg-surface">
        <div className="container grid gap-10 py-14 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-20">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">
              <MapPin className="h-3.5 w-3.5" /> Local finds. Real people. Your area.
            </div>
            <h1 className="max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
              Your neighbourhood has more to offer.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-text-secondary">
              Discover products, independent shops and useful services around you. Find the right people nearby, then buy or book with clarity.
            </p>
            <form
              role="search"
              aria-label="Search Kamba"
              className="mt-7 flex max-w-xl gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                const query = searchTerm.trim()
                if (query) router.push(`/search?q=${encodeURIComponent(query)}`)
              }}
            >
              <label className="sr-only" htmlFor="home-search">Search products, stores and services</label>
              <input
                id="home-search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search products, stores and services"
                className="h-12 min-w-0 flex-1 rounded-lg border border-border bg-surface px-4 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              <button type="submit" aria-label="Search" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary-hover">
                <Search className="h-5 w-5" />
              </button>
            </form>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/marketplace/products" className="inline-flex h-11 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover">Explore products <ArrowRight className="ml-2 h-4 w-4" /></Link>
              <Link href="/marketplace/services" className="inline-flex h-11 items-center rounded-lg border border-border bg-surface px-5 text-sm font-semibold text-text-primary transition-colors hover:bg-muted">Find a service</Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary">
              <span className="inline-flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Products from local stores</span>
              <span className="inline-flex items-center gap-2"><Wrench className="h-4 w-4 text-primary" /> Services and bookings</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/marketplace/stores" className="group flex min-h-52 flex-col justify-between rounded-2xl bg-primary p-5 text-white transition-transform hover:-translate-y-1">
              <Store className="h-7 w-7" />
              <div><p className="text-xs font-medium text-white/70">DISCOVER LOCAL</p><h2 className="mt-2 text-2xl font-semibold text-white">Shops around you</h2><span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold">Browse stores <ArrowRight className="h-4 w-4" /></span></div>
            </Link>
            <Link href="/marketplace/services" className="mt-8 flex min-h-52 flex-col justify-between rounded-2xl bg-gold-soft p-5 text-text-primary transition-transform hover:-translate-y-1">
              <Wrench className="h-7 w-7 text-primary" />
              <div><p className="text-xs font-semibold text-text-secondary">GET THINGS DONE</p><h2 className="mt-2 text-2xl font-semibold">People who can help</h2><span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">Explore services <ArrowRight className="h-4 w-4" /></span></div>
            </Link>
            <div className="col-span-2 flex items-center justify-between rounded-2xl border border-border bg-background px-5 py-4">
              <div><p className="text-sm font-semibold text-text-primary">Have something to sell or offer?</p><p className="text-xs text-text-secondary">Bring your shop or service to Kamba.</p></div>
              <Link href="/vendor/onboard" className="shrink-0 text-sm font-semibold text-primary hover:underline">Become a vendor</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container pt-12 md:pt-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">A place to start</p><h2 className="mt-2 text-2xl font-semibold text-text-primary md:text-3xl">Find something useful</h2><p className="mt-2 text-sm text-text-secondary">A small selection from the marketplace.</p></div>
          <Link href="/marketplace/products" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">See all products <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {loading ? <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{[1,2,3,4].map(n => <div key={n} className="h-64 animate-pulse rounded-xl bg-muted" />)}</div> : products.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {products.map(product => <Link key={product.id} href={`/marketplace/products/${product.id}`} className="group min-w-0">
              <div className="aspect-square overflow-hidden rounded-xl bg-muted">
                {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center text-text-tertiary"><Package className="h-8 w-8" /></div>}
              </div>
              <p className="mt-3 line-clamp-1 text-sm font-semibold text-text-primary group-hover:text-primary">{product.name}</p>
              <p className="mt-1 text-sm font-semibold text-primary">{formatKobo(product.price)}</p>
              <p className="mt-1 text-xs text-text-secondary">{product.store_name || 'Local vendor'}</p>
            </Link>)}
          </div>
        ) : <div className="rounded-xl border border-dashed border-border p-8 text-center"><p className="font-medium text-text-primary">Products will appear here</p><p className="mt-1 text-sm text-text-secondary">Explore stores and services while the catalogue loads.</p><Link href="/marketplace/stores" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">Browse stores</Link></div>}
      </section>
    </div>
  )
}
