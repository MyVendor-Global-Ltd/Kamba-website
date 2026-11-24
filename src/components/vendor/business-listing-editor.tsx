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
  location_text?: string | null
  service_area_text?: string | null
  online_url?: string | null
}

interface ExistingListing {
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

export function BusinessListingEditor({ kind }: { kind: EditorKind }) {
  const isService = kind === 'service'
  const endpoint = isService ? '/vendors/service' : '/vendors/store'
  const [listing, setListing] = useState<ExistingListing | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [priceRange, setPriceRange] = useState('')
  const [tags, setTags] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [contactPreference, setContactPreference] = useState<'whatsapp' | 'call' | 'both'>('whatsapp')
  const [locationMode, setLocationMode] = useState<LocationMode>('physical')
  const [locationText, setLocationText] = useState('')
  const [serviceAreaText, setServiceAreaText] = useState('')
  const [onlineUrl, setOnlineUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadListing = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiJson<{ store?: ExistingListing; service_profile?: ExistingListing }>(endpoint)
      const current = isService ? response.service_profile : response.store
      if (!current) throw new Error(isService ? 'No service profile was returned.' : 'No storefront was returned.')
      const business = firstBusiness(current.business_profiles)
      setListing(current)
      setTitle((isService ? current.service_title : current.store_name) || '')
      setCategory(current.category || '')
      setDescription(current.description || '')
      setPriceRange(current.price_range || '')
      setTags((current.tags || []).join(', '))
      setWhatsapp(current.contact_whatsapp || '')
      setContactPreference(current.contact_preference || 'whatsapp')
      setLocationMode(business?.location_mode || (business?.location_text || current.location_text ? 'physical' : 'service_area'))
      setLocationText(business?.location_text || current.location_text || '')
      setServiceAreaText(business?.service_area_text || '')
      setOnlineUrl(business?.online_url || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this business listing.')
    } finally {
      setLoading(false)
    }
  }, [endpoint, isService])

  useEffect(() => { void loadListing() }, [loadListing])

  const save = async (event: React.FormEvent) => {
    event.preventDefault()
    if (locationMode === 'hybrid' && !locationText.trim() && !serviceAreaText.trim() && !onlineUrl.trim()) {
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
        category: category.trim(),
        description: description.trim(),
        tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        contact_whatsapp: whatsapp.trim() || null,
        location_mode: locationMode,
        location_text: locationText.trim(),
        service_area_text: serviceAreaText.trim(),
        online_url: onlineUrl.trim(),
        ...(isService ? { price_range: priceRange.trim(), contact_preference: contactPreference } : {}),
      }
      const response = await apiJson<{ store?: ExistingListing; service_profile?: ExistingListing }>(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      const updated = isService ? response.service_profile : response.store
      if (!updated) throw new Error('The server did not confirm the listing update.')
      setListing(updated)
      setSuccess(isService ? 'Your service page has been updated.' : 'Your storefront has been updated.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your listing.')
    } finally {
      setSaving(false)
    }
  }

  const heading = isService ? 'Service page' : 'Storefront'
  const titleLabel = isService ? 'Service title' : 'Store name'

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
            <Input label="Category" value={category} onChange={(event) => setCategory(event.target.value)} required maxLength={100} />
            <label className="block text-sm font-medium text-text-secondary">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} maxLength={5000} className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary outline-none focus:border-primary" /></label>
            {isService && <Input label="Price range or starting price" value={priceRange} onChange={(event) => setPriceRange(event.target.value)} placeholder="e.g. From ₦15,000" />}
            <Input label="Tags (comma-separated)" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="e.g. repairs, home service" />
            <Input label="Business WhatsApp number" type="tel" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} placeholder="+234…" />
            {isService && (
              <label className="block text-sm font-medium text-text-secondary">Preferred contact method
                <select value={contactPreference} onChange={(event) => setContactPreference(event.target.value as typeof contactPreference)} className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary">
                  <option value="whatsapp">WhatsApp</option><option value="call">Phone call</option><option value="both">WhatsApp and phone call</option>
                </select>
              </label>
            )}
            <div className="border-t border-border pt-4">
              <h2 className="font-semibold text-text-primary">Business location</h2>
              <label className="mt-3 block text-sm font-medium text-text-secondary">Location type
                <select value={locationMode} onChange={(event) => setLocationMode(event.target.value as LocationMode)} className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary">
                  <option value="physical">Physical location</option><option value="service_area">Service area</option><option value="mobile">Mobile business</option><option value="online">Online</option><option value="hybrid">Hybrid</option>
                </select>
              </label>
              {(locationMode === 'physical' || locationMode === 'hybrid') && <Input label="Business address or location" value={locationText} onChange={(event) => setLocationText(event.target.value)} required={locationMode === 'physical'} placeholder="Street, area, city and state" />}
              {(locationMode === 'service_area' || locationMode === 'mobile' || locationMode === 'hybrid') && <Input label="Service or delivery area" value={serviceAreaText} onChange={(event) => setServiceAreaText(event.target.value)} required={locationMode === 'service_area' || locationMode === 'mobile'} placeholder="Areas or neighbourhoods covered" />}
              {(locationMode === 'online' || locationMode === 'hybrid') && <Input label="Website or online storefront URL" type="url" value={onlineUrl} onChange={(event) => setOnlineUrl(event.target.value)} required={locationMode === 'online'} placeholder="https://…" />}
            </div>
            <Button type="submit" disabled={saving}>{saving ? 'Saving changes…' : 'Save changes'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
