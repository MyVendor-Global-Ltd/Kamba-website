'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiJson } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type LocationMode = 'physical' | 'service_area' | 'online' | 'mobile' | 'hybrid'
type EditorKind = 'store' | 'service'

interface BusinessDetails {
  business_name?: string | null
  location_mode?: LocationMode | null
  location_visibility?: 'private' | 'public' | null
  is_home_based?: boolean | null
  public_location_text?: string | null
  location_text?: string | null
  service_area_text?: string | null
  online_url?: string | null
}

interface ExistingListing {
  slug?: string | null
  store_image_url?: string | null
  store_logo_url?: string | null
  store_slideshow_images?: string[] | null
  store_logo_in_slideshow?: boolean
  store_name?: string | null
  service_title?: string | null
  category?: string | null
  description?: string | null
  price_range?: string | null
  tags?: string[] | null
  contact_whatsapp?: string | null
  contact_preference?: 'whatsapp' | 'call' | 'both'
  location_text?: string | null
  business_profiles?: BusinessDetails | BusinessDetails[] | null
}

function firstBusiness(value: ExistingListing['business_profiles']): BusinessDetails | null {
  return Array.isArray(value) ? value[0] || null : value || null
}

async function detectSupportedImageMimeType(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  // Validate file signatures instead of trusting inconsistent Android/browser MIME metadata.
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg'
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
      bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return 'image/png'
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp'
  return ''
}

const MAX_BRAND_IMAGE_SIZE = 10 * 1024 * 1024

const BUSINESS_CATEGORIES = ["Electronics & Gadgets","Fashion & Clothing","Beauty & Personal Care","Food & Groceries","Home & Living","Health & Wellness","Books & Stationery","Sports & Fitness","Automotive","Home Services","Repairs & Maintenance","Professional Services","Education & Tutoring","Events & Photography","Repairs","Photography","Cleaning","Other"]

