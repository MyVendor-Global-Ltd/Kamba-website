'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
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
import { Search, X, Store, Briefcase, ChevronLeft, ChevronRight, Loader2, MapPin, LocateFixed } from 'lucide-react'
import { useLocation } from '@/hooks/useLocation'
import { ProductSearchShowcase } from '@/components/marketplace/product-search-showcase'

type SearchStore = StoreProfile & { has_matching_products?: boolean; matching_products: Product[]; distance_km?: number }
type SearchService = ServiceProfile & { distance_km?: number }

interface SearchResult {
  products: Product[]
  stores: SearchStore[]
  services: SearchService[]
  total: number
}

function SearchPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { coords, locationLabel, error: locationError, loading: locating, getLocation, setLocation, clearLocation } = useLocation()
  const [radius, setRadius] = useState(15)
  const [manualLocation, setManualLocation] = useState('')
  const [resolvingLocation, setResolvingLocation] = useState(false)

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [activeTab, setActiveTab] = useState<'all' | 'stores' | 'services'>('all')
  const [results, setResults] = useState<SearchResult>({ products: [], stores: [], services: [], total: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pageSize: 12 })
  const searchSequenceRef = useRef(0)

  const performSearch = useCallback(async (searchQuery: string) => {
    const requestId = ++searchSequenceRef.current
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
            params: { search: term, limit: 100, offset: 0, stock_status: 'all', sort: coords ? 'nearest' : 'newest', lat: coords?.lat, lng: coords?.lng, radius: coords ? radius : undefined },
          }),
          apiJson<{ stores: Array<StoreProfile & { store_name?: string; location_text?: string; vendor_profiles?: { is_verified?: boolean; verification_tier?: string } }> }>('/vendors/stores', {
            params: { page: 1, limit: 100, lat: coords?.lat, lng: coords?.lng, radius: coords ? radius : undefined },
          }),
          apiJson<{ services: Array<ServiceProfile & { service_title?: string; location_text?: string; service_area_text?: string; vendor_profiles?: { is_verified?: boolean; verification_tier?: string } }> }>('/vendors/services', {
            params: { page: 1, limit: 100, lat: coords?.lat, lng: coords?.lng, radius: coords ? radius : undefined },
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

      nextResults = { ...nextResults, stores: storesWithProducts, total: nextResults.products.length + storesWithProducts.length + nextResults.services.length }
      if (requestId !== searchSequenceRef.current) return
      setResults(nextResults)
      setPagination((previous) => ({ ...previous, page: 1 }))
    } catch (err) {
      if (requestId !== searchSequenceRef.current) return
      setError(err instanceof Error ? err.message : 'Search failed')
      toast({
        type: 'error',
        title: 'Search Error',
        description: 'Could not complete the search. Please try again.',
      })
    } finally {
      if (requestId === searchSequenceRef.current) setLoading(false)
    }
  }, [toast, coords, radius])

  // Keep URL-driven searches responsive without issuing a request for every keystroke.
  useEffect(() => {
    const timeout = window.setTimeout(() => { void performSearch(query) }, 300)
    return () => window.clearTimeout(timeout)
  }, [query, performSearch])


  const updateQuery = (nextQuery: string) => {
    // Invalidate any in-flight request as soon as the user changes the query.
    searchSequenceRef.current += 1
    setQuery(nextQuery)
  }

  const handleManualLocation = async (event: React.FormEvent) => {
    event.preventDefault()
    const locationText = manualLocation.trim()
    if (locationText.length < 3) {
      toast({ type: 'error', title: 'Enter an area', description: 'Add a neighbourhood, town or city to find nearby results.' })
      return
    }

    setResolvingLocation(true)
    try {
      const response = await apiJson<{ location: { location_text: string; lat: number; lng: number } }>('/vendors/location/resolve', {
        method: 'POST',
        body: JSON.stringify({ location_text: locationText }),
      })
      if (!Number.isFinite(response.location?.lat) || !Number.isFinite(response.location?.lng)) {
        throw new Error('The selected area could not be located.')
      }
      setLocation(
        { lat: response.location.lat, lng: response.location.lng },
        response.location.location_text || locationText
      )
      setManualLocation(response.location.location_text || locationText)
    } catch (err) {
      toast({
        type: 'error',
        title: 'Location not found',
        description: err instanceof Error ? err.message : 'Try adding the city and state.',
      })
    } finally {
      setResolvingLocation(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)

    }
  }

  const handleClear = () => {
    updateQuery('')
    setLoading(false)
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
        <div className={`text-center max-w-2xl mx-auto mb-8 ${query.trim() ? 'hidden' : ''}`}>
            <div className="w-20 h-20 rounded-full bg-ink-raised/50 flex items-center justify-center mx-auto mb-6 text-coral">
              <Search className="w-10 h-10" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold font-display text-text-primary mb-4">Search Kamba Marketplace</h1>
            <p className="text-text-secondary text-lg">Find products, stores, and services from local vendors near you</p>
          </div>
        <form onSubmit={handleSearch} className={`relative ${!query.trim() ? 'max-w-xl' : 'max-w-3xl'} mx-auto mb-8`}>
          <Input
            type="search"
            placeholder={query.trim() ? "Search products, stores, services..." : "What are you looking for?"}
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
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

        <div className="max-w-3xl mx-auto -mt-3 mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant={coords ? "default" : "outline"} size="sm" onClick={getLocation} disabled={locating}>
              {locating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LocateFixed className="w-4 h-4 mr-2" />}
              {coords ? "Using my location" : "Use my location"}
            </Button>
            {coords && (
              <Button type="button" variant="ghost" size="sm" onClick={clearLocation} className="text-text-tertiary">
                <X className="w-3.5 h-3.5 mr-1" /> Clear location
              </Button>
            )}
          </div>
          {coords && (
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              Search radius
              <select value={radius} onChange={(event) => setRadius(Number(event.target.value))} className="rounded-lg border border-border bg-surface px-2 py-1.5 text-text-primary">
                <option value={5}>5 km</option>
                <option value={15}>15 km</option>
                <option value={30}>30 km</option>
                <option value={50}>50 km</option>
              </select>
            </label>
          )}
          {coords && <p className="w-full text-xs text-text-tertiary"><MapPin className="inline w-3 h-3 mr-1" />Around {locationLabel || "your selected location"} · showing matches within {radius} km where coordinates are available.</p>}
          {locationError && <p role="status" className="w-full text-xs text-text-tertiary">Location unavailable: {locationError}. You can still search without sharing your location.</p>}
          <form onSubmit={handleManualLocation} className="w-full flex flex-col sm:flex-row gap-2">
            <Input
              value={manualLocation}
              onChange={(event) => setManualLocation(event.target.value)}
              placeholder="Or enter an area, town or city (e.g. GRA, Port Harcourt)"
              aria-label="Search around an area"
              className="h-10"
            />
            <Button type="submit" variant="outline" size="sm" disabled={resolvingLocation || manualLocation.trim().length < 3}>
              {resolvingLocation ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
              Use this area
            </Button>
          </form>
        </div>

        <div className={`mt-4 mb-8 text-center ${query.trim() ? 'hidden' : ''}`}>
            <p className="text-text-tertiary text-sm mb-4">Popular searches:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Electronics', 'Fashion', 'Home & Garden', 'Beauty', 'Food', 'Services'].map((cat) => (
                <Button key={cat} variant="ghost" size="sm" onClick={() => { updateQuery(cat); router.push(`/search?q=${encodeURIComponent(cat)}`); }}>
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        {query.trim() && (
          <p className="text-center text-text-secondary">
            Showing results for <span className="font-medium text-text-primary">&quot;{query}&quot;</span>
            {results.total > 0 && <span className="ml-2">({results.total} result{results.total !== 1 ? 's' : ''})</span>}
          </p>
        )}
      </header>

      {!query.trim() && <ProductSearchShowcase />}

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
            {results.products.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold font-display text-text-primary">Products</h2>
                  <span className="text-sm text-text-tertiary">{results.products.length} matches</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.products.slice(0, 6).map((product) => (
                    <ProductSearchCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )}

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
          {typeof store.distance_km === 'number' && <p className="text-xs text-text-tertiary mt-1">{store.distance_km.toFixed(1)} km away</p>}
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

function ProductSearchCard({ product }: { product: Product }) {
  const imageUrl = product.images?.[0] || product.image_url || '/placeholder-product.jpg'
  const available = product.is_available !== false && product.in_stock !== false && product.stock_quantity > 0

  return (
    <Card variant="elevated" className="h-full group">
      <Link href={`/marketplace/products/${product.id}`} className="block">
        <div className="aspect-[4/3] overflow-hidden rounded-t-xl bg-ink-raised/30">
          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" loading="lazy" />
        </div>
      </Link>
      <CardContent className="p-4 space-y-2">
        <Link href={`/marketplace/products/${product.id}`} className="font-semibold text-text-primary group-hover:text-coral transition-colors line-clamp-2">
          {product.name}
        </Link>
        {product.store_name && <p className="text-xs text-text-tertiary">{product.store_name}</p>}
        <p className="text-sm font-semibold text-text-primary">{formatKobo(product.price)}</p>
        {typeof product.stock_quantity === 'number' && (
          <p className={`text-xs ${available ? 'text-emerald-600' : 'text-text-tertiary'}`}>
            {available ? 'In stock' : 'Out of stock'}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// Service Search Card
function ServiceSearchCard({ service }: { service: SearchService }) {
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
          {typeof service.distance_km === 'number' && <p className="text-xs text-text-tertiary">{service.distance_km.toFixed(1)} km away</p>}
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

function ServiceResults({ services, loading }: { services: SearchService[]; loading: boolean }) {
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
