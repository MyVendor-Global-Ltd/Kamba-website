'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiJson } from '@/lib/api'
import { ServiceProfile } from '@/types/vendor'

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiJson<{ services: ServiceProfile[] }>('/vendors/services')
      .then((data) => {
        setServices(data.services || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load services')
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
        <h1 className="text-3xl font-bold">Services</h1>
        <p className="text-muted-foreground">Book local services from verified vendors</p>
      </div>

      {error && (
        <div className="p-4 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.id}>
            <CardHeader>
              <CardTitle>{service.name}</CardTitle>
              {service.category && <Badge variant="outline" className="text-xs">{service.category}</Badge>}
            </CardHeader>
            <CardContent className="space-y-4">
              {service.description && <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {service.city && <span>{service.city}</span>}
                {service.state && <span>{service.state}</span>}
              </div>
              <Link href={`/marketplace/services/${service.slug}`} className="w-full">
                <button className="w-full py-2 border rounded-lg text-sm font-medium hover:bg-accent">
                  View service
                </button>
              </Link>
            </CardContent>
          </Card>
        ))}
        {services.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No services found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
