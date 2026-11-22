'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { apiJson } from '@/lib/api'
import { Product } from '@/types/commerce'
import { formatKobo } from '@/lib/formatting'

export default function ProductDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    apiJson<{ product: Product }>(`/commerce/products/${id}`)
      .then((data) => {
        setProduct(data.product)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || "Failed to load product")
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          <Card variant="elevated">
            <CardContent>
              <div className="w-full h-64 bg-ink-raised/50 rounded-xl" />
            </CardContent>
          </Card>
          <div className="space-y-6">
            <div className="h-10 w-1/2 bg-ink-raised/50 rounded-lg" />
            <div className="h-8 w-1/4 bg-ink-raised/50 rounded-lg" />
            <div className="h-20 bg-ink-raised/50 rounded-xl" />
            <div className="h-12 w-1/3 bg-ink-raised/50 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 lg:py-12 flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-ink-raised/50 flex items-center justify-center mx-auto mb-4 text-text-tertiary">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Product not found</h2>
          <p className="text-text-tertiary">The product you're looking for doesn't exist or has been removed.</p>
          <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
            Back to products
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
        <Card variant="elevated" className="overflow-hidden">
          <CardContent className="p-0">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-64 md:h-80 object-cover"
              />
            ) : (
              <div className="w-full h-64 md:h-80 bg-ink-raised/50 flex items-center justify-center">
                <svg className="w-16 h-16 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="flex flex-wrap items-center gap-3">
            {product.store_name && (
              <Badge variant="secondary" size="sm">
                {product.store_name}
              </Badge>
            )}
            {product.category && (
              <Badge variant="outline" size="sm">
                {product.category}
              </Badge>
            )}
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold font-display text-text-primary">{product.name}</h1>

          <div className="flex items-baseline gap-4">
            <span className="text-3xl font-bold text-text-primary">{formatKobo(product.price)}</span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-xl text-text-tertiary line-through">{formatKobo(product.compare_at_price)}</span>
            )}
          </div>

          {product.description && (
            <Card variant="outlined">
              <CardContent className="pt-0">
                <p className="text-text-secondary">{product.description}</p>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-ink-raised/30">
            <Button variant="default" size="lg" className="flex-1">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Add to cart
            </Button>
            <Button variant="outline" size="lg" className="flex-1">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Save
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-slide-up">
          {error}
        </div>
      )}
    </div>
  )
}
