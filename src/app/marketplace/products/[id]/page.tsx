'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiJson } from '@/lib/api'
import { Product } from '@/types/commerce'
import { useCart } from '@/hooks/useCart'

export default function ProductDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { addItem } = useCart()

  useEffect(() => {
    apiJson<{ product: Product }>(`/commerce/products/${id}`)
      .then((data) => {
        setProduct(data.product)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load product')
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Product not found.</p>
      </div>
    )
  }

  const handleAddToCart = () => {
    addItem({ product_id: product.id, quantity: 1 })
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardContent className="h-64 flex items-center justify-center bg-muted">
            <p className="text-muted-foreground">Product image</p>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-lg font-bold">₦{(product.price / 100).toFixed(2)}</p>
          {product.description && (
            <Card>
              <CardContent>
                <p className="text-muted-foreground">{product.description}</p>
              </CardContent>
            </Card>
          )}
          <div className="flex items-center gap-4">
            <button
              onClick={handleAddToCart}
              className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
