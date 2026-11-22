'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { apiJson } from '@/lib/api'
import { ServiceProfile } from '@/types/vendor'
import { ServiceCardSkeleton } from '@/components/ui/skeleton'

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
      <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8 animate-fade-in">
        <div className="space-y-4">
          <div className="h-10 w-1/3 bg-ink-raised/50 rounded-lg animate-pulse" />
          <div className="h-6 w-1/2 bg-ink-raised/50 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8">
      <header className="animate-fade-in">
        <h1 className="text-3xl lg:text-4xl font-bold font-display text-text-primary">Services</h1>
        <p className="text-text-secondary mt-2">Book local services from verified vendors</p>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-slide-up">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        {services.map((service) => (
          <Card key={service.id} variant="elevated" className="h-full group">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-text-primary group-hover:text-coral transition-colors">{service.name}</CardTitle>
                {service.category && (
                  <Badge variant="secondary" size="sm">
                    {service.category}
                  </Badge>
                )}
              </div>
              {service.verification_status !== 'pending' && (
                <Badge variant="verification" size="sm" className="mt-2">
                  {service.verification_status === 'business' ? 'Business Verified' : 
                   service.verification_status === 'nin' ? 'NIN Verified' : 'Basic Verified'}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="pb-2">
              {service.description && (
                <p className="text-sm text-text-tertiary line-clamp-3 mb-4">{service.description}</p>
              )}
              {service.city && service.state && (
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <svg className="w-3.5 h-3.5 text-coral/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{service.city}, {service.state}</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              <Link href={`/marketplace/services/${service.slug}`}>
                <Button variant="outline" className="w-full group-hover:border-coral group-hover:text-coral transition-colors">
                  View service
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}

        {services.length === 0 && (
          <div className="col-span-full text-center py-16">
            <div className="w-16 h-16 rounded-full bg-ink-raised/50 flex items-center justify-center mx-auto mb-4 text-text-tertiary">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 7v3m0-7h3m-3 0H7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No services found</h3>
            <p className="text-text-tertiary">Check back soon for new service providers in your area.</p>
          </div>
        )}
      </div>
    </div>
  )
}
