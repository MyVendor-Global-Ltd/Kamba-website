'use client'

import { useEffect, useState } from 'react'
import { Link } from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiJson } from '@/lib/api'
import { Product } from '@/types/commerce'

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
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Products</h1>
        <p className="text-muted-foreground">Browse products from local stores</p>
      </div>

      {error && (
        <div className="p-4 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.description && <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>}
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">₦{(product.price / 100).toFixed(2)}</span>
                <Link href={`/marketplace/products/${product.id}`}>
                  <button className="text-sm font-medium text-primary hover:underline">View</button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
        {products.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No products found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
