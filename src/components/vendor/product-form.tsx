'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadProductMedia } from '@/lib/product-media'

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
  const [originalPrice, setOriginalPrice] = useState(initial?.original_price != null ? String(initial.original_price / 100) : '')
  const [stock, setStock] = useState(String(initial?.stock_quantity ?? 0))
  const [category, setCategory] = useState(initial?.category || '')
  const [tags, setTags] = useState((initial?.tags || []).join(', '))
  const [images, setImages] = useState((initial?.images || []).join('\n'))
  const [videos, setVideos] = useState((initial?.videos || []).join('\n'))
  const [available, setAvailable] = useState(initial?.is_available ?? true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')

  const uploadFiles = async (files: File[], expectedKind: 'image' | 'video') => {
    if (!files.length) return
    setError('')
    setUploading(true)
    setUploadProgress('Preparing ' + files.length + ' files…')

    const uploadedUrls: string[] = []
    const failures: string[] = []
    let nextIndex = 0
    let completed = 0

    const uploadWorker = async () => {
      while (true) {
        const index = nextIndex++
        if (index >= files.length) return
        const file = files[index]
        try {
          const uploaded = await uploadProductMedia(file)
          if (uploaded.kind !== expectedKind) throw new Error('The selected file does not match this media field.')
          uploadedUrls[index] = uploaded.url
        } catch (err) {
          failures.push(err instanceof Error ? err.message : file.name + ' failed to upload.')
        } finally {
          completed += 1
          setUploadProgress('Uploading ' + completed + ' of ' + files.length + '…')
        }
      }
    }

    try {
      // Three concurrent uploads reduce waiting time without flooding mobile networks.
      await Promise.all(Array.from({ length: Math.min(3, files.length) }, () => uploadWorker()))
      const successfulUrls = uploadedUrls.filter(Boolean)
      if (successfulUrls.length) {
        if (expectedKind === 'image') {
          setImages((current) => [...current.split(/\n|,/).map((value) => value.trim()).filter(Boolean), ...successfulUrls].join('\n'))
        } else {
          setVideos((current) => [...current.split(/\n|,/).map((value) => value.trim()).filter(Boolean), ...successfulUrls].join('\n'))
        }
      }
      if (failures.length) {
        setError(successfulUrls.length + ' of ' + files.length + ' files uploaded. ' + failures[0])
        setUploadProgress('Uploaded ' + successfulUrls.length + ' of ' + files.length + ' files. You can retry the failed files.')
      } else {
        setUploadProgress(successfulUrls.length + ' file' + (successfulUrls.length === 1 ? '' : 's') + ' uploaded.')
      }
    } finally {
      setUploading(false)
    }
  }

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
    if ([...imageUrls, ...videoUrls].some((value) => !/^https?:\/\//i.test(value))) return setError('Product media must use valid HTTP or HTTPS URLs.')
    if (imageUrls.length > 20) return setError('You can add up to 20 product images.')
    if (videoUrls.length > 20) return setError('You can add up to 20 product videos.')

    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      price: Math.round(priceNaira * 100),
      original_price: originalNaira === null ? null : Math.round(originalNaira * 100),
      stock_quantity: stockQuantity,
      category: category.trim() || undefined,
      tags: tagValues,
      images: imageUrls,
      videos: videoUrls,
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

      <section className="space-y-3 rounded-xl border border-border p-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Product images</h3>
          <p className="mt-1 text-xs text-text-tertiary">JPEG, PNG or WebP · maximum 5 MB per image · up to 20 images</p>
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={uploading || submitting}
          onChange={(event) => {
            const files = Array.from(event.target.files || [])
            event.target.value = ''
            void uploadFiles(files, 'image')
          }}
          className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-text-primary"
        />
        {images.split(/\n|,/).map((value) => value.trim()).filter(Boolean).map((url, index) => (
          <div key={url} className="relative overflow-hidden rounded-lg border border-border">
            <img src={url} alt={`Product image ${index + 1}`} className="h-36 w-full object-cover" />
            <button type="button" onClick={() => setImages((current) => current.split(/\n|,/).map((item) => item.trim()).filter((item) => item && item !== url).join('\n'))} disabled={uploading || submitting} className="absolute right-2 top-2 rounded-md bg-black/75 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black">Remove</button>
          </div>
        ))}
        <p className="text-xs text-text-tertiary">{images.split(/\n|,/).map((value) => value.trim()).filter(Boolean).length} image(s) selected. Remove any image before saving.</p>
      </section>

      <section className="space-y-3 rounded-xl border border-border p-4">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Product videos</h3>
          <p className="mt-1 text-xs text-text-tertiary">MP4, WebM or QuickTime · maximum 25 MB per video · up to 20 videos</p>
        </div>
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime"
          multiple
          disabled={uploading || submitting}
          onChange={(event) => {
            const files = Array.from(event.target.files || [])
            event.target.value = ''
            void uploadFiles(files, 'video')
          }}
          className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-text-primary"
        />
        {videos.split(/\n|,/).map((value) => value.trim()).filter(Boolean).map((url, index) => (
          <div key={url} className="relative overflow-hidden rounded-lg border border-border p-2">
            <video src={url} controls preload="metadata" className="max-h-56 w-full rounded-md bg-black" aria-label={`Product video ${index + 1}`} />
            <button type="button" onClick={() => setVideos((current) => current.split(/\n|,/).map((item) => item.trim()).filter((item) => item && item !== url).join('\n'))} disabled={uploading || submitting} className="mt-2 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-ink-raised">Remove video</button>
          </div>
        ))}
        <p className="text-xs text-text-tertiary">{videos.split(/\n|,/).map((value) => value.trim()).filter(Boolean).length} video(s) selected. Preview and remove files before saving.</p>
      </section>

      {uploadProgress && <p aria-live="polite" className="text-xs text-text-secondary">{uploadProgress}</p>}
      <label className="flex items-center gap-3 text-sm text-text-primary"><input type="checkbox" checked={available} onChange={(event) => setAvailable(event.target.checked)} className="h-4 w-4 accent-primary" /> Product is available for purchase</label>
      <Button type="submit" disabled={submitting || uploading}>{uploading ? 'Uploading media…' : submitting ? 'Saving…' : submitLabel}</Button>
    </form>
  )
}
