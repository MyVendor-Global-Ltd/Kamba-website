'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDistance } from '@/lib/haversine'
import { apiJson } from '@/lib/api'
import type { Store } from '@/types/vendor'
import { StoreCardSkeleton } from '@/components/ui/skeleton'

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiJson<{ stores: Array<Store & { store_name?: string; location_text?: string; vendor_profiles?: { is_verified?: boolean; verification_tier?: string } }> }>('/vendors/stores')
      .then((data) => {
        setStores((data.stores || []).map((store) => {
          const tier = store.vendor_profiles?.verification_tier
          const verificationStatus: Store['verification_status'] = store.verification_status || (store.vendor_profiles?.is_verified ? (tier === 'business' ? 'business' : tier === 'nin' ? 'nin' : 'basic') : 'pending')
          return { ...store, name: store.name || store.store_name || 'Local store', city: store.city || store.location_text, vendor_id: store.vendor_id || '', is_active: store.is_active ?? true, created_at: store.created_at || '', updated_at: store.updated_at || '', verification_status: verificationStatus }
        }))
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Failed to load stores')
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
            <StoreCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8">
      <header className="animate-fade-in">
        <h1 className="text-3xl lg:text-4xl font-bold font-display text-text-primary">Stores</h1>
        <p className="text-text-secondary mt-2">Browse local shops near you</p>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-slide-up">
          {error}
        </div>
      )}

      <div className="marketplace-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" style={{ animationDelay: '100ms' }}>
        {stores.map((store) => (
          <Card data-scroll-reveal key={store.id} variant="elevated" className="h-full group">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-text-primary group-hover:text-coral transition-colors">{store.name}</CardTitle>
                {store.distance_km !== undefined && (
                  <Badge variant="outline" size="sm">
                    {formatDistance(store.distance_km)}
                  </Badge>
                )}
              </div>
              {store.verification_status !== 'pending' && (
                <Badge variant="verification" size="sm" className="mt-2">
                  {store.verification_status === 'business' ? 'Business Verified' : 
                   store.verification_status === 'nin' ? 'NIN Verified' : 'Basic Verified'}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="pb-2">
              {store.description && (
                <p className="text-sm text-text-tertiary line-clamp-3 mb-4">{store.description}</p>
              )}
              {(store.city || store.state) && (
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <svg className="w-3.5 h-3.5 text-coral/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{[store.city, store.state].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              <Link href={`/store/${store.slug}`}>
                <Button variant="outline" className="w-full group-hover:border-coral group-hover:text-coral transition-colors">
                  View store
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}

        {stores.length === 0 && (
          <div className="col-span-full text-center py-16">
            <div className="w-16 h-16 rounded-full bg-ink-raised/50 flex items-center justify-center mx-auto mb-4 text-text-tertiary">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">No stores found</h3>
            <p className="text-text-tertiary">Check back soon for new vendors in your area.</p>
          </div>
        )}
      </div>
    </div>
  )
}
