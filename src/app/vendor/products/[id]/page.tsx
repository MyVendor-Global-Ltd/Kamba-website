'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { apiJson } from '@/lib/api'
import { VendorProductForm, type ProductFormInitial, type ProductFormValues } from '@/components/vendor/product-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'

interface VendorProduct extends ProductFormInitial { id: string }

export default function EditVendorProductPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [product, setProduct] = useState<VendorProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadProduct = useCallback(async () => {
    try {
      setError('')
      const data = await apiJson<{ products: VendorProduct[] }>('/commerce/vendor/products', { params: { limit: 100, offset: 0 } })
      const found = (data.products || []).find((item) => item.id === params.id)
      if (!found) throw new Error('Product not found in your vendor inventory.')
      setProduct(found)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this product.')
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => { void Promise.resolve().then(loadProduct) }, [loadProduct])

  const updateProduct = async (values: ProductFormValues) => {
    setSubmitting(true)
    setError('')
    try {
      await apiJson(`/commerce/vendor/products/${encodeURIComponent(params.id)}`, { method: 'PATCH', body: JSON.stringify(values) })
      router.push('/vendor/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update this product.')
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8 lg:py-12">
      <Link href="/vendor/products" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary"><ChevronLeft className="h-4 w-4" /> Back to products</Link>
      <header><p className="text-sm font-semibold uppercase tracking-wider text-primary">Vendor workspace</p><h1 className="mt-2 font-display text-3xl font-bold text-text-primary">Edit product</h1></header>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {loading ? <div className="h-80 animate-pulse rounded-xl bg-surface-muted" /> : product ? <Card variant="outlined"><CardHeader><CardTitle>Product information</CardTitle></CardHeader><CardContent><VendorProductForm key={product.id} initial={product} submitLabel="Save changes" submitting={submitting} onSubmit={updateProduct} /></CardContent></Card> : <Card variant="outlined"><CardContent className="space-y-3 p-6"><p className="text-sm text-text-secondary">This product could not be loaded.</p><Button variant="outline" onClick={() => router.push('/vendor/products')}>Return to products</Button></CardContent></Card>}
    </div>
  )
}
