'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { isMockMode, submitMockVendorApplication } from '@/lib/mock-api'
import { LiveVendorOnboarding } from '@/components/vendor/live-vendor-onboarding'
import { Store, Wrench } from 'lucide-react'

function MockVendorOnboardPage() {
  const router = useRouter()
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState<'products' | 'services' | 'both'>('products')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const businessSlug = businessName.toLowerCase().normalize('NFKD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (!isMockMode) {
        throw new Error('The simplified demo form is available only in local mock mode.')
      }
      submitMockVendorApplication({ business_name: businessName, business_type: businessType })
      router.push('/vendor/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Onboarding failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-3xl space-y-6 px-4 py-8 lg:py-12">
      <header className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Kamba for business · Demo</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">Bring your business to Kamba.</h1>
        <p className="max-w-xl text-sm leading-6 text-text-secondary sm:text-base">Create one business identity. Sell products, offer services, or do both — you can add more later without starting over.</p>
      </header>

      <Card variant="elevated" className="overflow-hidden">
        <CardHeader className="space-y-2 border-b border-border/70 bg-surface-muted/40 px-5 py-5 sm:px-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Step 1 · Your business</p>
          <CardTitle className="font-display text-2xl">Let's get your business set up</CardTitle>
          <CardDescription>Start with the basics. You can complete location, fulfilment and verification details from your workspace.</CardDescription>
        </CardHeader>
        <CardContent className="px-5 py-6 sm:px-7">
          {error && <p role="alert" className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Input label="Business name" placeholder="e.g. The Campus Closet" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required maxLength={160} />
              <div className="rounded-xl border border-border bg-background px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">Business link preview</p>
                <p className="mt-1 break-all text-sm font-semibold text-text-primary">kamba.ng/{businessSlug || 'your-business-name'}</p>
                <p className="mt-1 text-xs leading-5 text-text-tertiary">A clean link using your business name — no extra prefix.</p>
              </div>
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-text-primary">What do you want to offer on Kamba?</legend>
              <p className="text-xs leading-5 text-text-secondary">Choose what fits your business today. You can enable the other option later.</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <button type="button" onClick={() => setBusinessType('products')} aria-pressed={businessType === 'products'} className={`rounded-xl border p-4 text-left transition-all ${businessType === 'products' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-background hover:border-primary/40'}`}>
                  <span className={`mb-4 grid h-10 w-10 place-items-center rounded-xl ${businessType === 'products' ? 'bg-primary text-white' : 'bg-surface-muted text-text-secondary'}`}><Store className="h-5 w-5" /></span>
                  <span className="block text-sm font-semibold text-text-primary">Sell products</span>
                  <span className="mt-1 block text-xs leading-5 text-text-secondary">Clothing, food, gadgets and things people can buy.</span>
                  <span className={`mt-4 block text-xs font-semibold ${businessType === 'products' ? 'text-primary' : 'text-text-tertiary'}`}>{businessType === 'products' ? 'Selected' : 'Choose products'}</span>
                </button>
                <button type="button" onClick={() => setBusinessType('services')} aria-pressed={businessType === 'services'} className={`rounded-xl border p-4 text-left transition-all ${businessType === 'services' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-background hover:border-primary/40'}`}>
                  <span className={`mb-4 grid h-10 w-10 place-items-center rounded-xl ${businessType === 'services' ? 'bg-primary text-white' : 'bg-surface-muted text-text-secondary'}`}><Wrench className="h-5 w-5" /></span>
                  <span className="block text-sm font-semibold text-text-primary">Offer services</span>
                  <span className="mt-1 block text-xs leading-5 text-text-secondary">Design, repairs, photography, tutoring and skills.</span>
                  <span className={`mt-4 block text-xs font-semibold ${businessType === 'services' ? 'text-primary' : 'text-text-tertiary'}`}>{businessType === 'services' ? 'Selected' : 'Choose services'}</span>
                </button>
                <button type="button" onClick={() => setBusinessType('both')} aria-pressed={businessType === 'both'} className={`rounded-xl border p-4 text-left transition-all ${businessType === 'both' ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-background hover:border-primary/40'}`}>
                  <span className={`mb-4 grid h-10 w-10 place-items-center rounded-xl ${businessType === 'both' ? 'bg-primary text-white' : 'bg-surface-muted text-text-secondary'}`}><span className="text-lg font-semibold">+</span></span>
                  <span className="block text-sm font-semibold text-text-primary">Both</span>
                  <span className="mt-1 block text-xs leading-5 text-text-secondary">Run a store and offer services under one business.</span>
                  <span className={`mt-4 block text-xs font-semibold ${businessType === 'both' ? 'text-primary' : 'text-text-tertiary'}`}>{businessType === 'both' ? 'Selected' : 'Choose both'}</span>
                </button>
              </div>
            </fieldset>

            <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-sm text-xs leading-5 text-text-tertiary">This is a local demo. It stores a sample application in your browser only.</p>
              <Button type="submit" disabled={loading || !businessName.trim()} className="sm:min-w-40">{loading ? 'Setting up…' : 'Continue'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VendorOnboardPage() {
  if (!isMockMode) return <LiveVendorOnboarding />
  return <MockVendorOnboardPage />
}
