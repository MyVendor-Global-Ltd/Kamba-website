'use client'

import Link from 'next/link'
import { useEffect, useMemo } from 'react'
import { isMockMode } from '@/lib/mock-api'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ServiceCardSkeleton } from '@/components/ui/skeleton'
import { ProductFilters } from '@/components/marketplace/product-filters'
import { useServiceSearch } from '@/hooks/useServiceSearch'
import { Search, Filter, Briefcase, MapPin } from 'lucide-react'

export default function ServicesPage() {
  const {
    services,
    loading,
    error,
    filters,
    setFilters,
    clearFilters,
    hasActiveFilters,
    pagination,
    loadMore,
    hasMore,
    refresh,
  } = useServiceSearch({ pageSize: 100 })

  const categories = ['Cleaning', 'Repairs', 'Plumbing', 'Electrical', 'Beauty', 'Tutoring', 'Delivery', 'Photography']
  const visibleServices = useMemo(() => services.filter((service) => {
    const query = filters.query.trim().toLowerCase()
    const location = filters.location.trim().toLowerCase()
    const serviceText = `${service.name} ${service.description || ''} ${service.category || ''}`.toLowerCase()
    const serviceLocation = `${service.city || ''} ${service.state || ''}`.toLowerCase()
    return (!query || serviceText.includes(query)) && (!location || serviceLocation.includes(location))
  }), [services, filters.query, filters.location])

  // Load more on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMore])

  if (loading && services.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-4">
            <div className="h-10 w-1/3 bg-ink-raised/50 rounded-lg animate-pulse" />
            <div className="h-6 w-1/2 bg-ink-raised/50 rounded-lg animate-pulse" />
          </div>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold font-display text-text-primary">Services</h1>
            <p className="text-text-secondary mt-2">Book local services from verified vendors</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => refresh()} disabled={loading}>
              <Briefcase className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="search"
            placeholder="Search services, providers, categories..."
            value={filters.query}
            onChange={(e) => setFilters({ query: e.target.value })}
            className="w-full flex h-12 pl-12 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary"
          />
        </div>
      </header>

      {!isMockMode && (filters.query.trim() || filters.location.trim()) && (
        <p role="status" className="rounded-lg border border-gold-dim bg-gold-soft px-4 py-3 text-sm text-text-primary">
          Keyword and city filters search the first 100 live service listings returned by the API. Category and nearby-coordinate filters are applied by the backend. Full server-side text search still requires a backend search contract.
        </p>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-slide-up">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Filters Sidebar */}
        <ProductFilters
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories}
          mode='services'
          showSearch={false}
          onClearAll={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Services Grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-text-secondary">
              {filters.query.trim() || filters.location.trim() ? `${visibleServices.length} matching in ${services.length} loaded` : `${pagination.total} service${pagination.total !== 1 ? 's' : ''} found`}
            </p>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <Filter className="w-3.5 h-3.5 mr-1.5" />
                Clear filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            {visibleServices.map((service) => (
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
                  {(service.city || service.state) && (
                    <div className="flex items-center gap-2 text-xs text-text-tertiary">
                      <MapPin className="w-3.5 h-3.5 text-coral/50" />
                      <span>{[service.city, service.state].filter(Boolean).join(', ')}</span>
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

            {visibleServices.length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className="w-16 h-16 rounded-full bg-ink-raised/50 flex items-center justify-center mx-auto mb-4 text-text-tertiary">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 7v3m0-7h3m-3 0H7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No services found</h3>
                <p className="text-text-tertiary">Try adjusting your filters or search terms.</p>
              </div>
            )}
          </div>

          {/* Load More / Pagination */}
          {hasMore && (
            <div className="mt-8 text-center">
              <Button variant="outline" size="lg" onClick={loadMore} disabled={loading} className="w-full sm:w-auto">
                {loading ? 'Loading...' : `Load more (${services.length} of ${pagination.total})`}
              </Button>
            </div>
          )}

          {!hasMore && services.length > 0 && pagination.totalPages > 1 && (
            <div className="mt-8 text-center text-sm text-text-tertiary">
              Showing all {pagination.total} services
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
