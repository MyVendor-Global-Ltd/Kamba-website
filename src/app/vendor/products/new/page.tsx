'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiJson } from '@/lib/api'
import { VendorProductForm, type ProductFormValues } from '@/components/vendor/product-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'

export default function NewVendorProductPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const createProduct = async (values: ProductFormValues) => {
    setSubmitting(true)
    setError('')
    try {
      await apiJson('/commerce/vendor/products', { method: 'POST', body: JSON.stringify(values) })
      router.push('/vendor/products')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create this product.')
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8 lg:py-12">
      <Link href="/vendor/products" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary"><ChevronLeft className="h-4 w-4" /> Back to products</Link>
      <header><p className="text-sm font-semibold uppercase tracking-wider text-primary">Vendor workspace</p><h1 className="mt-2 font-display text-3xl font-bold text-text-primary">Add a product</h1><p className="mt-2 text-sm text-text-secondary">Set a clear price, accurate stock quantity and useful product details.</p></header>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <Card variant="outlined"><CardHeader><CardTitle>Product information</CardTitle></CardHeader><CardContent><VendorProductForm submitLabel="Create product" submitting={submitting} onSubmit={createProduct} /></CardContent></Card>
    </div>
  )
}
