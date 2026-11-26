'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { apiJson } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface BusinessProfile {
  business_name?: string | null
  business_slug?: string | null
  location_mode?: string | null
  location_text?: string | null
  service_area_text?: string | null
  online_url?: string | null
}

interface VendorStore {
  store_name?: string | null
  slug?: string | null
  category?: string | null
  business_profiles?: BusinessProfile | null
}

interface VendorService {
  service_title?: string | null
  slug?: string | null
  category?: string | null
  business_profiles?: BusinessProfile | null
}

interface VendorProfile {
  id: string
  vendor_type: 'products' | 'services' | 'both'
  verification_tier?: string | null
  is_active?: boolean
  is_banned?: boolean
  contact_whatsapp?: string | null
  contact_phone?: string | null
  stores?: VendorStore[] | VendorStore | null
  service_profiles?: VendorService[] | VendorService | null
}

function first<T>(value: T[] | T | null | undefined): T | null {
  return Array.isArray(value) ? value[0] || null : value || null
}

export default function VendorProfilePage() {
  const [profile, setProfile] = useState<VendorProfile | null>(null)
  const [whatsapp, setWhatsapp] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiJson<{ vendor_profile: VendorProfile }>('/vendors/profile')
      if (!data.vendor_profile?.id) throw new Error('The server did not return your vendor profile.')
      setProfile(data.vendor_profile)
      setWhatsapp(data.vendor_profile.contact_whatsapp || '')
      setPhone(data.vendor_profile.contact_phone || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your vendor profile.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadProfile() }, [loadProfile])

  const saveContacts = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const data = await apiJson<{ vendor_profile: VendorProfile }>('/vendors/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          contact_whatsapp: whatsapp.trim() || null,
          contact_phone: phone.trim() || null,
        }),
      })
      if (!data.vendor_profile?.id) throw new Error('The server did not confirm the profile update.')
      setProfile(data.vendor_profile)
      setWhatsapp(data.vendor_profile.contact_whatsapp || '')
      setPhone(data.vendor_profile.contact_phone || '')
      setSuccess('Your vendor contact details have been saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your contact details.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="container mx-auto max-w-4xl px-4 py-12"><div className="h-64 animate-pulse rounded-xl bg-surface-muted" /></div>
  }

  if (!profile) {
    return (
      <div className="container mx-auto max-w-4xl space-y-4 px-4 py-12">
        <h1 className="font-display text-3xl font-bold text-text-primary">Vendor profile</h1>
        <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error || 'No vendor profile was returned.'}</p>
        <Button variant="outline" onClick={() => void loadProfile()}>Retry</Button>
      </div>
    )
  }

  const store = first(profile.stores)
  const service = first(profile.service_profiles)
  const business = store?.business_profiles || service?.business_profiles
  const businessName = business?.business_name || store?.store_name || service?.service_title || 'Your business'
  const verification = profile.is_banned ? 'Restricted' : profile.verification_tier || 'pending'

  return (
    <div className="container mx-auto max-w-4xl space-y-6 px-4 py-8 lg:py-12">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Vendor workspace</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-text-primary">Business settings</h1>
        <p className="mt-2 text-sm text-text-secondary">Manage your business identity, storefront, service listing, pickup details and payout account from one place.</p>
      </header>

      {error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
      {success && <p role="status" className="rounded-lg bg-secondary p-4 text-sm text-secondary-foreground">{success}</p>}

      <Card variant="outlined">
        <CardHeader><CardTitle>{businessName}</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div><p className="text-xs text-text-tertiary">Vendor type</p><p className="mt-1 font-medium capitalize text-text-primary">{profile.vendor_type}</p></div>
          <div><p className="text-xs text-text-tertiary">Verification status</p><p className="mt-1 font-medium capitalize text-text-primary">{verification.replaceAll('_', ' ')}</p></div>
          <div><p className="text-xs text-text-tertiary">Account status</p><p className="mt-1 font-medium text-text-primary">{profile.is_banned ? 'Restricted' : profile.is_active ? 'Active' : 'Inactive'}</p></div>
          <div><p className="text-xs text-text-tertiary">Business location</p><p className="mt-1 font-medium text-text-primary">{business?.location_text || business?.service_area_text || business?.online_url || 'Not provided'}</p></div>
          {store && <div className="space-y-1"><p className="text-xs text-text-tertiary">Storefront</p><p className="font-medium text-text-primary">{store.store_name}</p>{store.category && <p className="text-sm text-text-secondary">{store.category}</p>}{store.slug && <Link className="text-sm text-primary underline" href={`/store/${store.slug}`}>View public store</Link>}</div>}
          {service && <div className="space-y-1"><p className="text-xs text-text-tertiary">Service profile</p><p className="font-medium text-text-primary">{service.service_title}</p>{service.category && <p className="text-sm text-text-secondary">{service.category}</p>}{service.slug && <Link className="text-sm text-primary underline" href={`/marketplace/services/${service.slug}`}>View public service page</Link>}</div>}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader><CardTitle>Business workspace</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {store && <Link href="/vendor/store" className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white">Edit business and pickup details</Link>}
          {service && <Link href="/vendor/service" className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-white">Edit service details</Link>}
          <Link href="/vendor/pickup" className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold text-text-primary">Pickup desk</Link>
          <Link href="/vendor/payments" className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold text-text-primary">Payouts and bank account</Link>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader><CardTitle>Business contact details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={saveContacts} className="space-y-4">
            <Input label="Business WhatsApp number" type="tel" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} placeholder="+234…" />
            <Input label="Business phone number" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+234…" />
            <p className="text-xs text-text-tertiary">These are your vendor contact details. They do not change the phone number or verification status on your personal Kamba account.</p>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save contact details'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
