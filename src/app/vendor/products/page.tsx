'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { apiJson } from '@/lib/api'
import { formatKobo, formatDateTime } from '@/lib/formatting'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Archive, Package, Plus, Search } from 'lucide-react'

interface VendorProduct {
  id: string
  name: string
  description?: string | null
  price: number
  original_price?: number | null
  stock_quantity: number
  category?: string | null
  images?: string[]
  is_active: boolean
  is_available: boolean
  created_at?: string
}

export default function VendorProductsPage() {
  const [products, setProducts] = useState<VendorProduct[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiJson<{ products: VendorProduct[] }>('/commerce/vendor/products', { params: { limit: 100, offset: 0 } })
      setProducts(data.products || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your products.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void Promise.resolve().then(loadProducts) }, [loadProducts])

  const filteredProducts = useMemo(() => products.filter((product) =>
    `${product.name} ${product.category || ''} ${product.description || ''}`.toLowerCase().includes(search.toLowerCase())
  ), [products, search])

  const archiveProduct = async (product: VendorProduct) => {
    if (!window.confirm(`Archive “${product.name}”? It will no longer be available for purchase.`)) return
    setDeletingId(product.id)
    setError('')
    try {
      await apiJson(`/commerce/vendor/products/${encodeURIComponent(product.id)}`, { method: 'DELETE' })
      setProducts((previous) => previous.filter((item) => item.id !== product.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not archive this product.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-8 px-4 py-8 lg:py-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-sm font-semibold uppercase tracking-wider text-primary">Vendor workspace</p><h1 className="mt-2 font-display text-3xl font-bold text-text-primary">Products</h1><p className="mt-2 text-sm text-text-secondary">Manage your product listings, prices and stock.</p></div>
        <Link href="/vendor/products/new"><Button><Plus className="mr-2 h-4 w-4" /> Add product</Button></Link>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" /><Input aria-label="Search products" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your products…" className="pl-9" /></div>
        <p className="text-sm text-text-secondary">{filteredProducts.length} of {products.length} products</p>
      </div>

      {error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}

      {loading ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((item) => <div key={item} className="h-52 animate-pulse rounded-xl bg-surface-muted" />)}</div> :
        filteredProducts.length === 0 ? (
          <Card variant="outlined"><CardContent className="flex flex-col items-center gap-3 p-10 text-center"><Package className="h-10 w-10 text-text-tertiary" /><h2 className="font-semibold text-text-primary">{products.length ? 'No matching products' : 'No products yet'}</h2><p className="max-w-sm text-sm text-text-secondary">{products.length ? 'Try another search term.' : 'Create your first listing to start selling through your Kamba storefront.'}</p>{!products.length && <Link href="/vendor/products/new"><Button>Add your first product</Button></Link>}</CardContent></Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => {
              const status = !product.is_active || !product.is_available ? 'Unavailable' : product.stock_quantity <= 0 ? 'Out of stock' : product.stock_quantity <= 5 ? 'Low stock' : 'Available'
              const variant = status === 'Available' ? 'success' : status === 'Low stock' ? 'warning' : status === 'Out of stock' ? 'destructive' : 'outline'
              return (
                <Card key={product.id} variant="outlined" className="overflow-hidden">
                  <div className="flex h-40 items-center justify-center bg-secondary">
                    {product.images?.[0] ? <Image src={product.images[0]} alt={product.name} width={320} height={160} unoptimized className="h-full w-full object-cover" /> : <Package className="h-10 w-10 text-primary/50" />}
                  </div>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2"><div className="min-w-0"><h2 className="truncate font-semibold text-text-primary">{product.name}</h2><p className="text-xs text-text-tertiary">{product.category || 'Uncategorised'}</p></div><Badge variant={variant}>{status}</Badge></div>
                    <div className="flex items-center justify-between"><span className="font-display text-lg font-bold text-primary">{formatKobo(product.price)}</span><span className="text-xs text-text-secondary">{product.stock_quantity} in stock</span></div>
                    {product.created_at && <p className="text-xs text-text-tertiary">Created {formatDateTime(product.created_at)}</p>}
                    <div className="flex gap-2 border-t border-border pt-3"><Link href={`/vendor/products/${product.id}`} className="flex-1"><Button variant="outline" className="w-full">Edit</Button></Link><Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" aria-label={`Archive ${product.name}`} onClick={() => void archiveProduct(product)} disabled={deletingId === product.id}><Archive className="h-4 w-4" /></Button></div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )
      }
    </div>
  )
}