export function BusinessListingEditor({ kind }: { kind: EditorKind }) {
  const isService = kind === 'service'
  const endpoint = isService ? '/vendors/service' : '/vendors/store'
  const [listing, setListing] = useState<ExistingListing | null>(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [storeImageUrl, setStoreImageUrl] = useState('')
  const [storeLogoUrl, setStoreLogoUrl] = useState('')
  const [pendingImage, setPendingImage] = useState<{ file: File; target: 'cover' | 'logo' | 'slideshow'; previewUrl: string; mimeType: string } | null>(null)
  const [sameCoverAsLogo, setSameCoverAsLogo] = useState(false)
  const [slideshowImages, setSlideshowImages] = useState<string[]>([])
  const [logoInSlideshow, setLogoInSlideshow] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadFailed, setUploadFailed] = useState(false)
  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [description, setDescription] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [tags, setTags] = useState('')
  const [tagDraft, setTagDraft] = useState('')
  const [contactPreference, setContactPreference] = useState<'whatsapp' | 'call' | 'both'>('whatsapp')
  const [locationMode, setLocationMode] = useState<LocationMode>('physical')
  const [locationText, setLocationText] = useState('')
  const [serviceAreaText, setServiceAreaText] = useState('')
  const [onlineUrl, setOnlineUrl] = useState('')
  const [locationVisibility, setLocationVisibility] = useState<'private' | 'public'>('private')
  const [isHomeBased, setIsHomeBased] = useState(false)
  const [publicLocationText, setPublicLocationText] = useState('')
  const [vendorType, setVendorType] = useState<'products' | 'services' | 'both'>('products')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadListing = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [response, profileResponse] = await Promise.all([
        apiJson<{ store?: ExistingListing; service_profile?: ExistingListing }>(endpoint),
        apiJson<{ vendor_profile: { vendor_type: 'products' | 'services' | 'both' } }>('/vendors/profile'),
      ])
      setVendorType(profileResponse.vendor_profile?.vendor_type || 'products')
      const current = isService ? response.service_profile : response.store
      if (!current) throw new Error(isService ? 'No service profile was returned.' : 'No storefront was returned.')
      const business = firstBusiness(current.business_profiles)
      setListing(current)
      setTitle((isService ? current.service_title : current.store_name) || '')
      setSlug(current.slug || '')
      setStoreImageUrl(current.store_image_url || '')
      setStoreLogoUrl(current.store_logo_url || '')
      setSameCoverAsLogo(!!current.store_image_url && current.store_image_url === current.store_logo_url)
      setSlideshowImages(current.store_slideshow_images || [])
      setLogoInSlideshow(current.store_logo_in_slideshow === true)
      setCategory(BUSINESS_CATEGORIES.includes(current.category || '') ? (current.category || '') : current.category ? 'Other' : '')
      setCustomCategory(BUSINESS_CATEGORIES.includes(current.category || '') ? '' : (current.category || ''))
      setDescription(current.description || '')
      setPriceRange(current.price_range || '')
      setTags((current.tags || []).join(', '))
      setContactPreference(current.contact_preference || 'whatsapp')
      setLocationMode(business?.location_mode || (business?.location_text || current.location_text ? 'physical' : 'service_area'))
      setLocationText(business?.location_text || current.location_text || '')
      setServiceAreaText(business?.service_area_text || '')
      setOnlineUrl(business?.online_url || '')
      setLocationVisibility(business?.location_visibility === 'public' ? 'public' : 'private')
      setIsHomeBased(business?.is_home_based === true)
      setPublicLocationText(business?.public_location_text || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this business listing.')
    } finally {
      setLoading(false)
    }
  }, [endpoint, isService])

  useEffect(() => { void Promise.resolve().then(loadListing) }, [loadListing])

  const selectStoreAsset = async (file: File | undefined, target: 'cover' | 'logo' | 'slideshow') => {
    if (!file || isService) return
    setError('')
    setSuccess('')
    if (file.size <= 0 || file.size > MAX_BRAND_IMAGE_SIZE) {
      setError('Each brand image must be 10 MB or smaller.')
      return
    }
    if (target === 'slideshow' && slideshowImages.length >= 10) {
      setError('You can add up to 10 slideshow images.')
      return
    }
    const mimeType = await detectSupportedImageMimeType(file)
    if (!mimeType) {
      setError('This file is not a supported JPEG, PNG or WebP image. HEIC/HEIF and other formats must be converted first.')
      return
    }
    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl)
    setUploadFailed(false)
    setPendingImage({ file, target, mimeType, previewUrl: URL.createObjectURL(file) })
  }

  const discardPendingImage = () => {
    if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl)
    setPendingImage(null)
    setUploadFailed(false)
  }

  const uploadStoreAsset = async () => {
    if (!pendingImage || isService || uploadingImage) return
    const { file, target, mimeType } = pendingImage
    setUploadingImage(true)
    setUploadFailed(false)
    setError('')
    setSuccess('')
    try {
      const upload = await apiJson<{ signed_url: string; public_url: string }>('/vendors/store/image-upload-url', {
        method: 'POST',
        body: JSON.stringify({ mime_type: mimeType }),
      })
      const response = await fetch(upload.signed_url, {
        method: 'PUT',
        headers: { 'Content-Type': mimeType, 'x-upsert': 'false' },
        body: file,
      })
      if (!response.ok) {
        const detail = await response.text().catch(() => '')
        throw new Error(detail ? `Image upload failed: ${detail.slice(0, 240)}` : `Image upload failed (HTTP ${response.status}). Please try again.`)
      }
      const field = target === 'cover' ? 'store_image_url' : target === 'logo' ? 'store_logo_url' : 'store_slideshow_images'
      const value = target === 'slideshow' ? [...slideshowImages, upload.public_url] : upload.public_url
      const payload = target === 'slideshow' ? { [field]: value } : sameCoverAsLogo ? { store_image_url: upload.public_url, store_logo_url: upload.public_url } : { [field]: value }
      const updated = await apiJson<{ store: ExistingListing }>('/vendors/store', { method: 'PATCH', body: JSON.stringify(payload) })
      if (!updated.store) throw new Error('The server did not confirm your brand image.')
      setListing((current) => current ? { ...current, ...updated.store } : updated.store)
      if (target === 'cover') { setStoreImageUrl(upload.public_url); if (sameCoverAsLogo) setStoreLogoUrl(upload.public_url) }
      if (target === 'logo') { setStoreLogoUrl(upload.public_url); if (sameCoverAsLogo) setStoreImageUrl(upload.public_url) }
      if (target === 'slideshow') setSlideshowImages((current) => [...current, upload.public_url])
      setSuccess(target === 'cover' ? 'Your storefront cover has been updated.' : target === 'logo' ? 'Your business logo has been updated.' : 'Slideshow image added.')
      URL.revokeObjectURL(pendingImage.previewUrl)
      setPendingImage(null)
      setUploadFailed(false)
    } catch (err) {
      setUploadFailed(true)
      setError(err instanceof Error ? err.message : 'Could not upload this brand image.')
    } finally {
      setUploadingImage(false)
    }
  }

  const removeSavedStoreImage = async (target: 'cover' | 'logo') => {
    if (saving || uploadingImage) return
    const clearBoth = sameCoverAsLogo
    const payload = clearBoth
      ? { store_image_url: null, store_logo_url: null }
      : target === 'cover' ? { store_image_url: null } : { store_logo_url: null }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const updated = await apiJson<{ store: ExistingListing }>('/vendors/store', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      if (!updated.store) throw new Error('The server did not confirm the image removal.')
      setListing((current) => current ? { ...current, ...updated.store } : updated.store)
      if (clearBoth || target === 'cover') setStoreImageUrl('')
      if (clearBoth || target === 'logo') setStoreLogoUrl('')
      setSuccess(clearBoth
        ? 'Your storefront cover and logo have been removed.'
        : target === 'cover' ? 'Your storefront cover has been removed.' : 'Your business logo has been removed.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove this image.')
    } finally {
      setSaving(false)
    }
  }

  const removeSlideshowImage = async (url: string) => {
    const nextImages = slideshowImages.filter((image) => image !== url)
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const updated = await apiJson<{ store: ExistingListing }>('/vendors/store', {
        method: 'PATCH',
        body: JSON.stringify({ store_slideshow_images: nextImages }),
      })
      if (!updated.store) throw new Error('The server did not confirm the slideshow update.')
      setSlideshowImages(nextImages)
      setListing((current) => current ? { ...current, ...updated.store } : updated.store)
      setSuccess('Slideshow updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the slideshow.')
    } finally {
      setSaving(false)
    }
  }

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if ((!isService || vendorType !== 'both') && locationMode === 'hybrid' && !locationText.trim() && !serviceAreaText.trim() && !onlineUrl.trim()) {
      setError('For a hybrid business, provide at least a physical location, service area or website.')
      setSuccess('')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        [isService ? 'service_title' : 'store_name']: title.trim(),
        ...(!isService ? { store_image_url: storeImageUrl || null, store_logo_url: storeLogoUrl || null, store_slideshow_images: slideshowImages, store_logo_in_slideshow: logoInSlideshow } : {}),
        category: (category === 'Other' ? customCategory : category).trim(),
        description: description.trim(),
        tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        ...(!isService || vendorType !== 'both' ? { location_mode: locationMode, location_text: locationText.trim(), service_area_text: serviceAreaText.trim(), online_url: onlineUrl.trim(), location_visibility: locationVisibility, is_home_based: isHomeBased, public_location_text: publicLocationText.trim() } : {}),
        ...(isService ? { price_range: priceRange.trim(), contact_preference: contactPreference } : {}),
      }
      const response = await apiJson<{ store?: ExistingListing; service_profile?: ExistingListing }>(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      const updated = isService ? response.service_profile : response.store
      if (!updated) throw new Error('The server did not confirm the listing update.')
      setListing(updated)
      if (updated.slug) setSlug(updated.slug)
      setSuccess(isService ? 'Your service page has been updated.' : 'Your storefront has been updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your listing.')
    } finally {
      setSaving(false)
    }
  }

  const heading = isService ? 'Service page' : 'Storefront'
  const titleLabel = isService && vendorType === 'both' ? 'Service listing name' : 'Business name'
  const titleSlug = title.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
  const slugPreview = isService && vendorType === 'both' ? slug : titleSlug || slug

  if (loading) return <div className="container mx-auto max-w-3xl px-4 py-12"><div className="h-80 animate-pulse rounded-xl bg-surface-muted" /></div>
  if (!listing) return (
    <div className="container mx-auto max-w-3xl space-y-4 px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-text-primary">Manage {heading.toLowerCase()}</h1>
      <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error || `No ${heading.toLowerCase()} is connected to this vendor account yet.`}</p>
      <Button variant="outline" onClick={() => void loadListing()}>Retry</Button>
    </div>
  )

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8 lg:py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Vendor workspace</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-text-primary">Manage {heading.toLowerCase()}</h1>
        <p className="mt-2 text-sm text-text-secondary">Changes are saved to your Kamba {isService ? 'service listing' : 'store listing'}.</p>
      </header>
      {error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
      {success && <p role="status" className="rounded-lg bg-secondary p-4 text-sm text-secondary-foreground">{success}</p>}

      <Card variant="outlined">
        <CardHeader><CardTitle>Business details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <Input label={titleLabel} value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={160} />
            {isService && vendorType === 'both' && <p className="text-xs leading-5 text-text-tertiary">This is the service listing title, not a second business name. Your store and service share one business identity and URL base.</p>}
            <div className="space-y-2"><Input label={isService ? 'Service URL slug' : 'Store URL slug'} value={slugPreview} readOnly aria-readonly="true" /><p className="text-xs text-text-tertiary">Generated automatically from your business name. This URL cannot be edited separately.</p></div>
            {!isService && <div className="space-y-3 rounded-xl border border-border p-4">
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Storefront cover</h2>
                <p className="mt-1 text-xs leading-5 text-text-tertiary">Choose a strong landscape or portrait image that represents your brand. JPEG, PNG or WebP · up to 10 MB. Cover and logo images are optional; you can remove them whenever you want.</p>
              </div>
              {(pendingImage?.target === 'cover' ? pendingImage.previewUrl : storeImageUrl) ? <img src={pendingImage?.target === 'cover' ? pendingImage.previewUrl : storeImageUrl} alt="Storefront cover preview" className="h-48 w-full rounded-lg object-cover" /> : <div className="grid h-40 place-items-center rounded-lg bg-gradient-to-br from-[#e9e4d8] to-[#c9c0ae] text-sm text-[#716b5d]">No cover image</div>}
              <div className="flex flex-wrap gap-2">
                {pendingImage?.target !== 'cover' && <label className="inline-flex cursor-pointer items-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:bg-ink-raised">
                  {storeImageUrl ? 'Replace cover image' : 'Choose cover image'}
                  <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" disabled={uploadingImage || saving} className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; void selectStoreAsset(file, 'cover') }} />
                </label>}
                {pendingImage?.target !== 'cover' && storeImageUrl && <Button type="button" variant="outline" onClick={() => void removeSavedStoreImage('cover')} disabled={saving || uploadingImage}>Remove image</Button>}
                {pendingImage?.target === 'cover' && <><Button type="button" onClick={() => void uploadStoreAsset()} disabled={uploadingImage || saving}>{uploadingImage ? 'Uploading…' : uploadFailed ? 'Retry upload' : 'Upload image'}</Button><Button type="button" variant="outline" onClick={discardPendingImage} disabled={uploadingImage}>Remove</Button></>}
              </div>
              <label className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3 text-sm text-text-secondary">
                <input type="checkbox" checked={sameCoverAsLogo} onChange={async (event) => {
                  const checked = event.target.checked
                  setSameCoverAsLogo(checked)
                  if (checked && (storeLogoUrl || storeImageUrl)) {
                    const sharedUrl = storeLogoUrl || storeImageUrl
                    try {
                      const updated = await apiJson<{ store?: ExistingListing }>('/vendors/store', { method: 'PATCH', body: JSON.stringify({ store_image_url: sharedUrl, store_logo_url: sharedUrl }) })
                      const savedStore = updated.store
                      if (!savedStore) throw new Error('The server did not confirm the shared cover and logo.')
                      setStoreImageUrl(sharedUrl); setStoreLogoUrl(sharedUrl); setListing((current) => current ? { ...current, ...savedStore } : savedStore)
                    } catch (err) { setSameCoverAsLogo(false); setError(err instanceof Error ? err.message : 'Could not link the cover and logo.') }
                  }
                }} className="mt-1" />
                <span><strong className="block text-text-primary">My cover photo and logo are the same</strong><span className="text-xs">Upload once and use the same image for both.</span></span>
              </label>
              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-text-primary">Business logo</h3>
                <p className="mt-1 text-xs leading-5 text-text-tertiary">A square logo works best. It appears beside your business name across the storefront.</p>
                <div className="mt-3 flex items-center gap-4">
                  {(pendingImage?.target === 'logo' ? pendingImage.previewUrl : storeLogoUrl) ? <img src={pendingImage?.target === 'logo' ? pendingImage.previewUrl : storeLogoUrl} alt="Business logo preview" className="h-20 w-20 rounded-full border border-border bg-white object-contain p-2" /> : <div className="grid h-20 w-20 place-items-center rounded-full border border-dashed border-border text-xs text-text-tertiary">No logo</div>}
                  <div className="flex flex-wrap gap-2">
                    {pendingImage?.target !== 'logo' && <label className="inline-flex cursor-pointer items-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-ink-raised">
                      {storeLogoUrl ? 'Replace logo' : 'Choose logo'}
                      <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" disabled={uploadingImage || saving} className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; void selectStoreAsset(file, 'logo') }} />
                    </label>}
                    {pendingImage?.target !== 'logo' && storeLogoUrl && <Button type="button" variant="outline" onClick={() => void removeSavedStoreImage('logo')} disabled={saving || uploadingImage}>Remove image</Button>}
                    {pendingImage?.target === 'logo' && <><Button type="button" onClick={() => void uploadStoreAsset()} disabled={uploadingImage || saving}>{uploadingImage ? 'Uploading…' : uploadFailed ? 'Retry upload' : 'Upload logo'}</Button><Button type="button" variant="outline" onClick={discardPendingImage} disabled={uploadingImage}>Remove</Button></>}
                  </div>
                </div>
              </div>
              <div className="space-y-3 border-t border-border pt-4">
                <div><h3 className="text-sm font-semibold text-text-primary">Storefront slideshow</h3><p className="mt-1 text-xs leading-5 text-text-tertiary">Add up to 10 images. Each image displays for 3 seconds. If you include your logo, it stays on screen for 10 seconds.</p></div>
                {slideshowImages.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{slideshowImages.map((url, index) => <div key={url} className="relative overflow-hidden rounded-lg border border-border"><img src={url} alt={'Slideshow image ' + (index + 1)} className="h-28 w-full object-cover" /><button type="button" onClick={() => void removeSlideshowImage(url)} disabled={saving || uploadingImage} className="absolute right-2 top-2 rounded bg-black/75 px-2 py-1 text-xs font-semibold text-white">Remove</button></div>)}</div>}
                <div className="flex flex-wrap items-center gap-2">
                  {pendingImage?.target !== 'slideshow' && <label className="inline-flex cursor-pointer items-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-primary hover:bg-ink-raised">
                    Add slideshow image
                    <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" disabled={uploadingImage || saving || slideshowImages.length >= 10} className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ''; void selectStoreAsset(file, 'slideshow') }} />
                  </label>}
                  {pendingImage?.target === 'slideshow' && <><img src={pendingImage.previewUrl} alt="Slideshow image preview" className="h-16 w-24 rounded-md object-cover" /><Button type="button" onClick={() => void uploadStoreAsset()} disabled={uploadingImage || saving}>{uploadingImage ? 'Uploading…' : uploadFailed ? 'Retry upload' : 'Upload image'}</Button><Button type="button" variant="outline" onClick={discardPendingImage} disabled={uploadingImage}>Remove</Button></>}
                </div>
                <label className="flex items-start gap-2 text-sm text-text-secondary"><input type="checkbox" checked={logoInSlideshow} disabled={!storeLogoUrl || saving || uploadingImage} onChange={async (event) => { const checked = event.target.checked; setLogoInSlideshow(checked); try { await apiJson('/vendors/store', { method: 'PATCH', body: JSON.stringify({ store_logo_in_slideshow: checked }) }); setSuccess(checked ? 'Your logo will display for 10 seconds in the slideshow.' : 'Your logo will remain as the storefront mark, outside the slideshow.') } catch (err) { setLogoInSlideshow(!checked); setError(err instanceof Error ? err.message : 'Could not save slideshow settings.') } }} className="mt-1" /><span>Include my logo in the slideshow for 10 seconds</span></label>
              </div>
            </div>}
            <label className="block text-sm font-medium text-text-secondary">Category<select value={category} onChange={(event) => setCategory(event.target.value)} required className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary"><option value="">Choose a category</option><option value="Electronics & Gadgets">Electronics & Gadgets</option><option value="Fashion & Clothing">Fashion & Clothing</option><option value="Beauty & Personal Care">Beauty & Personal Care</option><option value="Food & Groceries">Food & Groceries</option><option value="Home & Living">Home & Living</option><option value="Health & Wellness">Health & Wellness</option><option value="Books & Stationery">Books & Stationery</option><option value="Sports & Fitness">Sports & Fitness</option><option value="Automotive">Automotive</option><option value="Home Services">Home Services</option><option value="Repairs & Maintenance">Repairs & Maintenance</option><option value="Professional Services">Professional Services</option><option value="Education & Tutoring">Education & Tutoring</option><option value="Events & Photography">Events & Photography</option><option value="Other">Other</option></select></label>
            {category === 'Other' && <Input label="Your category" value={customCategory} onChange={(event) => setCustomCategory(event.target.value)} required maxLength={100} placeholder="Enter your business category" />}
            <label className="block text-sm font-medium text-text-secondary">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} maxLength={5000} className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary outline-none focus:border-primary" /></label>
            {isService && <Input label="Price range or starting price" value={priceRange} onChange={(event) => setPriceRange(event.target.value)} placeholder="e.g. From ₦15,000" />}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text-secondary">Search keywords / tags</label>
              <div className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
                {tags.split(',').map((tag) => tag.trim()).filter(Boolean).map((tag) => <span key={tag.toLowerCase()} className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-xs font-medium text-primary">{tag}<button type="button" aria-label={'Remove '+tag} onClick={() => setTags(tags.split(',').map((item) => item.trim()).filter((item) => item && item.toLowerCase() !== tag.toLowerCase()).join(', '))} className="ml-1 text-primary/70 hover:text-primary">×</button></span>)}
                <input value={tagDraft} onChange={(event) => { const value = event.target.value; if (value.includes(',')) { const parts = value.split(','); const additions = parts.slice(0,-1).map((part) => part.trim()).filter(Boolean); setTags([...tags.split(',').map((part) => part.trim()).filter(Boolean), ...additions].filter((item,index,all)=>all.findIndex((x)=>x.toLowerCase()===item.toLowerCase())===index).join(', ')); setTagDraft(parts[parts.length-1]) } else setTagDraft(value) }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); const next = tagDraft.trim(); if (next) setTags([...tags.split(',').map((part) => part.trim()).filter(Boolean), next].filter((item,index,all)=>all.findIndex((x)=>x.toLowerCase()===item.toLowerCase())===index).join(', ')); setTagDraft('') } else if (event.key === 'Backspace' && !tagDraft && tags) setTags(tags.split(',').slice(0,-1).join(', ')) }} placeholder={tags ? 'Add another keyword…' : 'Type a keyword and press comma or Enter'} className="min-w-[180px] flex-1 bg-transparent py-1 text-sm text-text-primary outline-none placeholder:text-text-tertiary" />
              </div>
              <p className="text-xs text-text-tertiary">Separate keywords with commas or press Enter. These help buyers find your business.</p>
            </div>
                        {isService && (
              <label className="block text-sm font-medium text-text-secondary">Preferred contact method
                <select value={contactPreference} onChange={(event) => setContactPreference(event.target.value as typeof contactPreference)} className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary">
                  <option value="whatsapp">WhatsApp</option><option value="call">Phone call</option><option value="both">WhatsApp and phone call</option>
                </select>
              </label>
            )}
            {isService && vendorType === 'both' ? <div className="rounded-lg border border-border p-4"><h2 className="font-semibold text-text-primary">Shared business location</h2><p className="mt-1 text-sm text-text-secondary">This service uses the same business and pickup location as your storefront. Edit the address and its visibility from Storefront settings so the two listings stay in sync.</p></div> : <div className="border-t border-border pt-4">
              <h2 className="font-semibold text-text-primary">Business / pickup location</h2>
              <label className="mt-3 block text-sm font-medium text-text-secondary">Location type
                <select value={locationMode} onChange={(event) => setLocationMode(event.target.value as LocationMode)} className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary">
                  <option value="physical">Physical location</option><option value="service_area">Service area</option><option value="mobile">Mobile business</option><option value="online">Online</option><option value="hybrid">Hybrid</option>
                </select>
              </label>
              {(locationMode === 'physical' || locationMode === 'hybrid') && <Input label="Business address or location" value={locationText} onChange={(event) => setLocationText(event.target.value)} required={locationMode === 'physical'} placeholder="Street, area, city and state" />}
              {(locationMode === 'service_area' || locationMode === 'mobile' || locationMode === 'hybrid') && <Input label="Service or delivery area" value={serviceAreaText} onChange={(event) => setServiceAreaText(event.target.value)} required={locationMode === 'service_area' || locationMode === 'mobile'} placeholder="Areas or neighbourhoods covered" />}
              {(locationMode === 'online' || locationMode === 'hybrid') && <Input label="Website or online storefront URL" type="url" value={onlineUrl} onChange={(event) => setOnlineUrl(event.target.value)} required={locationMode === 'online'} placeholder="https://…" />}
              {(locationMode === 'physical' || locationMode === 'hybrid') && <div className="mt-3 space-y-3 rounded-lg border border-border p-3">
                <label className="flex items-start gap-2 text-sm text-text-primary"><input type="checkbox" checked={isHomeBased} onChange={(event) => setIsHomeBased(event.target.checked)} className="mt-1" /><span><strong>This is a home-based business</strong><span className="mt-1 block text-xs leading-5 text-text-secondary">Your full residential address stays private. Kamba will only show a separate street or nearby landmark label if you choose to make your location public.</span></span></label>
                {isHomeBased && <Input label="Public street or nearby landmark" value={publicLocationText} onChange={(event) => setPublicLocationText(event.target.value)} placeholder="e.g. Near Umudike junction" maxLength={160} />}
                <label className="flex items-start gap-2 text-sm text-text-primary"><input type="checkbox" checked={locationVisibility === 'public'} onChange={(event) => setLocationVisibility(event.target.checked ? 'public' : 'private')} className="mt-1" /><span><strong>{isHomeBased ? 'Show public area label on your store' : 'Show exact business address publicly'}</strong><span className="mt-1 block text-xs leading-5 text-text-secondary">{isHomeBased ? 'Only the street or landmark label above is shown. Your exact home address is never published.' : 'Off by default. When off, public pages hide your street address. Any service area you provide can still be shown.'}</span></span></label>
              </div>}
            </div>}
            <div className="flex flex-wrap items-center gap-3"><Button type="submit" disabled={saving}>{saving ? 'Saving changes…' : 'Save changes'}</Button>{!isService && listing.slug && <a href={'/store/' + listing.slug} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-ink-raised">View public store ↗</a>}</div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
