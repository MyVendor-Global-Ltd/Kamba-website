'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
      <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8 animate-fade-in">
        <div className="space-y-4 animate-pulse">
          <div className="h-10 w-1/3 bg-ink-raised/50 rounded-lg" />
          <div className="h-6 w-1/2 bg-ink-raised/50 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card variant="elevated">
            <CardHeader>
              <div className="h-6 w-1/4 bg-ink-raised/50 rounded" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-4 w-full bg-ink-raised/50 rounded" />
              <div className="h-4 w-3/4 bg-ink-raised/50 rounded" />
              <div className="h-4 w-1/2 bg-ink-raised/50 rounded" />
              <div className="h-4 w-2/3 bg-ink-raised/50 rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-8 lg:py-12 flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-ink-raised/50 flex items-center justify-center mx-auto mb-4 text-text-tertiary">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 7v3m0-7h3m-3 0H7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Service not found</h2>
          <p className="text-text-tertiary">The service you're looking for doesn't exist or has been removed.</p>
          <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
            Back to services
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8">
      <header className="animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold font-display text-text-primary">{service.name}</h1>
            <p className="text-text-secondary mt-2">{service.description || 'No description available'}</p>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {service.verification_status !== 'pending' && (
                <Badge variant="verification" size="md">
                  {service.verification_status === 'business' ? 'Business Verified' : 
                   service.verification_status === 'nin' ? 'NIN Verified' : 'Basic Verified'}
                </Badge>
              )}
              {service.category && (
                <Badge variant="secondary" size="sm">
                  {service.category}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-slide-up">
          {error}
        </div>
      )}

      <section className="animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-text-primary">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {service.category && (
                <div className="flex justify-between items-center py-2 border-b border-ink-raised/30">
                  <span className="text-sm text-text-tertiary">Category</span>
                  <span className="font-medium text-text-primary">{service.category}</span>
                </div>
              )}
              {service.city && service.state && (
                <div className="flex justify-between items-center py-2 border-b border-ink-raised/30">
                  <span className="text-sm text-text-tertiary">Location</span>
                  <span className="font-medium text-text-primary">{service.city}, {service.state}</span>
                </div>
              )}
              {service.phone && (
                <div className="flex justify-between items-center py-2 border-b border-ink-raised/30">
                  <span className="text-sm text-text-tertiary">Phone</span>
                  <a href={`tel:${service.phone}`} className="font-medium text-coral hover:text-coral/80 transition-colors">
                    {service.phone}
                  </a>
                </div>
              )}
              {service.email && (
                <div className="flex justify-between items-center py-2 border-b border-ink-raised/30">
                  <span className="text-sm text-text-tertiary">Email</span>
                  <a href={`mailto:${service.email}`} className="font-medium text-coral hover:text-coral/80 transition-colors">
                    {service.email}
                  </a>
                </div>
              )}
              {service.address && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-text-tertiary">Address</span>
                  <span className="font-medium text-text-primary text-right max-w-[60%]">{service.address}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle className="text-text-primary">Contact & Book</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-text-secondary text-sm">
                Ready to book this service? Get in touch with the provider directly.
              </p>
              <div className="flex flex-col gap-3 pt-2">
                {service.phone && (
                  <a href={`tel:${service.phone}`}>
                    <Button variant="default" className="w-full justify-start gap-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>Call {service.phone}</span>
                    </Button>
                  </a>
                )}
                {service.email && (
                  <a href={`mailto:${service.email}`}>
                    <Button variant="outline" className="w-full justify-start gap-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Email provider</span>
                    </Button>
                  </a>
                )}
                {!service.phone && !service.email && (
                  <Button variant="outline" className="w-full justify-start gap-3" disabled>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>No contact info available</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
