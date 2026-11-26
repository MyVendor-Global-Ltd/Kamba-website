'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiJson } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, Store, Wrench } from 'lucide-react'

type VendorType = 'products' | 'services' | 'both'
type LocationMode = 'physical' | 'service_area' | 'online' | 'mobile' | 'hybrid'
type DayHours = { closed: boolean; open: string; close: string }
type OperatingHours = Record<string, DayHours>
const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
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
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPEG, PNG or WebP image.')
  }
  if (file.size > 5 * 1024 * 1024) throw new Error('Each image must be 5 MB or smaller.')

  // Resize and encode locally before sending base64 through the API. This keeps
  // large phone-camera images from making the onboarding request unnecessarily heavy.
  let uploadBlob: Blob = file
  let mimeType = file.type
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (context) {
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      const optimized = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82))
      if (optimized && optimized.size < file.size) {
        uploadBlob = optimized
        mimeType = optimized.type || 'image/webp'
      }
    }
    bitmap.close()
  } catch {
    // Keep the original image if browser decoding or WebP encoding is unavailable.
  }

  return new Promise<{ base64: string; mime_type: string }>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const base64 = result.split(',')[1]
      if (!base64) reject(new Error('Could not read the selected image.'))
      else resolve({ base64, mime_type: mimeType })
    }
    reader.onerror = () => reject(new Error('Could not read the selected image.'))
    reader.readAsDataURL(uploadBlob)
  })
}

