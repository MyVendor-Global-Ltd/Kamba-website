'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiJson } from '@/lib/api'
import type { Product } from '@/types/commerce'
import type { StoreProfile, ServiceProfile } from '@/types/vendor'
import { isMockMode } from '@/lib/mock-api'
import { formatKobo } from '@/lib/formatting'
import { StoreCardSkeleton, ServiceCardSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { Search, X, Store, Briefcase, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

type SearchStore = StoreProfile & { has_matching_products?: boolean; matching_products: Product[] }

interface SearchResult {
  products: Product[]
  stores: SearchStore[]
  services: ServiceProfile[]
  total: number
}

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [activeTab, setActiveTab] = useState<'all' | 'stores' | 'services'>('all')
  const [results, setResults] = useState<SearchResult>({ products: [], stores: [], services: [], total: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pageSize: 12 })

  const performSearch = useCallback(async (searchQuery: string) => {
    const term = searchQuery.trim()
    if (!term) {
      setResults({ products: [], stores: [], services: [], total: 0 })
      setError('')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      let nextResults: SearchResult
      if (isMockMode) {
        nextResults = await apiJson<SearchResult>(`/search?q=${encodeURIComponent(term)}`)
      } else {
        const [productResponse, storeResponse, serviceResponse] = await Promise.all([
          apiJson<{ products: Array<Product & { original_price?: number }>; total_count: number }>('/commerce/products', {
            params: { search: term, limit: 100, offset: 0, stock_status: 'all' },
          }),
          apiJson<{ stores: Array<StoreProfile & { store_name?: string; location_text?: string; vendor_profiles?: { is_verified?: boolean; verification_tier?: string } }> }>('/vendors/stores', {
            params: { page: 1, limit: 100 },
          }),
          apiJson<{ services: Array<ServiceProfile & { service_title?: string; location_text?: string; service_area_text?: string; vendor_profiles?: { is_verified?: boolean; verification_tier?: string } }> }>('/vendors/services', {
            params: { page: 1, limit: 100 },
          }),
        ])

        const products = productResponse.products.map((product) => ({
          ...product,
          image_url: product.image_url || product.images?.[0],
          compare_at_price: product.compare_at_price ?? product.original_price,
        }))
        const stores = storeResponse.stores
          .map((store) => {
            const tier = store.vendor_profiles?.verification_tier
            const verification_status: StoreProfile['verification_status'] = store.verification_status || (
              store.vendor_profiles?.is_verified ? (tier === 'business' ? 'business' : tier === 'nin' ? 'nin' : 'basic') : 'pending'
            )
            return {
              ...store,
              name: store.name || store.store_name || 'Local store',
              city: store.city || store.location_text,
              vendor_id: store.vendor_id || '',
              is_active: store.is_active ?? true,
              created_at: store.created_at || '',
              updated_at: store.updated_at || '',
              verification_status,
            }
          })
        const services = serviceResponse.services
          .map((service) => {
            const tier = service.vendor_profiles?.verification_tier
            const verification_status: ServiceProfile['verification_status'] = service.verification_status || (
              service.vendor_profiles?.is_verified ? (tier === 'business' ? 'business' : tier === 'nin' ? 'nin' : 'basic') : 'pending'
            )
            return {
              ...service,
              name: service.name || service.service_title || 'Service',
              city: service.city || service.location_text || service.service_area_text,
              vendor_id: service.vendor_id || '',
              is_active: service.is_active ?? true,
              created_at: service.created_at || '',
              updated_at: service.updated_at || '',
              verification_status,
            }
          })
          .filter((service) => `${service.name} ${service.description || ''} ${service.city || ''} ${service.category || ''}`.toLowerCase().includes(term.toLowerCase()))

        const matchingProductStoreIds = new Set(products.map((product) => product.store_id).filter(Boolean))
        const matchingStores = stores
          .map((store) => ({
            ...store,
            has_matching_products: matchingProductStoreIds.has(store.id),
            matching_products: products.filter((product) => product.store_id === store.id),
          }))
          .filter((store) => store.has_matching_products || `${store.name} ${store.description || ''} ${store.city || ''} ${store.category || ''}`.toLowerCase().includes(term.toLowerCase()))

        nextResults = { products, stores: matchingStores, services, total: products.length + matchingStores.length + services.length }
      }
      if (isMockMode) {
        const matchingProductStoreIds = new Set(nextResults.products.map((product) => product.store_id).filter(Boolean))
        nextResults = {
          ...nextResults,
          stores: nextResults.stores
            .map((store) => ({ ...store, has_matching_products: matchingProductStoreIds.has(store.id) }))
            .filter((store) => store.has_matching_products || `${store.name} ${store.description || ''} ${store.city || ''} ${store.category || ''}`.toLowerCase().includes(term.toLowerCase())),
        }
        nextResults.total = nextResults.products.length + nextResults.stores.length + nextResults.services.length
      }
      const matchingProductStoreIds = new Set(nextResults.products.map((product) => product.store_id).filter(Boolean))
      const storesWithProducts = nextResults.stores
        .map((store) => ({
          ...store,
          matching_products: nextResults.products.filter((product) => product.store_id === store.id),
        }))
        // Keep the API's natural order; don't rank stores by how many matching items they have.
        .filter((store) => matchingProductStoreIds.has(store.id) || `${store.name} ${store.description || ''} ${store.city || ''} ${store.category || ''}`.toLowerCase().includes(term.toLowerCase()))

      nextResults = { ...nextResults, stores: storesWithProducts, total: storesWithProducts.length + nextResults.services.length }
      setResults(nextResults)
      setPagination((previous) => ({ ...previous, page: 1 }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      toast({
        type: 'error',
        title: 'Search Error',
        description: 'Could not complete the search. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Keep URL-driven searches responsive without issuing a request for every keystroke.
  useEffect(() => {
    const timeout = window.setTimeout(() => { void performSearch(query) }, 300)
    return () => window.clearTimeout(timeout)
  }, [query, performSearch])


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)

    }
  }

  const handleClear = () => {
    setQuery('')
    router.push('/search')
    setResults({ products: [], stores: [], services: [], total: 0 })
  }

  const activeResultCount = activeTab === 'stores' ? results.stores.length : activeTab === 'services' ? results.services.length : results.total
  const activeTotalPages = Math.ceil(activeResultCount / pagination.pageSize)

  const tabs = [
    { id: 'all', label: 'All', icon: Search, count: results.total },
    { id: 'stores', label: 'Stores', icon: Store, count: results.stores.length },
    { id: 'services', label: 'Services', icon: Briefcase, count: results.services.length },
  ]

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8">
      {/* Search Header: keep this form mounted so typing never replaces the focused input. */}
      <header className="animate-fade-in">
        {!query.trim() && (
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="w-20 h-20 rounded-full bg-ink-raised/50 flex items-center justify-center mx-auto mb-6 text-coral">
              <Search className="w-10 h-10" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold font-display text-text-primary mb-4">Search Kamba Marketplace</h1>
            <p className="text-text-secondary text-lg">Find products, stores, and services from local vendors near you</p>
          </div>
        )}
        <form onSubmit={handleSearch} className={`relative ${!query.trim() ? 'max-w-xl' : 'max-w-3xl'} mx-auto mb-8`}>
          <Input
            type="search"
            placeholder={query.trim() ? "Search products, stores, services..." : "What are you looking for?"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 pr-16 h-14 text-lg"
            autoFocus={!query.trim()}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-text-tertiary" />
          {query && (
            <Button type="button" variant="ghost" size="icon" className="absolute right-10 top-1/2 -translate-y-1/2" onClick={handleClear} aria-label="Clear search">
              <X className="w-5 h-5" />
            </Button>
          )}
          <Button type="submit" variant="default" className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
          </Button>
        </form>

        {!query.trim() && (
          <div className="mt-4 mb-8 text-center">
            <p className="text-text-tertiary text-sm mb-4">Popular searches:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Electronics', 'Fashion', 'Home & Garden', 'Beauty', 'Food', 'Services'].map((cat) => (
                <Button key={cat} variant="ghost" size="sm" onClick={() => { setQuery(cat); router.push(`/search?q=${encodeURIComponent(cat)}`); }}>
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        )}
        {query.trim() && (
          <p className="text-center text-text-secondary">
            Showing results for <span className="font-medium text-text-primary">&quot;{query}&quot;</span>
            {results.total > 0 && <span className="ml-2">({results.total} result{results.total !== 1 ? 's' : ''})</span>}
          </p>
        )}
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-slide-up text-center">
          {error}
        </div>
      )}

      {query.trim() && (
        <>
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 animate-slide-up" style={{ animationDelay: '100ms' }} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-xl ${
              activeTab === tab.id
                ? 'bg-coral text-white border-coral'
                : 'bg-ink-raised/50 text-text-secondary hover:text-text-primary border border-border/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                activeTab === tab.id ? 'bg-white/20' : 'bg-ink/50'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
        {loading && results.total === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <StoreCardSkeleton key={i} />
            ))}
          </div>
        ) : activeTab === 'all' ? (
          <>
            {results.stores.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold font-display text-text-primary">Stores</h2>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('stores')}>
                    View all <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.stores.slice(0, 6).map((store) => (
                    <StoreSearchCard key={store.id} store={store} />
                  ))}
                </div>
              </section>
            )}

            {results.services.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold font-display text-text-primary">Services</h2>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('services')}>
                    View all <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.services.slice(0, 6).map((service) => (
                    <ServiceSearchCard key={service.id} service={service} />
                  ))}
                </div>
              </section>
            )}

            {results.total === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-ink-raised/50 flex items-center justify-center mx-auto mb-4 text-text-tertiary">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No results found</h3>
                <p className="text-text-tertiary">Try different keywords or browse our categories.</p>
              </div>
            )}
          </>
        ) : activeTab === 'stores' ? (
          <StoreResults stores={results.stores.slice((pagination.page - 1) * pagination.pageSize, pagination.page * pagination.pageSize)} loading={loading} />
        ) : (
          <ServiceResults services={results.services.slice((pagination.page - 1) * pagination.pageSize, pagination.page * pagination.pageSize)} loading={loading} />
        )}
      </div>

      {/* Pagination */}
      {activeTab !== 'all' && activeTotalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-2 animate-fade-in">
          <Button variant="outline" size="sm" onClick={() => setPagination((previous) => ({ ...previous, page: Math.max(1, previous.page - 1) }))} disabled={pagination.page === 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="px-4 text-text-secondary">
            Page {pagination.page} of {activeTotalPages}
          </span>
          <Button variant="outline" size="sm" onClick={() => setPagination((previous) => ({ ...previous, page: previous.page + 1 }))} disabled={pagination.page >= activeTotalPages}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
        </>
      )}
    </div>
  )
}

