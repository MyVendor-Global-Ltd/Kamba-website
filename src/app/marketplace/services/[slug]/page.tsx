'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiJson } from '@/lib/api'
import { ServiceProfile } from '@/types/vendor'

export default function ServiceDetailPage() {
  const params = useParams()
  const slug = params.slug as string
  const [service, setService] = useState<ServiceProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiJson<{ service: ServiceProfile }>(`/vendors/services/${slug}`)
      .then((data) => {
        setService(data.service)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load service')
        setLoading(false)
      })
  }, [slug])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Service not found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{service.name}</h1>
          <p className="text-muted-foreground">{service.description || 'No description available'}</p>
        </div>
        <Badge variant={service.verification_status === 'business' ? 'default' : 'outline'}>
          {service.verification_status}
        </Badge>
      </div>

      {error && (
        <div className="p-4 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {service.category && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="font-medium">{service.category}</span>
              </div>
            )}
            {service.city && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">City</span>
                <span className="font-medium">{service.city}</span>
              </div>
            )}
            {service.state && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">State</span>
                <span className="font-medium">{service.state}</span>
              </div>
            )}
            {service.phone && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Phone</span>
                <span className="font-medium">{service.phone}</span>
              </div>
            )}
            {service.email && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Email</span>
                <span className="font-medium">{service.email}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