export function LiveVendorOnboarding() {
  const router = useRouter()
  const { refreshProfile } = useAuth()
  const [eligibility, setEligibility] = useState<Eligibility | null>(null)
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [createdStoreSlug, setCreatedStoreSlug] = useState('')
  const [vendorType, setVendorType] = useState<VendorType>('products')
  const [operatingHours, setOperatingHours] = useState<OperatingHours>({
    monday: { closed: false, open: '09:00', close: '17:00' },
    tuesday: { closed: false, open: '09:00', close: '17:00' },
    wednesday: { closed: false, open: '09:00', close: '17:00' },
    thursday: { closed: false, open: '09:00', close: '17:00' },
    friday: { closed: false, open: '09:00', close: '17:00' },
    saturday: { closed: false, open: '09:00', close: '17:00' },
    sunday: { closed: true, open: '09:00', close: '17:00' },
  })
  const [deliveryMethod, setDeliveryMethod] = useState<'vendor_managed' | 'kamba_managed'>('vendor_managed')
  const [deliveryAreas, setDeliveryAreas] = useState('')
  const [vendorDeliveryFee, setVendorDeliveryFee] = useState('0')
  const [storePhotos, setStorePhotos] = useState<File[]>([])
  const storePhotoPreviews = useMemo(() => storePhotos.map((file) => ({ file, url: URL.createObjectURL(file) })), [storePhotos])
  useEffect(() => () => { storePhotoPreviews.forEach(({ url }) => URL.revokeObjectURL(url)) }, [storePhotoPreviews])
  const [storeForm, setStoreForm] = useState({
    store_name: '', slug: '', category: '', description: '',
    location_mode: 'physical' as LocationMode, location_text: '', service_area_text: '', online_url: '', location_visibility: 'private' as 'private' | 'public', contact_whatsapp: '',
  })
  const [serviceForm, setServiceForm] = useState({
    service_title: '', slug: '', category: '', description: '', price_range: '',
    location_mode: 'service_area' as LocationMode, location_text: '', service_area_text: '', online_url: '', location_visibility: 'private' as 'private' | 'public',
    contact_preference: 'whatsapp', contact_whatsapp: '', fulfilment_options: ['customer_visit'] as string[],
  })

  const loadStatus = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [eligibilityData, statusData] = await Promise.all([
        apiJson<Eligibility>('/vendors/onboard/eligibility'),
        apiJson<OnboardingStatus>('/vendors/onboard/status'),
      ])
      setEligibility(eligibilityData)
      setStatus(statusData)
      try {
        const saved = await apiJson<{ draft?: { vendor_type?: VendorType; storeForm?: Partial<typeof storeForm>; serviceForm?: Partial<typeof serviceForm>; operatingHours?: OperatingHours; deliveryMethod?: 'vendor_managed' | 'kamba_managed'; deliveryAreas?: string; vendorDeliveryFee?: string } }>('/vendors/onboard/draft')
        if (saved.draft?.vendor_type) setVendorType(saved.draft.vendor_type)
        if (saved.draft?.storeForm) setStoreForm((previous) => ({ ...previous, ...saved.draft?.storeForm }))
        if (saved.draft?.serviceForm) setServiceForm((previous) => ({ ...previous, ...saved.draft?.serviceForm }))
        if (saved.draft?.operatingHours) setOperatingHours(saved.draft.operatingHours)
        if (saved.draft?.deliveryMethod) setDeliveryMethod(saved.draft.deliveryMethod)
        if (saved.draft?.deliveryAreas) setDeliveryAreas(saved.draft.deliveryAreas)
        if (saved.draft?.vendorDeliveryFee) setVendorDeliveryFee(saved.draft.vendorDeliveryFee)
      } catch { /* Existing onboarding remains usable if draft retrieval is temporarily unavailable. */ }
      setDraftLoaded(true)
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
      return false
    } finally {
      setLoading(false)
    }
    return true
  }, [])

  useEffect(() => { void Promise.resolve().then(loadStatus) }, [loadStatus])

  useEffect(() => {
    if (!draftLoaded) return
    const timeout = window.setTimeout(() => {
      void apiJson('/vendors/onboard/draft', {
        method: 'PUT',
        body: JSON.stringify({ draft: { vendor_type: vendorType, storeForm, serviceForm, operatingHours, deliveryMethod, deliveryAreas, vendorDeliveryFee } }),
      }).catch(() => { /* Draft saving is best-effort; the user can continue onboarding. */ })
    }, 700)
    return () => window.clearTimeout(timeout)
  }, [draftLoaded, vendorType, storeForm, serviceForm, operatingHours, deliveryMethod, deliveryAreas, vendorDeliveryFee])

  const createBasicProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true); setError(''); setSuccess('')
    try {
      await apiJson('/vendors/onboard/basic', { method: 'POST', body: JSON.stringify({ vendor_type: vendorType }) })
      const statusLoaded = await loadStatus()
      try { await refreshProfile() } catch { /* Status is authoritative for onboarding continuation. */ }
      setSuccess(statusLoaded ? 'Basic vendor profile created. Continue with your business details.' : 'Profile created, but status could not refresh. Retry to continue.')
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not create your vendor profile.') }
    finally { setSubmitting(false) }
  }
  const createStore = async (event: React.FormEvent) => {
    event.preventDefault()
    if (storeForm.location_mode === 'hybrid' && !storeForm.location_text.trim() && !storeForm.service_area_text.trim() && !storeForm.online_url.trim()) {
      setError('For a hybrid business, provide at least a physical location, service area or website.')
      return
    }
    setSubmitting(true); setError(''); setSuccess('')
    try {
      const created = await apiJson<{ store?: { slug?: string } }>('/vendors/onboard/store', {
        method: 'POST',
        body: JSON.stringify({
          ...storeForm,
          operating_hours: operatingHours,
          delivery_setup: { management_method: deliveryMethod, delivery_areas: deliveryMethod === 'vendor_managed' ? deliveryAreas.split(',').map((area) => area.trim()).filter(Boolean) : [], vendor_delivery_fee: deliveryMethod === 'vendor_managed' ? Number(vendorDeliveryFee) : null },
          business_name: storeForm.store_name.trim(),
          store_name: storeForm.store_name.trim(),
          category: storeForm.category.trim(),
          description: storeForm.description.trim(),
        }),
      })
      const statusLoaded = await loadStatus()
      if (created.store?.slug) setCreatedStoreSlug(created.store.slug)
      setServiceForm((previous) => ({ ...previous, slug: makeSlug(storeForm.store_name) }))
      setSuccess(statusLoaded
        ? 'Store profile created. Continue with the next onboarding step.'
        : 'Store profile created, but onboarding status could not refresh. Use Retry before continuing.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the store profile.')
    } finally { setSubmitting(false) }
  }

  const createService = async (event: React.FormEvent) => {
    event.preventDefault()
    if (serviceForm.location_mode === 'hybrid' && !serviceForm.location_text.trim() && !serviceForm.service_area_text.trim() && !serviceForm.online_url.trim()) {
      setError('For a hybrid business, provide at least a physical location, service area or website.')
      return
    }
    setSubmitting(true); setError(''); setSuccess('')
    try {
      await apiJson('/vendors/onboard/service', {
        method: 'POST',
        body: JSON.stringify({
          ...serviceForm,
          ...(vendorType === 'both' ? { location_mode: storeForm.location_mode, location_text: storeForm.location_text, service_area_text: storeForm.service_area_text, online_url: storeForm.online_url, location_visibility: storeForm.location_visibility, operating_hours: operatingHours } : { operating_hours: operatingHours }),
          business_name: (storeForm.store_name || serviceForm.service_title).trim(),
          slug: vendorType === 'both' && storeForm.store_name.trim() ? makeSlug(storeForm.store_name) : serviceForm.slug,
          service_title: serviceForm.service_title.trim(),
          category: serviceForm.category.trim(),
          description: serviceForm.description.trim(),
          price_range: serviceForm.price_range.trim(),
        }),
      })
      const statusLoaded = await loadStatus()
      setSuccess(statusLoaded
        ? 'Service profile created. Your vendor onboarding is complete.'
        : 'Service profile created, but onboarding status could not refresh. Use Retry before continuing.')
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
      const result = await apiJson<{ count?: number }>('/vendors/onboard/location-photos', {
        method: 'POST',
        body: JSON.stringify({ photos }),
      })
      if (!Number.isInteger(result.count) || (result.count ?? 0) < 2) {
        throw new Error('The server did not confirm at least two uploaded location photos.')
      }
      const statusLoaded = await loadStatus()
      setSuccess(statusLoaded
        ? `${result.count} store location photos uploaded.`
        : 'Photos uploaded, but onboarding status could not refresh. Use Retry to confirm the result.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload store location photos.')
    } finally { setSubmitting(false) }
  }

  const makeSlug = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
  const updateStore = <K extends keyof typeof storeForm>(field: K, value: (typeof storeForm)[K]) => setStoreForm((previous) => ({ ...previous, [field]: value, ...(field === 'store_name' ? { slug: makeSlug(String(value)) } : {}) }))
  const updateService = <K extends keyof typeof serviceForm>(field: K, value: (typeof serviceForm)[K]) => setServiceForm((previous) => ({ ...previous, [field]: value, ...(field === 'service_title' ? { slug: makeSlug(vendorType === 'both' && storeForm.store_name.trim() ? storeForm.store_name : String(value)) } : {}) }))
  const showLocationFields = (mode: LocationMode, update: (field: 'location_text' | 'service_area_text' | 'online_url', value: string) => void, values: { location_text: string; service_area_text: string; online_url: string }) => (
    <div className="space-y-3">
      {(mode === 'physical' || mode === 'hybrid') && <Input label="Business location" value={values.location_text} onChange={(event) => update('location_text', event.target.value)} required={mode === 'physical'} placeholder="Street, area, city and state" />}
      {(mode === 'service_area' || mode === 'mobile' || mode === 'hybrid') && <Input label="Service area" value={values.service_area_text} onChange={(event) => update('service_area_text', event.target.value)} required={mode === 'service_area' || mode === 'mobile'} placeholder="Areas, neighbourhoods or delivery coverage" />}
      {(mode === 'online' || mode === 'hybrid') && <Input label="Website or online storefront URL" type="url" value={values.online_url} onChange={(event) => update('online_url', event.target.value)} required={mode === 'online'} placeholder="https://…" />}
    </div>
  )

  const showOperationalFields = () => (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div>
        <h3 className="font-semibold text-text-primary">Operating hours</h3>
        <p className="text-xs text-text-tertiary">Set the days and times customers can reach or visit your business.</p>
      </div>
      <div className="space-y-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="grid grid-cols-[90px_1fr_1fr_auto] items-center gap-2 text-sm">
            <span className="capitalize text-text-secondary">{day}</span>
            <Input aria-label={day + ' opening time'} type="time" value={operatingHours[day].open} disabled={operatingHours[day].closed} onChange={(event) => setOperatingHours((previous) => ({ ...previous, [day]: { ...previous[day], open: event.target.value } }))} />
            <Input aria-label={day + ' closing time'} type="time" value={operatingHours[day].close} disabled={operatingHours[day].closed} onChange={(event) => setOperatingHours((previous) => ({ ...previous, [day]: { ...previous[day], close: event.target.value } }))} />
            <label className="flex items-center gap-1 text-xs text-text-secondary"><input type="checkbox" checked={operatingHours[day].closed} onChange={(event) => setOperatingHours((previous) => ({ ...previous, [day]: { ...previous[day], closed: event.target.checked } }))} />Closed</label>
          </div>
        ))}
      </div>
      <div className="space-y-3 border-t border-border pt-4">
        <h3 className="font-semibold text-text-primary">Delivery arrangement</h3>
        <label className="block text-sm text-text-secondary">Who will arrange delivery?
          <select value={deliveryMethod} onChange={(event) => setDeliveryMethod(event.target.value as 'vendor_managed' | 'kamba_managed')} className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary">
            <option value="vendor_managed">I will arrange delivery</option>
            <option value="kamba_managed">Ask Kamba to arrange delivery</option>
          </select>
        </label>
        {deliveryMethod === 'vendor_managed' && <>
          <Input label="Delivery areas (comma-separated)" value={deliveryAreas} onChange={(event) => setDeliveryAreas(event.target.value)} required placeholder="e.g. Ikeja, Yaba, Surulere" />
          <Input label="Your delivery fee (₦)" type="number" min="0" step="1" value={vendorDeliveryFee} onChange={(event) => setVendorDeliveryFee(event.target.value)} required />
        </>}
        {deliveryMethod === 'kamba_managed' && <p className="text-xs text-text-tertiary">Kamba will arrange a delivery provider. The delivery quote is handled separately; no provider fee is being set here.</p>}
      </div>
    </div>
  )

  if (loading) return <div className="container mx-auto max-w-3xl px-4 py-16"><div className="h-48 animate-pulse rounded-xl bg-surface-muted" /></div>

  if (!status || !eligibility) {
    return (
      <div className="container mx-auto max-w-3xl space-y-4 px-4 py-12">
        <h1 className="font-display text-3xl font-bold text-text-primary">Vendor onboarding</h1>
        <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {error || 'We could not verify your onboarding status.'}
        </p>
        <Button onClick={() => void loadStatus()}>Retry status check</Button>
      </div>
    )
  }

  const stage = status.stage || 'not_eligible'
  const needsStore = status?.next_step === 'create_store'
  const needsService = status?.next_step === 'create_service'
  const previewStoreSlug = storeForm.slug || makeSlug(storeForm.store_name) || 'your-store-name'
  const timelineStep = stage === 'not_eligible' ? 0 : stage === 'vendor_profile_required' || stage === 'liveness_required' ? 1 : stage === 'profile_setup' ? 2 : 3
  const timelineSteps = [
    { title: 'Verify account', detail: 'Email and phone' },
    { title: 'Choose business type', detail: 'Products, services or both' },
    { title: 'Business details', detail: 'Name, location and operations' },
    { title: 'Review and finish', detail: 'Location evidence and status' },
  ]

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8 lg:py-12">
      <header className="space-y-2"><p className="text-sm font-semibold uppercase tracking-wider text-primary">Sell or offer services on Kamba</p><h1 className="font-display text-3xl font-bold text-text-primary">Vendor onboarding</h1><p className="text-sm leading-6 text-text-secondary">Complete the required account and business steps. Your verification status remains pending until Kamba reviews the submitted information.</p></header>
      <Card variant="outlined"><CardContent className="p-4 sm:p-5"><ol className="grid grid-cols-2 gap-4 sm:grid-cols-4" aria-label="Vendor onboarding progress">{timelineSteps.map((step, index) => { const done = index < timelineStep; const current = index === timelineStep; return <li key={step.title} className="relative flex min-w-0 items-start gap-2"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-primary text-white' : current ? 'border-2 border-primary text-primary' : 'border border-border text-text-tertiary'}`}>{done ? '✓' : index + 1}</span><span className="min-w-0"><span className={`block text-xs font-semibold sm:text-sm ${current || done ? 'text-text-primary' : 'text-text-tertiary'}`}>{step.title}</span><span className="mt-0.5 block text-[11px] leading-4 text-text-tertiary">{step.detail}</span></span></li> })}</ol></CardContent></Card>
      {error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
      {success && <div role="status" className="space-y-2 rounded-lg bg-secondary p-4 text-sm text-secondary-foreground"><p>{success}</p>{createdStoreSlug && <a href={'/store/' + createdStoreSlug} target="_blank" rel="noreferrer" className="inline-flex font-semibold underline underline-offset-4">View your public storefront: kamba.ng/store/{createdStoreSlug} ↗</a>}</div>}

      {(stage === 'not_eligible' || (stage === 'liveness_required' && !eligibility.eligible)) && (
        <Card variant="outlined"><CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-gold" /> Complete these account requirements first</CardTitle></CardHeader><CardContent className="space-y-3">
          {(eligibility?.issues || []).map((issue) => <p key={issue.code} className="text-sm text-text-secondary">{issue.message}</p>)}
          <p className="text-sm text-text-secondary">Finish your email and phone verification in account settings, then return here.</p>
          <Button onClick={() => router.push((eligibility?.issues || []).some((issue) => issue.code === 'PHONE_NOT_VERIFIED') ? '/auth/phone?callbackUrl=%2Fvendor%2Fonboard' : '/account?tab=settings')}>{(eligibility?.issues || []).some((issue) => issue.code === 'PHONE_NOT_VERIFIED') ? 'Verify phone number' : (eligibility?.issues || []).some((issue) => issue.code === 'EMAIL_NOT_VERIFIED') ? 'Open email verification settings' : 'Open account settings'}</Button>
        </CardContent></Card>
      )}

      {(stage === 'vendor_profile_required' || stage === 'liveness_required') && eligibility.eligible && (
        <Card variant="elevated"><CardHeader><CardTitle>Start your Basic vendor profile</CardTitle></CardHeader><CardContent>
          <form onSubmit={createBasicProfile} className="space-y-4">
            <label className="block text-sm font-medium text-text-secondary">What will you offer on Kamba?
              <select value={vendorType} onChange={(event) => setVendorType(event.target.value as VendorType)} className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary">
                <option value="products">Products and storefront</option><option value="services">Services</option><option value="both">Products and services</option>
              </select>
            </label>
            <p className="text-xs leading-5 text-text-tertiary">You will enter one business location in the next step. It can also be used as your default pickup location; you will choose whether customers can see the exact address publicly.</p>
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating profile…' : 'Continue without NIN or selfie'}</Button>
          </form>
        </CardContent></Card>
      )}
      {stage === 'liveness_done' && (
        <Card variant="outlined"><CardHeader><CardTitle>Vendor profile needs attention</CardTitle></CardHeader><CardContent className="space-y-3">
          <p className="text-sm text-text-secondary">Your liveness check is already recorded, but the vendor profile is missing. We will not ask you to submit another selfie or pretend the profile exists. Contact Kamba support to repair this onboarding record.</p>
        </CardContent></Card>
      )}

      {stage === 'profile_setup' && needsStore && (
        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card variant="elevated"><CardHeader><CardTitle className="flex items-center gap-2"><Store className="h-5 w-5 text-primary" /> Create your storefront</CardTitle><p className="text-sm text-text-secondary">Give your shop a name and identity. You can add a cover image and refine the storefront after creation.</p></CardHeader><CardContent>
            <form onSubmit={createStore} className="space-y-4">
              <Input label="Business / store name" value={storeForm.store_name} onChange={(event) => updateStore('store_name', event.target.value)} required />
              <div className="space-y-1"><label className="text-sm font-medium text-text-secondary">Store URL slug</label><Input value={storeForm.slug || 'your-store-name'} readOnly aria-readonly="true" /><p className="text-xs text-text-tertiary">Generated automatically from your business name. Use letters, numbers and hyphens; the URL updates as you type.</p></div>
              <Input label="Product category" value={storeForm.category} onChange={(event) => updateStore('category', event.target.value)} required placeholder="e.g. Fashion, Electronics, Home" />
              <label className="block text-sm font-medium text-text-secondary">Description<textarea value={storeForm.description} onChange={(event) => updateStore('description', event.target.value)} required rows={3} className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary" /></label>
              <label className="block text-sm font-medium text-text-secondary">Business location type<select value={storeForm.location_mode} onChange={(event) => updateStore('location_mode', event.target.value as LocationMode)} className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary"><option value="physical">Physical location</option><option value="service_area">Service area</option><option value="mobile">Mobile business</option><option value="online">Online</option><option value="hybrid">Hybrid</option></select></label>
              {showLocationFields(storeForm.location_mode, (field, value) => updateStore(field, value), storeForm)}
              {(storeForm.location_mode === 'physical' || storeForm.location_mode === 'hybrid') && <div className="rounded-lg border border-border p-3"><label className="flex items-start gap-2 text-sm text-text-primary"><input type="checkbox" checked={storeForm.location_visibility === 'public'} onChange={(event) => updateStore('location_visibility', event.target.checked ? 'public' : 'private')} className="mt-1" /><span><strong>Show exact business address publicly</strong><span className="mt-1 block text-xs leading-5 text-text-secondary">Off by default. When off, customers see your service area instead of your street address. Kamba can still use the saved business location for pickup and fulfilment.</span></span></label></div>}
              {showOperationalFields()}
                            <Input label="Business WhatsApp number" value={storeForm.contact_whatsapp} onChange={(event) => updateStore('contact_whatsapp', event.target.value)} placeholder="Optional business contact" />
              <Button type="submit" disabled={submitting}>{submitting ? 'Creating store…' : 'Create storefront'}</Button>
            </form>
          </CardContent></Card>

          <aside className="overflow-hidden rounded-2xl bg-[#171a16] text-[#f6f2e9] shadow-xl xl:sticky xl:top-24">
            <div className="border-b border-white/15 px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">Your storefront preview</p>
              <p className="mt-1 text-xs text-white/70">This is the look and address customers will start from.</p>
            </div>
            <div className="flex min-h-[310px] flex-col justify-end bg-[radial-gradient(ellipse_at_80%_15%,#77715e_0%,#343b31_42%,#171a16_80%)] p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d5c39b]">{storeForm.category || 'Independent store'}</p>
              <p className="mt-4 font-serif font-normal leading-[0.94] tracking-tight text-white" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.6rem)' }}>{storeForm.store_name || 'Your store name'}</p>
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/70">{storeForm.description || 'A short introduction to what makes your store worth discovering.'}</p>
              <div className="mt-8 border-t border-white/20 pt-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/50">Your public address</p>
                <p className="mt-2 break-all text-sm font-medium text-white">kamba.ng/store/{previewStoreSlug}</p>
              </div>
            </div>
            <div className="px-5 py-4 text-xs leading-5 text-white/60">After creating your store, upload a cover image from Storefront settings to complete the editorial look.</div>
          </aside>
        </div>
      )}

      {stage === 'profile_setup' && needsService && (
        <Card variant="elevated"><CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5 text-primary" /> Create your service profile</CardTitle></CardHeader><CardContent>
          <form onSubmit={createService} className="space-y-4">
            <Input label={vendorType === 'both' ? 'Service listing name' : 'Business name'} value={serviceForm.service_title} onChange={(event) => updateService('service_title', event.target.value)} required />
            <div className="space-y-1"><label className="text-sm font-medium text-text-secondary">Public URL slug</label><Input value={serviceForm.slug || 'your-business-name'} readOnly aria-readonly="true" /><p className="text-xs text-text-tertiary">Generated automatically from your business name.</p></div>
            <Input label="Service category" value={serviceForm.category} onChange={(event) => updateService('category', event.target.value)} required placeholder="e.g. Repairs, Cleaning, Photography" />
            <label className="block text-sm font-medium text-text-secondary">Description<textarea value={serviceForm.description} onChange={(event) => updateService('description', event.target.value)} required rows={3} className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary" /></label>
            <Input label="Price range or starting price" value={serviceForm.price_range} onChange={(event) => updateService('price_range', event.target.value)} placeholder="e.g. From ₦15,000" />
            <label className="block text-sm font-medium text-text-secondary">Business location type<select value={serviceForm.location_mode} onChange={(event) => { const mode = event.target.value as LocationMode; updateService('location_mode', mode); updateService('fulfilment_options', mode === 'physical' ? ['on_site'] : mode === 'online' ? ['online'] : mode === 'hybrid' ? ['on_site', 'customer_visit', 'online'] : ['customer_visit']); }} className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary"><option value="physical">Physical location</option><option value="service_area">Service area</option><option value="mobile">Mobile business</option><option value="online">Online</option><option value="hybrid">Hybrid</option></select></label>
            {vendorType === 'both' ? <p className="rounded-lg border border-border p-3 text-sm text-text-secondary">Your business location, address visibility, operating hours and delivery settings are shared with the storefront you created in the previous step. You do not need to enter them again.</p> : showLocationFields(serviceForm.location_mode, (field, value) => updateService(field, value), serviceForm)}
            {vendorType !== 'both' && (serviceForm.location_mode === 'physical' || serviceForm.location_mode === 'hybrid') && <div className="rounded-lg border border-border p-3"><label className="flex items-start gap-2 text-sm text-text-primary"><input type="checkbox" checked={serviceForm.location_visibility === 'public'} onChange={(event) => updateService('location_visibility', event.target.checked ? 'public' : 'private')} className="mt-1" /><span><strong>Show exact business address publicly</strong><span className="mt-1 block text-xs leading-5 text-text-secondary">Off by default. Customers see your service area instead of your street address unless you choose to publish it.</span></span></label></div>}
            {vendorType !== 'both' && showOperationalFields()}
            <fieldset className="space-y-2 rounded-lg border border-border p-3">
              <legend className="px-1 text-sm font-medium text-text-secondary">How will customers receive this service?</legend>
              {[
                ['on_site', 'At your business location'],
                ['customer_visit', 'You visit the customer'],
                ['online', 'Online'],
                ['automated', 'Automated / digital fulfilment'],
              ].map(([value, label]) => (
                <label key={value} className="flex items-center gap-2 text-sm text-text-secondary">
                  <input type="checkbox" checked={serviceForm.fulfilment_options.includes(value)} onChange={(event) => updateService('fulfilment_options', event.target.checked ? [...serviceForm.fulfilment_options, value] : serviceForm.fulfilment_options.filter((item) => item !== value))} />
                  {label}
                </label>
              ))}
            </fieldset>
                        <label className="block text-sm font-medium text-text-secondary">Preferred contact method<select value={serviceForm.contact_preference} onChange={(event) => updateService('contact_preference', event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary"><option value="whatsapp">WhatsApp</option><option value="call">Phone call</option><option value="both">WhatsApp and phone call</option></select></label>
            <Input label="Business WhatsApp number" value={serviceForm.contact_whatsapp} onChange={(event) => updateService('contact_whatsapp', event.target.value)} placeholder="Optional business contact" />
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating service…' : 'Create service profile'}</Button>
          </form>
        </CardContent></Card>
      )}

      {stage === 'complete' && (
        <Card variant="elevated"><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Vendor profile submitted</CardTitle></CardHeader><CardContent className="space-y-4">
          <Badge variant="warning">Verification pending</Badge>
          <p className="text-sm leading-6 text-text-secondary">Your Basic vendor profile is ready. Optional identity and business verification can be completed separately.</p>
          
          {(status?.vendor_type || vendorType) !== 'services' && !status?.location_photos_uploaded && (
            <form onSubmit={uploadPhotos} className="space-y-3 rounded-lg border border-border p-4">
              <h3 className="font-semibold text-text-primary">Upload store location photos</h3>
              <p className="text-sm text-text-secondary">Choose 2–6 photos of your actual business location. These are used for the store-location verification step.</p>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setStorePhotos(Array.from(event.target.files || []).slice(0, 6))} className="block w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-4 file:py-2 file:font-medium file:text-secondary-foreground" />
              {storePhotoPreviews.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{storePhotoPreviews.map(({ file, url }, index) => (
                <div key={url} className="overflow-hidden rounded-lg border border-border">
                  <img src={url} alt={file.name} className="h-28 w-full object-cover" />
                  <div className="flex items-center justify-between gap-2 p-2"><span className="min-w-0 truncate text-xs text-text-secondary">{file.name}</span><button type="button" onClick={() => setStorePhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="shrink-0 text-xs font-semibold text-destructive">Remove</button></div>
                </div>
              ))}</div>}
              <p className="text-xs text-text-tertiary">{storePhotos.length} photo(s) selected. Preview and remove any image before uploading.</p>
              <Button type="submit" variant="outline" disabled={submitting || storePhotos.length < 2}>{submitting ? 'Uploading…' : 'Upload location photos'}</Button>
            </form>
          )}
          <Button onClick={() => router.push('/vendor/dashboard')}>Go to vendor dashboard</Button>
        </CardContent></Card>
      )}
    </div>
  )
}
