'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BriefcaseBusiness, Package, Store as StoreIcon } from 'lucide-react'
import { apiJson } from '@/lib/api'
import type { Product } from '@/types/commerce'
import { formatKobo } from '@/lib/formatting'

type PublicStore = {
  id: string
  store_name: string
  slug: string
  category?: string
  location_text?: string
  store_image_url?: string | null
  users?: { username?: string; profile_picture_url?: string | null }
}
type PublicService = {
  id: string
  service_title: string
  slug: string
  category?: string
  price_range?: string
  service_images?: string[] | null
  location_text?: string
  business_profiles?: { business_name?: string; location_text?: string; service_area_text?: string }
  users?: { username?: string; profile_picture_url?: string | null }
}
type PublicCategory = { category: string; product_count: number }
type ShowcaseProduct = Product & { images?: string[] }

type ShowcaseCard =
  | { id: string; type: 'store'; title: string; href: string; image?: string; detail?: string }
  | { id: string; type: 'category'; title: string; href: string; images: string[]; count: number }
  | { id: string; type: 'product'; title: string; href: string; image?: string; price: number }
  | { id: string; type: 'service'; title: string; href: string; image?: string; detail?: string }

const rows = [
  { id: 'top', speed: 'store-showcase-track--fast', size: 'store-showcase-row--wide' },
  { id: 'middle', speed: 'store-showcase-track--medium', size: 'store-showcase-row--mid' },
  { id: 'bottom', speed: 'store-showcase-track--slow', size: 'store-showcase-row--deep' },
]

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function ShowcaseCardView({ item, rowId, interactive }: { item: ShowcaseCard; rowId: string; interactive: boolean }) {
  const image = 'image' in item ? item.image : undefined
  return (
    <Link
      href={item.href}
      className={'store-showcase-card store-showcase-card--' + rowId + ' store-showcase-card--' + item.type}
      aria-label={item.type === 'product' ? item.title + ', ' + formatKobo(item.price) : item.title}
      tabIndex={interactive ? 0 : -1}
    >
      <div className="store-showcase-image">
        {item.type === 'category' && item.images.length > 0 ? (
          <div className="store-showcase-category-images" aria-hidden="true">
            {item.images.slice(0, 3).map((src, index) => (
              <img key={src + index} src={src} alt="" loading="lazy" />
            ))}
          </div>
        ) : image ? (
          <img src={image} alt="" loading="lazy" />
        ) : (
          <div className="store-showcase-image-fallback">
            {item.type === 'store' ? <StoreIcon /> : item.type === 'service' ? <BriefcaseBusiness /> : <Package />}
          </div>
        )}
        <span className="store-showcase-type">{item.type}</span>
      </div>
      <div className="store-showcase-meta">
        <span className="store-showcase-name">{item.title}</span>
        {item.type === 'product' ? (
          <span className="store-showcase-card-detail">{formatKobo(item.price)}</span>
        ) : item.type === 'category' ? (
          <span className="store-showcase-card-detail">{item.count} {item.count === 1 ? 'product' : 'products'}</span>
        ) : item.type === 'service' && item.detail ? (
          <span className="store-showcase-card-detail">{item.detail}</span>
        ) : item.type === 'store' && item.detail ? (
          <span className="store-showcase-card-detail">{item.detail}</span>
        ) : null}
      </div>
    </Link>
  )
}

function ShowcaseSequence({ items, rowId, copy }: { items: ShowcaseCard[]; rowId: string; copy: string }) {
  return (
    <div className="store-showcase-sequence" aria-hidden={copy === 'second'}>
      {items.map((item, index) => <ShowcaseCardView key={copy + '-' + index + '-' + item.type + '-' + item.id} item={item} rowId={rowId} interactive={copy === 'first'} />)}
    </div>
  )
}

