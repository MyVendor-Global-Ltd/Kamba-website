'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiJson } from '@/lib/api'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiJson<{ vendors: any[] }>('/admin/vendors')
      .then((data) => {
        setVendors(data.vendors || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load vendors')
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vendor Management</h1>
        <p className="text-muted-foreground">Review and verify vendor applications.</p>
        <div className="mt-4"><Button asChild variant="outline"><Link href="/admin/service-payment-disputes">Service payment disputes</Link></Button></div>
      </div>

      {error && (
        <div className="p-4 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {vendors.map((vendor) => (
          <Card key={vendor.id}>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold">{vendor.business_name || vendor.name}</h4>
                  <p className="text-sm text-muted-foreground">{vendor.email || vendor.phone}</p>
                </div>
                <Badge variant={vendor.verification_status === 'business' ? 'default' : 'outline'} className="text-sm">
                  {vendor.verification_status}
                </Badge>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 py-2 border rounded text-sm text-primary hover:underline">Review</button>
                <button className="flex-1 py-2 border rounded text-sm text-destructive hover:bg-destructive/10">Reject</button>
              </div>
            </CardContent>
          </Card>
        ))}
        {vendors.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No vendors found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
