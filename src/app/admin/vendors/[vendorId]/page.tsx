'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiJson } from '@/lib/api'

export default function AdminVendorDetailPage() {
  const params = useParams()
  const vendorId = params.vendorId as string
  const [vendor, setVendor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiJson<{ vendor: any }>(`/admin/vendors/${vendorId}`)
      .then((data) => {
        setVendor(data.vendor)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load vendor')
        setLoading(false)
      })
  }, [vendorId])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!vendor) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Vendor not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vendor Details</h1>
        <p className="text-muted-foreground">Review vendor application.</p>
      </div>

      {error && (
        <div className="p-4 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{vendor.business_name || vendor.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Business type</label>
              <p className="font-medium">{vendor.business_type}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Verification status</label>
              <Badge variant={vendor.verification_status === 'business' ? 'default' : 'outline'}>
                {vendor.verification_status}
              </Badge>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <p className="font-medium">{vendor.email}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <p className="font-medium">{vendor.phone}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <p className="font-medium">{vendor.address}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <p className="font-medium">{vendor.city}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">State</label>
              <p className="font-medium">{vendor.state}</p>
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <button className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90">
              Approve
            </button>
            <button className="flex-1 py-3 border border-destructive text-destructive rounded-lg font-medium hover:bg-destructive/10">
              Reject
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
