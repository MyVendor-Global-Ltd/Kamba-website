'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiJson } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, Store, Wrench } from 'lucide-react'

type VendorType = 'products' | 'services' | 'both'
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

  const [storeForm, setStoreForm] = useState({
    store_name: '', slug: '', category: '', custom_category: '', tagline: '', description: '',
    contact_whatsapp: '',
  })
  const [serviceForm, setServiceForm] = useState({
    service_title: '', slug: '', category: '', custom_category: '', tagline: '', description: '', price_range: '',
    fulfilment_options: ['customer_visit'] as string[],
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
        const saved = await apiJson<{ draft?: { vendor_type?: VendorType; storeForm?: Partial<typeof storeForm>; serviceForm?: Partial<typeof serviceForm> } }>('/vendors/onboard/draft')
        if (saved.draft?.vendor_type) setVendorType(saved.draft.vendor_type)
        if (saved.draft?.storeForm) setStoreForm((previous) => ({ ...previous, ...saved.draft?.storeForm }))
        if (saved.draft?.serviceForm) setServiceForm((previous) => ({ ...previous, ...saved.draft?.serviceForm }))
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
        body: JSON.stringify({ draft: { vendor_type: vendorType, storeForm, serviceForm } }),
      }).catch(() => { /* Draft saving is best-effort; the user can continue onboarding. */ })
    }, 700)
    return () => window.clearTimeout(timeout)
  }, [draftLoaded, vendorType, storeForm, serviceForm])

  const createBasicProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true); setError(''); setSuccess('')
    try {
      await apiJson('/vendors/onboard/basic', { method: 'POST', body: JSON.stringify({ vendor_type: vendorType }) })
      setServiceForm((previous) => ({ ...previous, service_title: storeForm.store_name.trim(), slug: makeSlug(storeForm.store_name) }))
      const statusLoaded = await loadStatus()
      try { await refreshProfile() } catch { /* Status is authoritative for onboarding continuation. */ }
      setSuccess(statusLoaded ? 'Basic vendor profile created. Continue with your business details.' : 'Profile created, but status could not refresh. Retry to continue.')
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not create your vendor profile.') }
    finally { setSubmitting(false) }
  }
  const createStore = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true); setError(''); setSuccess('')
    try {
      const created = await apiJson<{ store?: { slug?: string } }>('/vendors/onboard/store', {
        method: 'POST',
        body: JSON.stringify({
          business_name: storeForm.store_name.trim(),
          store_name: storeForm.store_name.trim(),
          category: (storeForm.category === 'Other' ? storeForm.custom_category : storeForm.category).trim(),
          tagline: storeForm.tagline.trim(),
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
    setSubmitting(true); setError(''); setSuccess('')
    try {
      await apiJson('/vendors/onboard/service', {
        method: 'POST',
        body: JSON.stringify({
          business_name: (storeForm.store_name || serviceForm.service_title).trim(),
          slug: makeSlug(storeForm.store_name),
          service_title: serviceForm.service_title.trim(),
          category: (serviceForm.category === 'Other' ? serviceForm.custom_category : serviceForm.category).trim(),
          tagline: serviceForm.tagline.trim(),
          description: serviceForm.description.trim(),
          price_range: serviceForm.price_range.trim(),
          fulfilment_options: serviceForm.fulfilment_options,
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


  const makeSlug = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)
  const updateStore = <K extends keyof typeof storeForm>(field: K, value: (typeof storeForm)[K]) => setStoreForm((previous) => ({ ...previous, [field]: value, ...(field === 'store_name' ? { slug: makeSlug(String(value)) } : {}) }))
  const updateService = <K extends keyof typeof serviceForm>(field: K, value: (typeof serviceForm)[K]) => setServiceForm((previous) => ({ ...previous, [field]: value, ...(field === 'service_title' ? { slug: makeSlug(vendorType === 'both' && storeForm.store_name.trim() ? storeForm.store_name : String(value)) } : {}) }))




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
  const timelineStep = stage === 'profile_setup' ? 1 : stage === 'complete' ? 2 : 0
  const timelineSteps = [
    { title: 'Business identity', detail: 'Name and what you offer' },
    { title: 'Set up your offer', detail: vendorType === 'both' ? 'Store and services' : vendorType === 'services' ? 'Your services' : 'Your products' },
    { title: 'Workspace', detail: 'Keep building your business' },
  ]

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8 lg:py-12">
      <header className="max-w-2xl space-y-3"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Kamba for business</p><h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">Bring your business to Kamba.</h1><p className="max-w-xl text-sm leading-6 text-text-secondary sm:text-base">Create one business identity. Sell products, offer services, or do both — you can add more later without starting over.</p></header>
      <Card variant="outlined"><CardContent className="p-4 sm:p-5"><ol className="grid grid-cols-3 gap-3 sm:gap-5" aria-label="Business setup progress">{timelineSteps.map((step, index) => { const done = index < timelineStep; const current = index === timelineStep; return <li key={step.title} className="relative flex min-w-0 items-start gap-2"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? 'bg-primary text-white' : current ? 'border-2 border-primary text-primary' : 'border border-border text-text-tertiary'}`}>{done ? '✓' : index + 1}</span><span className="min-w-0"><span className={`block text-xs font-semibold sm:text-sm ${current || done ? 'text-text-primary' : 'text-text-tertiary'}`}>{step.title}</span><span className="mt-0.5 block text-[11px] leading-4 text-text-tertiary">{step.detail}</span></span></li> })}</ol></CardContent></Card>
      {error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
      {success && <div role="status" className="space-y-2 rounded-lg bg-secondary p-4 text-sm text-secondary-foreground"><p>{success}</p>{createdStoreSlug && <a href={'/store/' + createdStoreSlug} target="_blank" rel="noreferrer" className="inline-flex font-semibold underline underline-offset-4">Open your Store page ↗</a>}</div>}

      {(stage === 'not_eligible' || (stage === 'liveness_required' && !eligibility.eligible)) && (
        <Card variant="outlined"><CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-gold" /> Complete these account requirements first</CardTitle></CardHeader><CardContent className="space-y-3">
          {(eligibility?.issues || []).map((issue) => <p key={issue.code} className="text-sm text-text-secondary">{issue.message}</p>)}
          <p className="text-sm text-text-secondary">Finish your email and phone verification in account settings, then return here.</p>
          <Button onClick={() => router.push((eligibility?.issues || []).some((issue) => issue.code === 'PHONE_NOT_VERIFIED') ? '/auth/phone?callbackUrl=%2Fvendor%2Fonboard' : (eligibility?.issues || []).some((issue) => issue.code === 'EMAIL_NOT_VERIFIED') ? '/account?tab=profile' : '/account?tab=settings')}>{(eligibility?.issues || []).some((issue) => issue.code === 'PHONE_NOT_VERIFIED') ? 'Verify phone number' : (eligibility?.issues || []).some((issue) => issue.code === 'EMAIL_NOT_VERIFIED') ? 'Open email verification' : 'Open account settings'}</Button>
        </CardContent></Card>
      )}

      {(stage === 'vendor_profile_required' || stage === 'liveness_required') && eligibility.eligible && (
        <Card variant="elevated" className="overflow-hidden">
          <CardHeader className="space-y-2 border-b border-border/70 bg-surface-muted/40 px-5 py-5 sm:px-7">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Step 1 · Your business</p>
            <CardTitle className="font-display text-2xl">Let's get your business set up</CardTitle>
            <p className="max-w-xl text-sm leading-6 text-text-secondary">Start with the basics. You don't need a separate account or registration for products and services.</p>
          </CardHeader>
          <CardContent className="space-y-6 px-5 py-6 sm:px-7">
            <form onSubmit={createBasicProfile} className="space-y-6">
              <div className="space-y-2">
                <Input label="Business name" placeholder="e.g. The Campus Closet" value={storeForm.store_name} onChange={(event) => updateStore('store_name', event.target.value)} required maxLength={160} />
                <div className="rounded-xl border border-border bg-background px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">Business link preview</p>
                  <p className="mt-1 break-all text-sm font-semibold text-text-primary">kamba.ng/{storeForm.slug || 'your-business-name'}</p>
                  <p className="mt-1 text-xs leading-5 text-text-tertiary">A clean link using your business name — no extra prefix. Your final public link is confirmed when your business profile is created.</p>
                </div>
              </div>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-text-primary">What do you want to offer on Kamba?</legend>
                <p className="text-xs leading-5 text-text-secondary">Choose what fits your business today. You can enable the other option later.</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  
                  <button type="button" onClick={() => setVendorType('products')} aria-pressed={vendorType === 'products'} className={`group rounded-xl border p-4 text-left transition-all ${vendorType === 'products' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-background hover:border-primary/40'}`}>
                    <span className={`mb-4 grid h-10 w-10 place-items-center rounded-xl ${vendorType === 'products' ? 'bg-primary text-white' : 'bg-surface-muted text-text-secondary'}`}><Store className="h-5 w-5" /></span>
                    <span className="block text-sm font-semibold text-text-primary">Sell products</span>
                    <span className="mt-1 block text-xs leading-5 text-text-secondary">Clothing, food, gadgets and things people can buy.</span>
                    <span className={`mt-4 block text-xs font-semibold ${vendorType === 'products' ? 'text-primary' : 'text-text-tertiary'}`}>{vendorType === 'products' ? 'Selected' : 'Choose products'}</span>
                  </button>
                  <button type="button" onClick={() => setVendorType('services')} aria-pressed={vendorType === 'services'} className={`group rounded-xl border p-4 text-left transition-all ${vendorType === 'services' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-background hover:border-primary/40'}`}>
                    <span className={`mb-4 grid h-10 w-10 place-items-center rounded-xl ${vendorType === 'services' ? 'bg-primary text-white' : 'bg-surface-muted text-text-secondary'}`}><Wrench className="h-5 w-5" /></span>
                    <span className="block text-sm font-semibold text-text-primary">Offer services</span>
                    <span className="mt-1 block text-xs leading-5 text-text-secondary">Design, repairs, photography, tutoring and skills.</span>
                    <span className={`mt-4 block text-xs font-semibold ${vendorType === 'services' ? 'text-primary' : 'text-text-tertiary'}`}>{vendorType === 'services' ? 'Selected' : 'Choose services'}</span>
                  </button>
                  <button type="button" onClick={() => setVendorType('both')} aria-pressed={vendorType === 'both'} className={`group rounded-xl border p-4 text-left transition-all ${vendorType === 'both' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-background hover:border-primary/40'}`}>
                    <span className={`mb-4 grid h-10 w-10 place-items-center rounded-xl ${vendorType === 'both' ? 'bg-primary text-white' : 'bg-surface-muted text-text-secondary'}`}><span className="text-lg font-semibold">+</span></span>
                    <span className="block text-sm font-semibold text-text-primary">Both</span>
                    <span className="mt-1 block text-xs leading-5 text-text-secondary">Run a store and offer services under one business.</span>
                    <span className={`mt-4 block text-xs font-semibold ${vendorType === 'both' ? 'text-primary' : 'text-text-tertiary'}`}>{vendorType === 'both' ? 'Selected' : 'Choose both'}</span>
                  </button>
                </div>
              </fieldset>

              <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-sm text-xs leading-5 text-text-tertiary">Your location, fulfilment options and verification settings can be completed from your workspace.</p>
                <Button type="submit" disabled={submitting} className="sm:min-w-40">{submitting ? 'Setting up…' : 'Continue'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
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
              <div className="rounded-xl border border-border bg-surface-muted/40 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">Your business</p>
                <p className="mt-1 font-semibold text-text-primary">{storeForm.store_name}</p>
                <p className="mt-1 break-all text-xs text-text-secondary">kamba.ng/{storeForm.slug || 'your-business-name'}</p>
                <p className="mt-2 text-xs text-text-tertiary">This is the same business identity customers will see across your Store and Services.</p>
              </div>
              <fieldset className="space-y-4 rounded-xl border border-border p-4">
                <legend className="px-1 text-sm font-semibold text-text-primary">What do you sell?</legend>
                <label className="block text-sm font-medium text-text-secondary">Product category<select value={storeForm.category} onChange={(event) => updateStore('category', event.target.value)} required className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary"><option value="">Choose a category</option><option value="Electronics & Gadgets">Electronics & Gadgets</option><option value="Fashion & Clothing">Fashion & Clothing</option><option value="Beauty & Personal Care">Beauty & Personal Care</option><option value="Food & Groceries">Food & Groceries</option><option value="Home & Living">Home & Living</option><option value="Health & Wellness">Health & Wellness</option><option value="Books & Stationery">Books & Stationery</option><option value="Sports & Fitness">Sports & Fitness</option><option value="Automotive">Automotive</option><option value="Home Services">Home Services</option><option value="Repairs & Maintenance">Repairs & Maintenance</option><option value="Professional Services">Professional Services</option><option value="Education & Tutoring">Education & Tutoring</option><option value="Events & Photography">Events & Photography</option><option value="Other">Other</option></select></label>
                {storeForm.category === 'Other' && <Input label="Your category" value={storeForm.custom_category} onChange={(event) => updateStore('custom_category', event.target.value)} required maxLength={100} placeholder="Enter your product category" />}
                <label className="block text-sm font-medium text-text-secondary">Description<textarea value={storeForm.description} onChange={(event) => updateStore('description', event.target.value)} required rows={3} className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary" /></label>
              </fieldset>
              <Button type="submit" disabled={submitting}>{submitting ? 'Creating store…' : 'Create storefront'}</Button>
            </form>
          </CardContent></Card>

          <aside className="overflow-hidden rounded-2xl bg-[#171a16] text-[#f6f2e9] shadow-xl xl:sticky xl:top-24">
            <div className="border-b border-white/15 px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">Your storefront preview</p>
              <p className="mt-1 text-xs text-white/70">This is how customers will first see your business.</p>
            </div>
            <div className="flex min-h-[310px] flex-col justify-end bg-[radial-gradient(ellipse_at_80%_15%,#77715e_0%,#343b31_42%,#171a16_80%)] p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d5c39b]">{storeForm.category || 'Independent store'}</p>
              <p className="mt-4 font-serif font-normal leading-[0.94] tracking-tight text-white" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.6rem)' }}>{storeForm.store_name || 'Your store name'}</p>
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/70">{storeForm.description || 'A short introduction to what makes your store worth discovering.'}</p>
              <div className="mt-8 border-t border-white/20 pt-4">
                <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/50">Business link preview</p>
                <p className="mt-2 break-all text-sm font-medium text-white">kamba.ng/{previewStoreSlug}</p>
              </div>
            </div>
            <div className="px-5 py-4 text-xs leading-5 text-white/60">After creating your store, upload a cover image from Storefront settings to complete the editorial look.</div>
          </aside>
        </div>
      )}

      {stage === 'profile_setup' && needsService && (
        <Card variant="elevated"><CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5 text-primary" /> Create your service profile</CardTitle></CardHeader><CardContent>
          <form onSubmit={createService} className="space-y-4">
            <fieldset className="space-y-4 rounded-xl border border-border p-4">
              <legend className="px-1 text-sm font-semibold text-text-primary">Service details and fulfilment</legend>
              <div className="rounded-lg border border-border bg-surface-muted/40 p-3"><p className="text-xs text-text-tertiary">One business identity</p><p className="mt-1 font-semibold text-text-primary">{storeForm.store_name}</p><p className="mt-1 break-all text-xs text-text-secondary">kamba.ng/{storeForm.slug || 'your-business-name'}</p></div>
              {vendorType === 'both' && <p className="text-xs leading-5 text-text-tertiary">Your business name is the same as the storefront name you entered earlier. This field names the service you offer, not a second business. The service URL is generated from your shared business name.</p>}
            <div className="space-y-1"><label className="text-sm font-medium text-text-secondary">Public URL slug</label><Input value={serviceForm.slug || 'your-business-name'} readOnly aria-readonly="true" /><p className="text-xs text-text-tertiary">Generated automatically from your business name.</p></div>
            <label className="block text-sm font-medium text-text-secondary">Service category<select value={serviceForm.category} onChange={(event) => updateService('category', event.target.value)} required className="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-text-primary"><option value="">Choose a category</option><option value="Electronics & Gadgets">Electronics & Gadgets</option><option value="Fashion & Clothing">Fashion & Clothing</option><option value="Beauty & Personal Care">Beauty & Personal Care</option><option value="Food & Groceries">Food & Groceries</option><option value="Home & Living">Home & Living</option><option value="Health & Wellness">Health & Wellness</option><option value="Books & Stationery">Books & Stationery</option><option value="Sports & Fitness">Sports & Fitness</option><option value="Automotive">Automotive</option><option value="Home Services">Home Services</option><option value="Repairs & Maintenance">Repairs & Maintenance</option><option value="Professional Services">Professional Services</option><option value="Education & Tutoring">Education & Tutoring</option><option value="Events & Photography">Events & Photography</option><option value="Other">Other</option></select></label>
            {serviceForm.category === 'Other' && <Input label="Your category" value={serviceForm.custom_category} onChange={(event) => updateService('custom_category', event.target.value)} required maxLength={100} placeholder="Enter your service category" />}
            <label className="block text-sm font-medium text-text-secondary">Description<textarea value={serviceForm.description} onChange={(event) => updateService('description', event.target.value)} required rows={3} className="mt-2 w-full rounded-lg border border-border bg-surface px-3 py-2 text-text-primary" /></label>
            <Input label="Price range or starting price" value={serviceForm.price_range} onChange={(event) => updateService('price_range', event.target.value)} placeholder="e.g. From ₦15,000" />
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
                        <p className="text-xs leading-5 text-text-tertiary">Customers can call or send an SMS to your account phone number after it has been verified by SMS. WhatsApp verification is not enabled.</p>
            </fieldset>
            <Button type="submit" disabled={submitting}>{submitting ? 'Creating service…' : 'Create service profile'}</Button>
          </form>
        </CardContent></Card>
      )}

      {stage === 'complete' && (
        <Card variant="elevated"><CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> Your business setup is ready</CardTitle></CardHeader><CardContent className="space-y-4">
          <Badge variant="success">Business profile created</Badge>
          <p className="text-sm leading-6 text-text-secondary">{vendorType === 'both' ? 'Your Store and Services profiles are ready under one business identity.' : vendorType === 'services' ? 'Your Services profile is ready. You can add a Store later without creating another business account.' : 'Your Store profile is ready. You can add Services later without creating another business account.'} Continue to your workspace to finish your public profile and start adding your first products or work.</p>
          
          <div className="rounded-lg border border-border p-4">
            <h3 className="font-semibold text-text-primary">Add your business branding</h3>
            <p className="mt-1 text-sm leading-6 text-text-secondary">Use a business cover photo or logo instead of uploading photos of your physical location. You can add both, and choose to reuse the same image for both, from Business settings.</p>
            <Button type="button" variant="outline" onClick={() => router.push('/vendor/profile?section=business')}>Set up cover photo and logo</Button>
          </div>
          <Button onClick={() => router.push('/vendor/dashboard')}>Go to vendor dashboard</Button>
        </CardContent></Card>
      )}
    </div>
  )
}
