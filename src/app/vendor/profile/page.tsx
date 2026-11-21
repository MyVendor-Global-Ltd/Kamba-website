'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiJson } from '@/lib/api'

export default function VendorProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiJson<{ store: any }>('/vendors/profile')
      .then((data) => {
        setProfile(data.store)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load profile')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">No vendor profile found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vendor Profile</h1>
        <p className="text-muted-foreground">Manage your business details.</p>
      </div>

      {error && (
        <div className="p-4 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{profile.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Business name</label>
              <Input value={profile.name || ''} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Verification status</label>
              <Input value={profile.verification_status || 'pending'} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input value={profile.phone || ''} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={profile.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Input value={profile.address || ''} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <Input value={profile.city || ''} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">State</label>
              <Input value={profile.state || ''} disabled />
            </div>
          </div>
          <Button className="w-full">Edit profile</Button>
        </CardContent>
      </Card>
    </div>
  )
}