export function StoreShowcase() {
  const [cards, setCards] = useState<ShowcaseCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadShowcase() {
      const [storesResult, servicesResult, productsResult, categoriesResult] = await Promise.allSettled([
        apiJson<{ stores: PublicStore[] }>('/vendors/stores', { params: { page: 1, limit: 60 } }),
        apiJson<{ services: PublicService[] }>('/vendors/services', { params: { page: 1, limit: 60 } }),
        apiJson<{ products: ShowcaseProduct[] }>('/commerce/products', { params: { limit: 100, offset: 0, stock_status: 'in_stock' } }),
        apiJson<{ categories: PublicCategory[] }>('/marketplace/categories'),
      ])

      if (cancelled) return

      const stores = storesResult.status === 'fulfilled' ? (storesResult.value.stores || []) : []
      const services = servicesResult.status === 'fulfilled' ? (servicesResult.value.services || []) : []
      const products = productsResult.status === 'fulfilled' ? (productsResult.value.products || []) : []
      const categories = categoriesResult.status === 'fulfilled' ? (categoriesResult.value.categories || []) : []

      const normalizedProducts = products
        .filter((product) => product.is_available !== false && product.stock_quantity > 0)
        .map((product) => ({ ...product, image_url: product.images?.[0] || product.image_url }))
      const nextCards: ShowcaseCard[] = []

      stores
        .filter((store) => Boolean(store.slug))
        .forEach((store) => {
          nextCards.push({
            id: store.id,
            type: 'store',
            title: store.store_name || 'Local store',
            href: '/marketplace/stores/' + store.slug,
            image: store.store_image_url || undefined,
            detail: store.location_text || undefined,
          })
        })

      categories.forEach((entry) => {
        const name = entry.category || ''
        if (!name.trim()) return
        const matching = normalizedProducts.filter((product) => product.category?.toLowerCase() === name.toLowerCase())
        const seenStores = new Set<string>()
        const categoryImages = matching
          .filter((product) => {
            if (!product.image_url) return false
            const storeKey = product.store_id || product.id
            if (seenStores.has(storeKey)) return false
            seenStores.add(storeKey)
            return true
          })
          .slice(0, 3)
          .map((product) => product.image_url as string)
        const count = Number(entry.product_count ?? matching.length)
        nextCards.push({
          id: slugify(name),
          type: 'category',
          title: name,
          href: '/marketplace/category/' + slugify(name),
          images: categoryImages,
          count,
        })
      })

      normalizedProducts.forEach((product) => {
        if (!product.id) return
        nextCards.push({
          id: product.id,
          type: 'product',
          title: product.name,
          href: '/marketplace/products/' + product.id,
          image: product.image_url,
          price: product.price,
        })
      })

      services
        .filter((service) => Boolean(service.slug))
        .forEach((service) => {
          nextCards.push({
            id: service.id,
            type: 'service',
            title: service.service_title || 'Local service',
            href: '/marketplace/services/' + service.slug,
            image: service.service_images?.[0] || undefined,
            detail: service.location_text || service.business_profiles?.service_area_text || service.category || service.price_range || undefined,
          })
        })

      const seen = new Set<string>()
      const uniqueCards = nextCards.filter((card) => {
        const key = card.type + ':' + card.id
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      // Randomize the mixed source list once per load, before splitting it into lanes.
      for (let index = uniqueCards.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1))
        ;[uniqueCards[index], uniqueCards[swapIndex]] = [uniqueCards[swapIndex], uniqueCards[index]]
      }
      if (!cancelled) {
        setCards(uniqueCards)
        setLoading(false)
      }
    }

    void loadShowcase()
    return () => { cancelled = true }
  }, [])

  const lanes = useMemo(() => rows.map((_, rowIndex) => cards.filter((__, index) => index % rows.length === rowIndex)), [cards])

  return (
    <section className="store-showcase" aria-labelledby="store-showcase-title">
      <div className="store-showcase-heading container">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">A little closer to home</p>
        <h2 id="store-showcase-title" className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
          Good finds are closer than you think.
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-text-secondary sm:text-base">
          Discover local stores, find new favourites and shop what you need around your area.
        </p>
      </div>

      <div className="store-showcase-perspective" aria-label="Explore local stores, products, categories and services">
        {rows.map((row, index) => {
          const lane = lanes[index]
          if (!lane.length) return null
          const sequence = lane.length > 1 ? lane : [...lane, ...lane, ...lane]
          return (
            <div className={'store-showcase-row ' + row.size} key={row.id}>
              <div className={'store-showcase-track ' + row.speed}>
                <ShowcaseSequence items={sequence} rowId={row.id} copy="first" />
                <ShowcaseSequence items={sequence} rowId={row.id} copy="second" />
              </div>
            </div>
          )
        })}
        {loading && cards.length === 0 && (
          <div className="store-showcase-loading" role="status">Finding local stores, products and services…</div>
        )}
        {!loading && cards.length === 0 && (
          <div className="store-showcase-loading">New local listings will appear here as vendors join Kamba.</div>
        )}
      </div>

      <div className="store-showcase-smoke" aria-hidden="true" />
      <div className="store-showcase-cta container">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Your area. Your people.</p>
          <h3 className="mt-2 text-2xl font-semibold leading-tight text-text-primary sm:text-3xl">
            Find your people. Shop your area.
          </h3>
          <p className="mt-2 max-w-lg text-sm leading-6 text-text-secondary">
            From everyday essentials to the spots you have not discovered yet, there is plenty waiting nearby.
          </p>
        </div>
        <Link href="/marketplace/stores" className="mt-5 inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover sm:mt-0">
          Explore stores <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}
