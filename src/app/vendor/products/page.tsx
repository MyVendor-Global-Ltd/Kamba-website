'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiJson } from '@/lib/api'

export default function VendorProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiJson<{ products: any[] }>('/vendors/products')
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Products</h1>
          <p className="text-muted-foreground">Manage your store products.</p>
        </div>
        <Link href="/vendor/products/new">
          <Button>Add product</Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id}>
            <CardContent className="p-4">
              <h4 className="font-semibold">{product.name}</h4>
              <p className="text-sm text-muted-foreground">₦{(product.price || 0) / 100}</p>
              <p className="text-xs text-muted-foreground">Stock: {product.stock_quantity}</p>
              <div className="mt-4 flex gap-2">
                <Link href={`/vendor/products/${product.id}`}>
                  <button className="flex-1 py-2 border rounded text-sm text-primary hover:underline">Edit</button>
                </Link>
                <button className="flex-1 py-2 border rounded text-sm text-destructive hover:bg-destructive/10">Delete</button>
              </div>
            </CardContent>
          </Card>
        ))}
        {products.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No products yet.</p>
            <Link href="/vendor/products/new">
              <Button>Add your first product</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
