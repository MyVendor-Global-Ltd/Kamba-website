'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface ProductFormValues {
  name: string
  description: string
  price: number
  original_price: number | null
  stock_quantity: number
  category: string
  tags: string[]
  images: string[]
  is_available: boolean
}
export interface ProductFormInitial {
  name?: string
  description?: string | null
  price?: number
  original_price?: number | null
  stock_quantity?: number
  category?: string | null
  tags?: string[]
  images?: string[]
  is_available?: boolean
}

export function VendorProductForm({
  initial,
  submitLabel,
  submitting = false,
  onSubmit,
}: {
  initial?: ProductFormInitial
  submitLabel: string
  submitting?: boolean
  onSubmit: (values: ProductFormValues) => Promise<void>
}) {
  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [price, setPrice] = useState(initial?.price ? String(initial.price / 100) : '')
  const [originalPrice, setOriginalPrice] = useState(initial?.original_price ? String(initial.original_price / 100) : '')
  const [stock, setStock] = useState(String(initial?.stock_quantity ?? 0))
  const [category, setCategory] = useState(initial?.category || '')
  const [tags, setTags] = useState((initial?.tags || []).join(', '))
  const [images, setImages] = useState((initial?.images || []).join('\n'))
  const [available, setAvailable] = useState(initial?.is_available ?? true)
  const [error, setError] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    const priceNaira = Number(price)
    const originalNaira = originalPrice.trim() ? Number(originalPrice) : null
    const stockQuantity = Number(stock)
    if (!name.trim()) return setError('Enter a product name.')
    if (!Number.isFinite(priceNaira) || priceNaira <= 0) return setError('Enter a valid price greater than zero.')
    if (originalNaira !== null && (!Number.isFinite(originalNaira) || originalNaira < 0)) return setError('Enter a valid original price or leave it empty.')
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) return setError('Stock quantity must be a whole number of zero or more.')
    const imageUrls = images.split(/\n|,/).map((value) => value.trim()).filter(Boolean)
    if (imageUrls.some((value) => !/^https?:\/\//i.test(value))) return setError('Product images must be valid HTTP or HTTPS URLs.')
    if (imageUrls.length > 20) return setError('You can add up to 20 image URLs.')
    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      price: Math.round(priceNaira * 100),
      original_price: originalNaira === null ? null : Math.round(originalNaira * 100),
      stock_quantity: stockQuantity,
      category: category.trim(),
      tags: tags.split(',').map((value) => value.trim()).filter(Boolean),
      images: imageUrls,
      is_available: available,
    })
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <Input label="Product name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={160} />
      <label className="block text-sm font-medium text-text-secondary">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} maxLength={5000} className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary outline-none focus:border-primary" /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Price (₦)" type="number" min="0.01" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required />
        <Input label="Original price (₦, optional)" type="number" min="0" step="0.01" value={originalPrice} onChange={(event) => setOriginalPrice(event.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Stock quantity" type="number" min="0" step="1" value={stock} onChange={(event) => setStock(event.target.value)} required />
        <Input label="Category" value={category} onChange={(event) => setCategory(event.target.value)} maxLength={100} placeholder="e.g. Fashion" />
      </div>
      <Input label="Tags (comma-separated)" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="e.g. handmade, locally made" />
      <label className="block text-sm font-medium text-text-secondary">Product image URLs<textarea value={images} onChange={(event) => setImages(event.target.value)} rows={3} placeholder="One image URL per line" className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary outline-none focus:border-primary" /></label>
      <p className="text-xs text-text-tertiary">Use publicly accessible HTTPS image URLs. Direct image upload is not exposed by the current product API.</p>
      <label className="flex items-center gap-3 text-sm text-text-primary"><input type="checkbox" checked={available} onChange={(event) => setAvailable(event.target.checked)} className="h-4 w-4 accent-primary" /> Product is available for purchase</label>
      <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : submitLabel}</Button>
    </form>
  )
}
