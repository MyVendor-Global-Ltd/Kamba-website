'use client'

import { useEffect, useState } from 'react'
import { Link, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { apiJson } from '@/lib/api'
import { Store, Product } from '@/types'

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
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Store not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{store.name}</h1>
          <p className="text-muted-foreground">{store.description || 'No description available'}</p>
        </div>
        <Badge variant={store.verification_status === 'business' ? 'default' : 'outline'}>
          {store.verification_status}
        </Badge>
      </div>

      {error && (
        <div className="p-4 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <h2 className="col-span-full text-xl font-semibold mb-4">Products ({products.length})</h2>
        {products.map((product) => (
          <Card key={product.id}>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
            </CardContent>
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
            <p className="text-muted-foreground">No products available.</p>
          </div>
        )}
      </div>
    </div>
  )
}
