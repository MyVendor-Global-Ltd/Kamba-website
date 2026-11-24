'use client'

import { useState } from 'react'
import { apiJson } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const IMAGE_LIMIT = 5 * 1024 * 1024
const VIDEO_LIMIT = 25 * 1024 * 1024

type MediaUpload = { signed_url: string; public_url: string }

async function uploadProductMedia(file: File, kind: 'image' | 'video') {
  const upload = await apiJson<MediaUpload>('/commerce/vendor/products/media-upload-url', {
    method: 'POST',
    body: JSON.stringify({ kind, mime_type: file.type }),
  })
  const response = await fetch(upload.signed_url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  if (!response.ok) throw new Error(`Could not upload ${file.name}. Storage rejected the file.`)
  return upload.public_url
}

export interface ProductFormValues {
  name: string
  description: string
  price: number
  original_price: number | null
  stock_quantity: number
  category?: string
  tags: string[]
  images: string[]
  videos: string[]
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
  videos?: string[]
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
  const [videos, setVideos] = useState((initial?.videos || []).join('\n'))
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [videoFiles, setVideoFiles] = useState<File[]>([])
  const [available, setAvailable] = useState(initial?.is_available ?? true)
  const [uploading, setUploading] = useState(false)
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
    const tagValues = tags.split(',').map((value) => value.trim()).filter(Boolean)
    if (tagValues.length > 20) return setError('You can add up to 20 tags.')

    const imageUrls = images.split(/\n|,/).map((value) => value.trim()).filter(Boolean)
    const videoUrls = videos.split(/\n|,/).map((value) => value.trim()).filter(Boolean)
    if (imageUrls.some((value) => !/^https?:\/\//i.test(value))) return setError('Product image URLs must use HTTP or HTTPS.')
    if (videoUrls.some((value) => !/^https?:\/\//i.test(value))) return setError('Product video URLs must use HTTP or HTTPS.')
    if (imageUrls.length + imageFiles.length > 20) return setError('You can add up to 20 product images.')
    if (videoUrls.length + videoFiles.length > 5) return setError('You can add up to 5 product videos.')
    if (imageFiles.some((file) => !IMAGE_TYPES.includes(file.type) || file.size > IMAGE_LIMIT)) return setError('Images must be JPEG, PNG or WebP and no larger than 5 MB each.')
    if (videoFiles.some((file) => !VIDEO_TYPES.includes(file.type) || file.size > VIDEO_LIMIT)) return setError('Videos must be MP4, WebM or MOV and no larger than 25 MB each.')

    setUploading(true)
    try {
      const uploadedImages: string[] = []
      const uploadedVideos: string[] = []
      for (const file of imageFiles) uploadedImages.push(await uploadProductMedia(file, 'image'))
      for (const file of videoFiles) uploadedVideos.push(await uploadProductMedia(file, 'video'))
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        price: Math.round(priceNaira * 100),
        original_price: originalNaira === null ? null : Math.round(originalNaira * 100),
        stock_quantity: stockQuantity,
        category: category.trim() || undefined,
        tags: tagValues,
        images: [...imageUrls, ...uploadedImages],
        videos: [...videoUrls, ...uploadedVideos],
        is_available: available,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save product media.')
    } finally {
      setUploading(false)
    }
  }

  const busy = submitting || uploading

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
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-secondary">Product images</label>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setImageFiles(Array.from(event.target.files || []))} className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-4 file:py-2 file:font-medium file:text-secondary-foreground" />
        <p className="text-xs text-text-tertiary">JPEG, PNG or WebP; maximum 5 MB each. Existing public image URLs can also be retained below.</p>
        {imageFiles.length > 0 && <p className="text-xs text-text-secondary">{imageFiles.length} image file(s) selected: {imageFiles.map((file) => file.name).join(', ')}</p>}
        <textarea value={images} onChange={(event) => setImages(event.target.value)} rows={2} placeholder="Optional image URLs, one per line" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary outline-none focus:border-primary" />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-secondary">Product videos</label>
        <input type="file" accept="video/mp4,video/webm,video/quicktime" multiple onChange={(event) => setVideoFiles(Array.from(event.target.files || []))} className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-4 file:py-2 file:font-medium file:text-secondary-foreground" />
        <p className="text-xs text-text-tertiary">MP4, WebM or MOV; maximum 25 MB each. Existing public video URLs can also be retained below.</p>
        {videoFiles.length > 0 && <p className="text-xs text-text-secondary">{videoFiles.length} video file(s) selected: {videoFiles.map((file) => file.name).join(', ')}</p>}
        <textarea value={videos} onChange={(event) => setVideos(event.target.value)} rows={2} placeholder="Optional video URLs, one per line" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary outline-none focus:border-primary" />
      </div>
      <label className="flex items-center gap-3 text-sm text-text-primary"><input type="checkbox" checked={available} onChange={(event) => setAvailable(event.target.checked)} className="h-4 w-4 accent-primary" /> Product is available for purchase</label>
      <Button type="submit" disabled={busy}>{uploading ? 'Uploading media…' : submitting ? 'Saving…' : submitLabel}</Button>
    </form>
  )
}
