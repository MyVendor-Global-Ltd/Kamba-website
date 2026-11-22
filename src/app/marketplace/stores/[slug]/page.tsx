'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { apiJson } from '@/lib/api'
import { Store, Product } from '@/types'
import { formatKobo } from '@/lib/formatting'
import { ProductCardSkeleton } from '@/components/ui/skeleton'

export default function StoreDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const [store, setStore] = useState<Store | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      apiJson<{ store: Store }>(`/vendors/stores/${slug}`),
      apiJson<{ products: Product[] }>(`/commerce/stores/${slug}/products`),
    ])
      .then(([storeRes, productsRes]) => {
        setStore(storeRes.store)
        setProducts(productsRes.products || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load store')
        setLoading(false)
      })
  }, [slug])

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
          <p className="text-text-tertiary">The store you're looking for doesn't exist or has been removed.</p>
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
              {store.city && store.state && (
                <Badge variant="outline" size="sm">
                  <svg className="w-3.5 h-3.5 mr-1.5 text-coral/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {store.city}, {store.state}
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
              <Card key={product.id} variant="elevated" className="group">
                <CardHeader className="pb-2">
                  <CardTitle className="text-text-primary group-hover:text-coral transition-colors line-clamp-1">{product.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pb-2">
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
            <p className="text-text-tertiary">This store hasn't added any products yet.</p>
          </div>
        )}
      </section>
    </div>
  )
}
