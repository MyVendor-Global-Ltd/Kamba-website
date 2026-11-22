'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiJson } from '@/lib/api'
import { Product } from '@/types/commerce'
import { formatKobo } from '@/lib/formatting'
import { ProductCardSkeleton } from '@/components/ui/skeleton'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiJson<{ products: Product[] }>('/commerce/products')
      .then((data) => {
        setProducts(data.products || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load products')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8 animate-fade-in">
        <div className="space-y-4">
          <div className="h-10 w-1/3 bg-ink-raised/50 rounded-lg animate-pulse" />
          <div className="h-6 w-1/2 bg-ink-raised/50 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8">
      <header className="animate-fade-in">
        <h1 className="text-3xl lg:text-4xl font-bold font-display text-text-primary">Products</h1>
        <p className="text-text-secondary mt-2">Browse products from local stores</p>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-slide-up">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        {products.map((product) => (
          <Card key={product.id} variant="elevated" className="h-full group">
            <CardHeader className="pb-2">
              <CardTitle className="text-text-primary group-hover:text-coral transition-colors line-clamp-1">{product.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pb-2">
              {product.image_url ? (
                <Link href={`/marketplace/products/${product.id}`}>
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded-xl group-hover:scale-[1.02] transition-transform duration-300"
                    loading="lazy"
                  />
                </Link>
              ) : (
                <Link href={`/marketplace/products/${product.id}`}>
                  <div className="w-full h-48 bg-ink-raised/50 rounded-xl flex items-center justify-center group-hover:bg-ink-raised/70 transition-colors">
                    <svg className="w-12 h-12 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </Link>
              )}
              {product.description && (
                <p className="text-sm text-text-tertiary line-clamp-2">{product.description}</p>
              )}
            </CardContent>
            <CardFooter className="pt-0 flex items-center justify-between">
              <span className="text-lg font-bold text-text-primary">{formatKobo(product.price)}</span>
              <Link href={`/marketplace/products/${product.id}`}>
                <Button variant="ghost" size="sm" className="group-hover:text-coral transition-colors">
                  View
                  <svg className="ml-1.5 w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
        {products.length === 0 && (
          <div className="col-span-full text-center py-16">
            <div className="w-16 h-16 rounded-full bg-ink-raised/50 flex items-center justify-center mx-auto mb-4 text-text-tertiary">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No products found</h3>
            <p className="text-text-tertiary">Check back soon for new products from local stores.</p>
          </div>
        )}
      </div>
    </div>
  )
}
