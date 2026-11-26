'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { apiJson } from '@/lib/api'
import type { Product } from '@/types/commerce'
import { formatKobo } from '@/lib/formatting'

const rows = [
  { id: 'top', speed: 'store-showcase-track--fast', size: 'store-showcase-row--wide' },
  { id: 'middle', speed: 'store-showcase-track--medium', size: 'store-showcase-row--mid' },
  { id: 'bottom', speed: 'store-showcase-track--slow', size: 'store-showcase-row--deep' },
]

type ShowcaseProduct = Product & { images?: string[] }

function ProductShowcaseCard({ product, rowId }: { product: ShowcaseProduct; rowId: string }) {
  const image = product.images?.[0] || product.image_url

  return (
    <Link
      href={`/marketplace/products/${product.id}`}
      className={`store-showcase-card store-showcase-card--${rowId} store-showcase-card--product`}
      aria-label={`${product.name}, ${formatKobo(product.price)}`}
    >
      <div className="store-showcase-image">
        {image ? (
          <img src={image} alt={product.name} loading="lazy" />
        ) : (
          <div className="store-showcase-image-fallback" aria-hidden="true" />
        )}
      </div>
      <div className="store-showcase-meta">
        <span className="store-showcase-name">{product.name}</span>
        <span className="store-showcase-card-detail">{formatKobo(product.price)}</span>
      </div>
    </Link>
  )
}

export function ProductSearchShowcase() {
  const [products, setProducts] = useState<ShowcaseProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadProducts() {
      try {
        const response = await apiJson<{ products: ShowcaseProduct[] }>('/commerce/products', {
          params: { limit: 72, offset: 0, stock_status: 'in_stock' },
        })
        if (cancelled) return

        const seen = new Set<string>()
        const available = (response.products || [])
          .map((product) => ({ ...product, image_url: product.images?.[0] || product.image_url }))
          .filter((product) => {
            if (!product.id || !product.name || !product.image_url) return false
            if (product.is_active === false || product.is_available === false || product.stock_quantity <= 0) return false
            if (seen.has(product.id)) return false
            seen.add(product.id)
            return true
          })

        // Shuffle once when the section loads so each visit can surface a varied mix.
        for (let index = available.length - 1; index > 0; index -= 1) {
          const swapIndex = Math.floor(Math.random() * (index + 1))
          ;[available[index], available[swapIndex]] = [available[swapIndex], available[index]]
        }
        if (!cancelled) setProducts(available)
      } catch {
        if (!cancelled) setProducts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadProducts()
    return () => { cancelled = true }
  }, [])

  const lanes = useMemo(
    () => rows.map((_, rowIndex) => products.filter((__, index) => index % rows.length === rowIndex)),
    [products],
  )

  if (!loading && products.length === 0) return null

  return (
    <section className="store-showcase !min-h-0 !py-8" aria-labelledby="search-product-showcase-title">
      <div className="store-showcase-heading container">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Worth a look</p>
        <h2 id="search-product-showcase-title" className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-text-primary sm:text-3xl">
          Explore products
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">
          A few things available from businesses on Kamba.
        </p>
      </div>

      <div className="store-showcase-perspective" aria-label="Featured products">
        {rows.map((row, index) => {
          const lane = lanes[index]
          if (!lane.length) return null
          const sequence = lane.length > 1 ? lane : [...lane, ...lane, ...lane]
          return (
            <div className={`store-showcase-row ${row.size}`} key={row.id}>
              <div className={`store-showcase-track ${row.speed}`}>
                {sequence.map((product, itemIndex) => (
                  <ProductShowcaseCard key={`${product.id}-${itemIndex}`} product={product} rowId={row.id} />
                ))}
                {sequence.map((product, itemIndex) => (
                  <div key={`duplicate-${product.id}-${itemIndex}`} aria-hidden="true">
                    <ProductShowcaseCard product={product} rowId={row.id} />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {loading && (
          <div className="store-showcase-loading" role="status">Loading products…</div>
        )}
      </div>
      <div className="store-showcase-smoke" aria-hidden="true" />
    </section>
  )
}
