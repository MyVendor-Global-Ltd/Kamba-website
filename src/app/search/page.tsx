'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiJson } from '@/lib/api'
import { Product } from '@/types/commerce'
import { StoreProfile, ServiceProfile } from '@/types/vendor'
import { ProductCardSkeleton, StoreCardSkeleton, ServiceCardSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { Search, X, Filter, Package, Store, Briefcase, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

interface SearchResult {
  products: Product[]
  stores: StoreProfile[]
  services: ServiceProfile[]
  total: number
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [activeTab, setActiveTab] = useState<'all' | 'products' | 'stores' | 'services'>('all')
  const [results, setResults] = useState<SearchResult>({ products: [], stores: [], services: [], total: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({ page: 1, pageSize: 12, totalPages: 1 })

  const performSearch = useCallback(async (searchQuery: string, page = 1) => {
    if (!searchQuery.trim()) {
      setResults({ products: [], stores: [], services: [], total: 0 })
      return
    }

    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        page: page.toString(),
        limit: '12',
      })

      const data = await apiJson<SearchResult>(`/search?${params.toString()}`)
      setResults(data)
      setPagination(prev => ({ ...prev, page, totalPages: Math.ceil(data.total / 12) }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      toast({
        type: 'error',
        title: 'Search Error',
        description: 'Failed to perform search. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Initial search from URL params
  useEffect(() => {
    if (query) {
      performSearch(query)
    }
  }, [query, performSearch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      performSearch(query.trim())
    }
  }

  const handleClear = () => {
    setQuery('')
    router.push('/search')
    setResults({ products: [], stores: [], services: [], total: 0 })
  }

  const tabs = [
    { id: 'all', label: 'All', icon: Search, count: results.total },
    { id: 'products', label: 'Products', icon: Package, count: results.products.length },
    { id: 'stores', label: 'Stores', icon: Store, count: results.stores.length },
    { id: 'services', label: 'Services', icon: Briefcase, count: results.services.length },
  ]

  if (!query && !loading) {
    return (
      <div className="container mx-auto px-4 py-16 lg:py-24 flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-2xl">
          <div className="w-20 h-20 rounded-full bg-ink-raised/50 flex items-center justify-center mx-auto mb-6 text-coral">
            <Search className="w-10 h-10" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold font-display text-text-primary mb-4">Search Kamba Marketplace</h1>
          <p className="text-text-secondary mb-8 text-lg">Find products, stores, and services from local vendors near you</p>
          
          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
            <Input
              type="search"
              placeholder="What are you looking for?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12 pr-16 h-14 text-lg"
              autoFocus
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-text-tertiary" />
            <Button type="submit" variant="default" className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-6">
              Search
            </Button>
          </form>

          {/* Popular Categories */}
          <div className="mt-12">
            <p className="text-text-tertiary text-sm mb-4">Popular searches:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Electronics', 'Fashion', 'Home & Garden', 'Beauty', 'Food', 'Services'].map((cat) => (
                <Button key={cat} variant="ghost" size="sm" onClick={() => { setQuery(cat); router.push(`/search?q=${encodeURIComponent(cat)}`); performSearch(cat); }}>
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8">
      {/* Search Header */}
      <header className="animate-fade-in">
        <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto mb-8">
          <Input
            type="search"
            placeholder="Search products, stores, services..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-12 pr-16 h-14 text-lg"
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

        {query && (
          <p className="text-center text-text-secondary">
            Showing results for <span className="font-medium text-text-primary">"{query}"</span>
            {results.total > 0 && <span className="ml-2">({results.total} result{results.total !== 1 ? 's' : ''})</span>}
          </p>
        )}
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-slide-up text-center">
          {error}
        </div>
      )}

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
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : activeTab === 'all' ? (
          <>
            {results.products.length > 0 && (
              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold font-display text-text-primary">Products</h2>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('products')}>
                    View all <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
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
        ) : activeTab === 'products' ? (
          <ProductResults products={results.products} loading={loading} />
        ) : activeTab === 'stores' ? (
          <StoreResults stores={results.stores} loading={loading} />
        ) : (
          <ServiceResults services={results.services} loading={loading} />
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-2 animate-fade-in">
          <Button variant="outline" size="sm" onClick={() => performSearch(query, pagination.page - 1)} disabled={pagination.page === 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="px-4 text-text-secondary">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={() => performSearch(query, pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

// Product Search Card
function ProductSearchCard({ product }: { product: Product }) {
  const imageUrl = product.images?.[0] || product.image_url || '/placeholder-product.jpg'
  
  return (
    <Link href={`/marketplace/products/${product.id}`} className="group">
      <Card variant="elevated" className="h-full group-hover:border-coral/30 transition-colors">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-ink-raised/30">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {product.compare_at_price && product.compare_at_price > product.price && (
            <Badge variant="destructive" className="absolute top-2 left-2">
              -{Math.round((1 - product.price / product.compare_at_price) * 100)}%
            </Badge>
          )}
        </div>
        <CardContent className="p-4 pt-3 space-y-2">
          <h3 className="font-semibold text-text-primary line-clamp-1 group-hover:text-coral transition-colors">{product.name}</h3>
          {product.store_name && (
            <p className="text-sm text-text-tertiary">{product.store_name}</p>
          )}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-text-primary">
              ₦{product.price.toLocaleString()}
            </span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-sm text-text-tertiary line-through">
                ₦{product.compare_at_price.toLocaleString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// Store Search Card
function StoreSearchCard({ store }: { store: StoreProfile }) {
  const imageUrl = store.logo_url || '/placeholder-store.jpg'
  
  return (
    <Link href={`/marketplace/stores/${store.slug}`} className="group">
      <Card variant="elevated" className="h-full group-hover:border-coral/30 transition-colors">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-ink-raised/30">
          <img
            src={imageUrl}
            alt={store.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {store.verification_status !== 'pending' && (
            <Badge variant="verification" className="absolute top-2 left-2">
              {store.verification_status === 'business' ? 'Business Verified' : 'NIN Verified'}
            </Badge>
          )}
        </div>
        <CardContent className="p-4 pt-3 space-y-2">
          <h3 className="font-semibold text-text-primary line-clamp-1 group-hover:text-coral transition-colors">{store.name}</h3>
          {store.category && (
            <Badge variant="secondary" size="sm">{store.category}</Badge>
          )}
          {store.city && store.state && (
            <p className="text-sm text-text-tertiary flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {store.city}, {store.state}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
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
function ProductResults({ products, loading }: { products: Product[]; loading: boolean }) {
  if (loading && products.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">No products found</h3>
        <p className="text-text-tertiary">Try adjusting your search terms.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => <ProductSearchCard key={product.id} product={product} />)}
    </div>
  )
}

function StoreResults({ stores, loading }: { stores: StoreProfile[]; loading: boolean }) {
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