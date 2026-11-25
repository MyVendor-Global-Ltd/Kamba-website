'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { apiJson } from '@/lib/api'
import type { Store, Product } from '@/types'
import { formatKobo } from '@/lib/formatting'
import { ProductCardSkeleton } from '@/components/ui/skeleton'

export default function StoreDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [highlightedProductId, setHighlightedProductId] = useState('')

  useEffect(() => {
    setHighlightedProductId(new URLSearchParams(window.location.search).get('product') || '')
    Promise.all([
      apiJson<{ store: Store & { store_name?: string; location_text?: string; vendor_profiles?: { is_verified?: boolean; verification_tier?: string } } }>(`/vendors/stores/${slug}`),
      apiJson<{ products: Product[] }>('/commerce/products', { params: { store: slug, limit: 100, stock_status: 'all' } }),
    ])
      .then(([storeRes, productsRes]) => {
        const rawStore = storeRes.store
        const tier = rawStore.vendor_profiles?.verification_tier
        const verificationStatus: Store['verification_status'] = rawStore.verification_status || (rawStore.vendor_profiles?.is_verified ? (tier === 'business' ? 'business' : tier === 'nin' ? 'nin' : 'basic') : 'pending')
        setStore({ ...rawStore, name: rawStore.name || rawStore.store_name || 'Local store', city: rawStore.city || rawStore.location_text, vendor_id: rawStore.vendor_id || '', is_active: rawStore.is_active ?? true, created_at: rawStore.created_at || '', updated_at: rawStore.updated_at || '', verification_status: verificationStatus })
        setProducts((productsRes.products || []).map((product) => ({ ...product, image_url: product.image_url || product.images?.[0], compare_at_price: product.compare_at_price ?? product.original_price })))
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load store')
        setLoading(false)
      })
  }, [slug])

  useEffect(() => {
    if (loading || !highlightedProductId) return
    document.getElementById(`store-product-${highlightedProductId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [loading, highlightedProductId, products])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8 animate-fade-in">
        <div className="space-y-4 animate-pulse">
          <div className="h-10 w-1/3 bg-ink-raised/50 rounded-lg" />
          <div className="h-6 w-1/2 bg-ink-raised/50 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="container mx-auto px-4 py-8 lg:py-12 flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-ink-raised/50 flex items-center justify-center mx-auto mb-4 text-text-tertiary">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Store not found</h2>
          <p className="text-text-tertiary">The store you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/marketplace/stores" className="mt-4 inline-block">
            <Button variant="outline">Browse all stores</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8">
      <header className="animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold font-display text-text-primary">{store.name}</h1>
            <p className="text-text-secondary mt-2">{store.description || 'No description available'}</p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {store.verification_status !== 'pending' && (
                <Badge variant="verification" size="md">
                  {store.verification_status === 'business' ? 'Business Verified' : 
                   store.verification_status === 'nin' ? 'NIN Verified' : 'Basic Verified'}
                </Badge>
              )}
              {(store.city || store.state) && (
                <Badge variant="outline" size="sm">
                  <svg className="w-3.5 h-3.5 mr-1.5 text-coral/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {[store.city, store.state].filter(Boolean).join(', ')}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-slide-up">
          {error}
        </div>
      )}

      <section className="animate-slide-up" style={{ animationDelay: '100ms' }}>
        <h2 className="text-2xl font-bold font-display text-text-primary mb-6">Products ({products.length})</h2>
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card id={`store-product-${product.id}`} key={product.id} variant="elevated" className={highlightedProductId === product.id ? 'group border-coral ring-2 ring-coral/30' : 'group'}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-text-primary group-hover:text-coral transition-colors line-clamp-1">{product.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pb-2">
                  {(product.images?.[0] || product.image_url) && (
                    <Link href={`/marketplace/products/${product.id}`} className="block overflow-hidden rounded-xl bg-ink-raised/30">
                      <img src={product.images?.[0] || product.image_url} alt={product.name} className="w-full aspect-square object-cover group-hover:scale-[1.02] transition-transform duration-300" loading="lazy" />
                    </Link>
                  )}
                  {highlightedProductId === product.id && (
                    <Badge variant="secondary" size="sm">The product you searched for</Badge>
                  )}
                  {product.description && (
                    <p className="text-sm text-text-tertiary line-clamp-2">{product.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-ink-raised/30">
                    <span className="text-lg font-bold text-text-primary">{formatKobo(product.price)}</span>
                    <Link href={`/marketplace/products/${product.id}`}>
                      <Button variant="ghost" size="sm" className="group-hover:text-coral transition-colors">
                        View
                        <svg className="ml-1.5 w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-ink-raised/50 flex items-center justify-center mx-auto mb-4 text-text-tertiary">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No products available</h3>
            <p className="text-text-tertiary">This store hasn&apos;t added any products yet.</p>
          </div>
        )}
      </section>
    </div>
  )
}
