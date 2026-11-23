'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiJson } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Camera, CheckCircle2, Store, Wrench } from 'lucide-react'

type VendorType = 'products' | 'services' | 'both'
type LocationMode = 'physical' | 'service_area' | 'online' | 'mobile' | 'hybrid'
interface Eligibility {
  eligible: boolean
  issues: Array<{ code: string; message: string }>
  current_role: string
}
interface OnboardingStatus {
  stage: string
  next_step: string
  vendor_type?: VendorType
  location_photos_uploaded?: boolean
  verification_deadline_at?: string
}

async function fileToBase64(file: File) {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Each image must be 10 MB or smaller.')
  return new Promise<{ base64: string; mime_type: string }>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const base64 = result.split(',')[1]
      if (!base64) reject(new Error('Could not read the selected image.'))
      else resolve({ base64, mime_type: file.type || 'image/jpeg' })
    }
    reader.onerror = () => reject(new Error('Could not read the selected image.'))
    reader.readAsDataURL(file)
  })
}

export function LiveVendorOnboarding() {
  const router = useRouter()
  const { refreshProfile } = useAuth()
  const [eligibility, setEligibility] = useState<Eligibility | null>(null)
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [vendorType, setVendorType] = useState<VendorType>('products')
  const [selfie, setSelfie] = useState<File | null>(null)
  const [storePhotos, setStorePhotos] = useState<File[]>([])
  const [storeForm, setStoreForm] = useState({
    business_name: '', store_name: '', category: '', description: '',
    location_mode: 'physical' as LocationMode, location_text: '', service_area_text: '', online_url: '', contact_whatsapp: '',
  })
  const [serviceForm, setServiceForm] = useState({
    business_name: '', service_title: '', category: '', description: '', price_range: '',
    location_mode: 'service_area' as LocationMode, location_text: '', service_area_text: '', online_url: '',
    contact_preference: 'whatsapp', contact_whatsapp: '',
  })

  const loadStatus = useCallback(async () => {
    try {
      const [eligibilityData, statusData] = await Promise.all([
        apiJson<Eligibility>('/vendors/onboard/eligibility'),
        apiJson<OnboardingStatus>('/vendors/onboard/status'),
      ])
      setEligibility(eligibilityData)
      setStatus(statusData)
      if (statusData.vendor_type) setVendorType(statusData.vendor_type)
      else if (statusData.stage === 'complete') {
        try {
          const profile = await apiJson<{ vendor_type?: VendorType; vendor_profile?: { vendor_type?: VendorType } }>('/vendors/profile')
          const type = profile.vendor_type || profile.vendor_profile?.vendor_type
          if (type) setVendorType(type)
        } catch { /* The status screen remains usable if profile summary is temporarily unavailable. */ }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load vendor onboarding status.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void Promise.resolve().then(loadStatus) }, [loadStatus])

  const submitLiveness = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selfie) { setError('Select a selfie image before continuing.'); return }
    setSubmitting(true); setError(''); setSuccess('')
    try {
      const image = await fileToBase64(selfie)
      await apiJson('/vendors/onboard/liveness', {
        method: 'POST',
        body: JSON.stringify({ image_base64: image.base64, mime_type: image.mime_type, vendor_type: vendorType }),
      })
      await refreshProfile()
      await loadStatus()
      setSuccess('Selfie submitted and vendor onboarding profile created. Continue with your storefront or service profile.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit the selfie.')
    } finally { setSubmitting(false) }
  }

  const createStore = async (event: React.FormEvent) => {
    event.preventDefault(); setSubmitting(true); setError(''); setSuccess('')
    try {
      await apiJson('/vendors/onboard/store', {
        method: 'POST',
        body: JSON.stringify({
          ...storeForm,
          business_name: storeForm.business_name.trim(),
          store_name: storeForm.store_name.trim(),
          category: storeForm.category.trim(),
          description: storeForm.description.trim(),
        }),
      })
      await loadStatus()
      setSuccess('Store profile created. Continue with the next onboarding step.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the store profile.')
    } finally { setSubmitting(false) }
  }

  const createService = async (event: React.FormEvent) => {
    event.preventDefault(); setSubmitting(true); setError(''); setSuccess('')
    try {
      await apiJson('/vendors/onboard/service', {
        method: 'POST',
        body: JSON.stringify({
          ...serviceForm,
          business_name: serviceForm.business_name.trim(),
          service_title: serviceForm.service_title.trim(),
          category: serviceForm.category.trim(),
          description: serviceForm.description.trim(),
          price_range: serviceForm.price_range.trim(),
        }),
      })
      await loadStatus()
      setSuccess('Service profile created. Your vendor onboarding is complete.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the service profile.')
    } finally { setSubmitting(false) }
  }

  const uploadPhotos = async (event: React.FormEvent) => {
    event.preventDefault()
    if (storePhotos.length < 2 || storePhotos.length > 6) {
      setError('Choose between 2 and 6 location photos.')
      return
    }
    setSubmitting(true); setError(''); setSuccess('')
    try {
      const photos = await Promise.all(storePhotos.map(fileToBase64))
      await apiJson('/vendors/onboard/location-photos', {
        method: 'POST',
        body: JSON.stringify({ photos }),
      })
      await loadStatus()
      setSuccess('Store location photos uploaded.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload store location photos.')
    } finally { setSubmitting(false) }
  }

  const updateStore = <K extends keyof typeof storeForm>(field: K, value: (typeof storeForm)[K]) => setStoreForm((previous) => ({ ...previous, [field]: value }))
  const updateService = <K extends keyof typeof serviceForm>(field: K, value: (typeof serviceForm)[K]) => setServiceForm((previous) => ({ ...previous, [field]: value }))
  const showLocationFields = (mode: LocationMode, update: (field: 'location_text' | 'service_area_text' | 'online_url', value: string) => void, values: { location_text: string; service_area_text: string; online_url: string }) => (
    <div className="space-y-3">
      {(mode === 'physical' || mode === 'hybrid') && <Input label="Business location" value={values.location_text} onChange={(event) => update('location_text', event.target.value)} required={mode === 'physical'} placeholder="Street, area, city and state" />}
      {(mode === 'service_area' || mode === 'mobile' || mode === 'hybrid') && <Input label="Service area" value={values.service_area_text} onChange={(event) => update('service_area_text', event.target.value)} required={mode === 'service_area' || mode === 'mobile'} placeholder="Areas, neighbourhoods or delivery coverage" />}
      {(mode === 'online' || mode === 'hybrid') && <Input label="Website or online storefront URL" type="url" value={values.online_url} onChange={(event) => update('online_url', event.target.value)} required={mode === 'online'} placeholder="https://…" />}
    </div>
  )

  if (loading) return <div className="container mx-auto max-w-3xl px-4 py-16"><div className="h-48 animate-pulse rounded-xl bg-surface-muted" /></div>

  const stage = status?.stage || 'not_eligible'
  const needsStore = status?.next_step === 'create_store'
  const needsService = status?.next_step === 'create_service'

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8 lg:py-12">
      <header className="space-y-2"><p className="text-sm font-semibold uppercase tracking-wider text-primary">Sell or offer services on Kamba</p><h1 className="font-display text-3xl font-bold text-text-primary">Vendor onboarding</h1><p className="text-sm leading-6 text-text-secondary">Complete the required account and business steps. Your verification status remains pending until Kamba reviews the submitted information.</p></header>
      {error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
      {success && <p role="status" className="rounded-lg bg-secondary p-4 text-sm text-secondary-foreground">{success}</p>}

      {stage === 'not_eligible' && (
        <Card variant="outlined"><CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-gold" /> Complete these account requirements first</CardTitle></CardHeader><CardContent className="space-y-3">
          {(eligibility?.issues || []).map((issue) => <p key={issue.code} className="text-sm text-text-secondary">{issue.message}</p>)}
          <p className="text-sm text-text-secondary">Finish your username and phone verification in account settings, then return here.</p>
          <Button onClick={() => router.push('/account')}>Open account settings</Button>
        </CardContent></Card>
      )}

      {(stage === 'liveness_required' || stage === 'liveness_done') && (
        <Card variant="elevated"><CardHeader><CardTitle className="flex items-center gap-2"><Camera className="h-5 w-5 text-primary" /> Selfie and vendor type</CardTitle></CardHeader><CardContent>
          <form onSubmit={submitLiveness} className="space-y-4">
            <label className="block text-sm font-medium text-text-secondary">What will you offer on Kamba?
              <select value={vendorType} onChange={(event) => setVendorType(event.target.value as VendorType)} className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary">
                <option value="products">Products and storefront</option><option value="services">Services</option><option value="both">Products and services</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-text-secondary">Selfie image
              <input type="file" accept="image/*" capture="user" onChange={(event) => setSelfie(event.target.files?.[0] || null)} className="mt-2 block w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-4 file:py-2 file:font-medium file:text-secondary-foreground" required />
            </label>
            <p className="text-xs leading-5 text-text-tertiary">Your selfie is uploaded to Kamba's configured storage for the vendor onboarding check. Submit only your own image. The backend records this step; final verification remains subject to Kamba's review.</p>
            <Button type="submit" disabled={submitting || (!eligibility?.eligible && stage !== 'liveness_done')}>{submitting ? 'Submitting…' : 'Submit selfie and continue'}</Button>
          </form>
        </CardContent></Card>
      )}

      {stage === 'profile_setup' && needsStore && (
        <Card variant="elevated"><CardHeader><CardTitle className="flex items-center gap-2"><Store className="h-5 w-5 text-primary" /> Create your storefront</CardTitle></CardHeader><CardContent>
          <form onSubmit={createStore} className="space-y-4">
            <Input label="Business name" value={storeForm.business_name} onChange={(event) => updateStore('business_name', event.target.value)} required />
            <Input label="Store name" value={storeForm.store_name} onChange={(event) => updateStore('store_name', event.target.value)} required />
            <Input label="Product category" value={storeForm.category} onChange={(event) => updateStore('category', event.target.value)} required placeholder="e.g. Fashion, Electronics, Home" />
            <label className="block text-sm font-medium text-text-secondary">Description<textarea value={storeForm.description} onChange={(event) => updateStore('description', event.target.value)} required rows={3} className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary" /></label>
            <label className="block text-sm font-medium text-text-secondary">Business location type<select value={storeForm.location_mode} onChange={(event) => updateStore('location_mode', event.target.value as LocationMode)} className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary"><option value="physical">Physical location</option><option value="service_area">Service area</option><option value="mobile">Mobile business</option><option value="online">Online</option><option value="hybrid">Hybrid</option></select></label>
            {showLocationFields(storeForm.location_mode, (field, value) => updateStore(field, value), storeForm)}
            <Input label="Business WhatsApp number" value={storeForm.contact_whatsapp} onChange={(event) => updateStore('contact_whatsapp', event.target.value)} placeholder="Optional business contact" />
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating store…' : 'Create storefront'}</Button>
          </form>
        </CardContent></Card>
      )}

      {stage === 'profile_setup' && needsService && (
        <Card variant="elevated"><CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5 text-primary" /> Create your service profile</CardTitle></CardHeader><CardContent>
          <form onSubmit={createService} className="space-y-4">
            <Input label="Business name" value={serviceForm.business_name} onChange={(event) => updateService('business_name', event.target.value)} required />
            <Input label="Service title" value={serviceForm.service_title} onChange={(event) => updateService('service_title', event.target.value)} required />
            <Input label="Service category" value={serviceForm.category} onChange={(event) => updateService('category', event.target.value)} required placeholder="e.g. Repairs, Cleaning, Photography" />
            <label className="block text-sm font-medium text-text-secondary">Description<textarea value={serviceForm.description} onChange={(event) => updateService('description', event.target.value)} required rows={3} className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary" /></label>
            <Input label="Price range or starting price" value={serviceForm.price_range} onChange={(event) => updateService('price_range', event.target.value)} placeholder="e.g. From ₦15,000" />
            <label className="block text-sm font-medium text-text-secondary">Business location type<select value={serviceForm.location_mode} onChange={(event) => updateService('location_mode', event.target.value as LocationMode)} className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary"><option value="physical">Physical location</option><option value="service_area">Service area</option><option value="mobile">Mobile business</option><option value="online">Online</option><option value="hybrid">Hybrid</option></select></label>
            {showLocationFields(serviceForm.location_mode, (field, value) => updateService(field, value), serviceForm)}
            <label className="block text-sm font-medium text-text-secondary">Preferred contact method<select value={serviceForm.contact_preference} onChange={(event) => updateService('contact_preference', event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary"><option value="whatsapp">WhatsApp</option><option value="phone">Phone</option><option value="email">Email</option></select></label>
            <Input label="Business WhatsApp number" value={serviceForm.contact_whatsapp} onChange={(event) => updateService('contact_whatsapp', event.target.value)} placeholder="Optional business contact" />
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating service…' : 'Create service profile'}</Button>
          </form>
        </CardContent></Card>
      )}

      {stage === 'complete' && (
        <Card variant="elevated"><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Vendor profile submitted</CardTitle></CardHeader><CardContent className="space-y-4">
          <Badge variant="warning">Verification pending</Badge>
          <p className="text-sm leading-6 text-text-secondary">Your vendor profile has been created. Kamba will review the submitted information. A completed onboarding step does not mean your business has been verified.</p>
          {status?.verification_deadline_at && <p className="text-sm text-text-secondary">Location-photo deadline: {new Date(status.verification_deadline_at).toLocaleDateString('en-NG')}</p>}
          {(status?.vendor_type || vendorType) !== 'services' && !status?.location_photos_uploaded && (
            <form onSubmit={uploadPhotos} className="space-y-3 rounded-lg border border-border p-4">
              <h3 className="font-semibold text-text-primary">Upload store location photos</h3>
              <p className="text-sm text-text-secondary">Choose 2–6 photos of your actual business location. These are used for the store-location verification step.</p>
              <input type="file" accept="image/*" multiple onChange={(event) => setStorePhotos(Array.from(event.target.files || []).slice(0, 6))} className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-4 file:py-2 file:font-medium file:text-secondary-foreground" />
              <p className="text-xs text-text-tertiary">{storePhotos.length} photo(s) selected</p>
              <Button type="submit" variant="outline" disabled={submitting || storePhotos.length < 2}>{submitting ? 'Uploading…' : 'Upload location photos'}</Button>
            </form>
          )}
          <Button onClick={() => router.push('/vendor/dashboard')}>Go to vendor dashboard</Button>
        </CardContent></Card>
      )}
    </div>
  )
}