// Product matches are previews inside vendor cards; they never link directly to checkout.
function StoreSearchCard({ store }: { store: SearchStore }) {
  const imageUrl = store.logo_url || '/placeholder-store.jpg'
  return (
    <Card variant="elevated" className="h-full group">
      <Link href={`/store/${store.slug}`} className="block">
        <div className="relative aspect-[16/9] overflow-hidden rounded-t-xl bg-ink-raised/30">
          <img src={imageUrl} alt={store.name} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" loading="lazy" />
          {store.verification_status !== 'pending' && (
            <Badge variant="verification" className="absolute top-2 left-2">
              {store.verification_status === 'business' ? 'Business Verified' : store.verification_status === 'nin' ? 'NIN Verified' : 'Basic Verified'}
            </Badge>
          )}
        </div>
      </Link>
      <CardContent className="p-4 space-y-3">
        <div>
          <Link href={`/store/${store.slug}`} className="font-semibold text-text-primary group-hover:text-coral transition-colors">{store.name}</Link>
          {store.category && <p className="text-xs text-text-tertiary mt-1">{store.category}</p>}
          {store.city && store.state && <p className="text-xs text-text-tertiary mt-1">{store.city}, {store.state}</p>}
        </div>
        {store.matching_products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {store.matching_products.slice(0, 4).map((product) => (
              <Link key={product.id} href={`/store/${store.slug}?product=${encodeURIComponent(product.id)}`} className="min-w-0 rounded-lg border border-border/60 p-2 hover:border-coral/50 transition-colors" aria-label={`Explore ${store.name} and view ${product.name}`}>
                <div className="aspect-square rounded-md overflow-hidden bg-ink-raised/30 mb-2">
                  <img src={product.images?.[0] || product.image_url || '/placeholder-product.jpg'} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <p className="text-xs text-text-primary line-clamp-2">{product.name}</p>
                <p className="text-sm font-semibold text-text-primary mt-1">{formatKobo(product.price)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-tertiary line-clamp-2">{store.description || 'Explore this local store and its catalogue.'}</p>
        )}
        <Link href={`/store/${store.slug}`} className="inline-flex items-center text-sm font-medium text-coral hover:underline">
          Explore store <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </CardContent>
    </Card>
  )
}

// Service Search Card
function ServiceSearchCard({ service }: { service: ServiceProfile }) {
  const imageUrl = service.logo_url || '/placeholder-service.jpg'
  
  return (
    <Link href={`/marketplace/services/${service.slug}`} className="group">
      <Card variant="elevated" className="h-full group-hover:border-coral/30 transition-colors">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-ink-raised/30">
          <img
            src={imageUrl}
            alt={service.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {service.verification_status !== 'pending' && (
            <Badge variant="verification" className="absolute top-2 left-2">
              {service.verification_status === 'business' ? 'Business Verified' : 'NIN Verified'}
            </Badge>
          )}
        </div>
        <CardContent className="p-4 pt-3 space-y-2">
          <h3 className="font-semibold text-text-primary line-clamp-1 group-hover:text-coral transition-colors">{service.name}</h3>
          {service.category && (
            <Badge variant="secondary" size="sm">{service.category}</Badge>
          )}
          {service.city && service.state && (
            <p className="text-sm text-text-tertiary flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {service.city}, {service.state}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

// Full Results Components
function StoreResults({ stores, loading }: { stores: SearchStore[]; loading: boolean }) {
  if (loading && stores.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => <StoreCardSkeleton key={i} />)}
      </div>
    )
  }

  if (stores.length === 0) {
    return (
      <div className="text-center py-16">
        <Store className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">No stores found</h3>
        <p className="text-text-tertiary">Try adjusting your search terms.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {stores.map((store) => <StoreSearchCard key={store.id} store={store} />)}
    </div>
  )
}

function ServiceResults({ services, loading }: { services: ServiceProfile[]; loading: boolean }) {
  if (loading && services.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => <ServiceCardSkeleton key={i} />)}
      </div>
    )
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-16">
        <Briefcase className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">No services found</h3>
        <p className="text-text-tertiary">Try adjusting your search terms.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => <ServiceSearchCard key={service.id} service={service} />)}
    </div>
  )
}

export default function SearchPage() {
  return <Suspense fallback={<div className="container mx-auto px-4 py-12"><div className="h-48 animate-pulse rounded-xl bg-surface-muted" /></div>}><SearchPageContent /></Suspense>
}
