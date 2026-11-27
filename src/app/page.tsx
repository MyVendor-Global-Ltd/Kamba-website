'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, MapPin, Package, Search, Store, Wrench } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { StoreShowcase } from '@/components/marketplace/store-showcase'

export default function Home() {
  const router = useRouter()
  const { state } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!state.isLoading && state.isAuthenticated) router.replace('/marketplace')
  }, [state.isLoading, state.isAuthenticated, router])

  if (state.isLoading || state.isAuthenticated) return null

  return (
    <div className="pb-16">
      <section className="flex min-h-[100svh] items-center border-b border-border bg-surface md:min-h-[100svh]">
        <div className="container grid w-full gap-10 py-14 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-20">
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
                if (query) router.push('/search?q=' + encodeURIComponent(query))
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
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Link href="/vendor/onboard" className="text-sm font-semibold text-primary hover:underline">Become a vendor</Link>
                <Link href="/sell-online-in-nigeria" className="text-xs text-text-secondary underline underline-offset-4 hover:text-primary">Selling on WhatsApp? Read this guide</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <StoreShowcase />
    </div>
  )
}
