'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { isMockMode, submitMockVendorApplication } from '@/lib/mock-api'

function MockVendorOnboardPage() {
  const router = useRouter()
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState<'products' | 'services' | 'both'>('products')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (!isMockMode) {
        throw new Error('The production onboarding process is multi-step and includes eligibility/status checks and liveness evidence before store or service creation. This simplified form does not collect that evidence, so it is available as a local prototype only; it will not change a real account or vendor role.')
      }
      submitMockVendorApplication({ business_name: businessName, business_type: businessType, phone, email, address, city, state })
      router.push('/vendor/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Onboarding failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Vendor onboarding</CardTitle>
        <CardDescription>Register your business to sell products or services.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm border border-destructive/20">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Business name</label>
            <Input
              placeholder="My Store"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Business type</label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value as 'products' | 'services' | 'both')}
              className="flex h-10 w-full rounded-medium border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="products">Products only</option>
              <option value="services">Services only</option>
              <option value="both">Both products and services</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone number</label>
            <Input
              type="tel"
              placeholder="+234 801 234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email address</label>
            <Input
              type="email"
              placeholder="business@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <Input
              placeholder="123 Street, Lagos"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <Input
                placeholder="Lagos"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">State</label>
              <Input
                placeholder="Lagos"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Onboarding...' : 'Complete onboarding'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}


export default function VendorOnboardPage() {
  if (!isMockMode) return <LiveVendorOnboarding />
  return <MockVendorOnboardPage />
}
