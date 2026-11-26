'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { apiJson } from '@/lib/api'
import { Product } from '@/types/commerce'
import { formatKobo } from '@/lib/formatting'
import { StoreProfile, ServiceProfile } from '@/types/vendor'
import { ProductCardSkeleton, StoreCardSkeleton, ServiceCardSkeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/toast'
import { ChevronLeft, ChevronRight, Package, Store, Briefcase, X } from 'lucide-react'

interface CategoryData {
  category: {
    id: string
    name: string
    slug: string
    description?: string
    image_url?: string
    parent_id?: string
  }
  products: Product[]
  stores: StoreProfile[]
  services: ServiceProfile[]
  subcategories: Array<{ id: string; name: string; slug: string }>
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export default function CategoryPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const slug = params.slug as string

  const [data, setData] = useState<CategoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'products' | 'stores' | 'services'>('products')
  const [filters, setFilters] = useState({
    sort: 'newest',
    minPrice: '',
    maxPrice: '',
    inStockOnly: false,
  })

  const updateFilters = (patch: Partial<typeof filters>) => {
    setFilters((previous) => ({ ...previous, ...patch }))
    router.push(`/marketplace/category/${slug}?page=1`)
  }

  const fetchCategory = async () => {
    if (filters.minPrice && filters.maxPrice && Number(filters.minPrice) > Number(filters.maxPrice)) {
      setError('Minimum price cannot exceed maximum price.')
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')

    try {
      const page = Math.max(1, Number(searchParams.get('page') || 1))
      const limit = 12
      const categoryResponse = await apiJson<{ categories: Array<{ category: string; product_count: number }> }>('/marketplace/categories')
      const categoryEntry = (categoryResponse.categories || []).find((item) =>
        item.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === slug.toLowerCase()
      )
      if (!categoryEntry) throw new Error('This category is not available.')

      const categoryName = categoryEntry.category
      const [productResponse, storeResponse, serviceResponse] = await Promise.all([
        apiJson<{ products: Product[]; total_count?: number }>('/commerce/products', {
          params: {
            category: categoryName,
            limit,
            offset: (page - 1) * limit,
            sort: filters.sort === 'relevance' ? 'newest' : filters.sort,
            min_price: filters.minPrice ? Math.round(Number(filters.minPrice) * 100) : undefined,
            max_price: filters.maxPrice ? Math.round(Number(filters.maxPrice) * 100) : undefined,
            stock_status: filters.inStockOnly ? 'in_stock' : 'all',
          },
        }),
        apiJson<{ stores: Array<StoreProfile & { store_name?: string; location_text?: string; vendor_profiles?: { is_verified?: boolean; verification_tier?: string } }> }>('/vendors/stores', {
          params: { category: categoryName, page: 1, limit: 100 },
        }),
        apiJson<{ services: Array<ServiceProfile & { service_title?: string; location_text?: string; service_area_text?: string; vendor_profiles?: { is_verified?: boolean; verification_tier?: string } }> }>('/vendors/services', {
          params: { category: categoryName, page: 1, limit: 100 },
        }),
      ])

      const stores = (storeResponse.stores || []).map((store) => {
        const tier = store.vendor_profiles?.verification_tier
        const verificationStatus: StoreProfile['verification_status'] = store.verification_status || (store.vendor_profiles?.is_verified ? (tier === 'business' ? 'business' : tier === 'nin' ? 'nin' : 'basic') : 'pending')
        return {
          ...store,
          name: store.name || store.store_name || 'Local store',
          city: store.city || store.location_text,
          vendor_id: store.vendor_id || '',
          is_active: store.is_active ?? true,
          created_at: store.created_at || '',
          updated_at: store.updated_at || '',
          verification_status: verificationStatus,
        }
      })
      const services = (serviceResponse.services || []).map((service) => {
        const tier = service.vendor_profiles?.verification_tier
        const verificationStatus: ServiceProfile['verification_status'] = service.verification_status || (service.vendor_profiles?.is_verified ? (tier === 'business' ? 'business' : tier === 'nin' ? 'nin' : 'basic') : 'pending')
        return {
          ...service,
          name: service.name || service.service_title || 'Service',
          city: service.city || service.location_text || service.service_area_text,
          vendor_id: service.vendor_id || '',
          is_active: service.is_active ?? true,
          created_at: service.created_at || '',
          updated_at: service.updated_at || '',
          verification_status: verificationStatus,
        }
      })
      const total = Number(productResponse.total_count ?? productResponse.products?.length ?? 0)

      setData({
        category: { id: categoryName, name: categoryName, slug },
        products: (productResponse.products || []).map((product) => ({
          ...product,
          image_url: product.image_url || product.images?.[0],
        })),
        stores,
        services,
        subcategories: [],
        pagination: { page, pageSize: limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load category')
      toast({
        type: 'error',
        title: 'Category unavailable',
        description: err instanceof Error ? err.message : 'Could not load this category. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(fetchCategory)
  }, [slug, searchParams.get('page'), filters.sort, filters.minPrice, filters.maxPrice, filters.inStockOnly])

  const clearFilters = () => {
    setFilters({ sort: 'newest', minPrice: '', maxPrice: '', inStockOnly: false })
    router.push(`/marketplace/category/${slug}?page=1`)
  }

  const hasActiveFilters = filters.sort !== 'newest' || filters.minPrice || filters.maxPrice || filters.inStockOnly

  if (loading && !data) {
    return (
      <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8 animate-fade-in">
        <div className="space-y-4 animate-pulse">
          <div className="h-10 w-1/3 bg-ink-raised/50 rounded-lg" />
          <div className="h-6 w-1/2 bg-ink-raised/50 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8 lg:py-12 flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-ink-raised/50 flex items-center justify-center mx-auto mb-4 text-text-tertiary">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Category not found</h2>
          <p className="text-text-tertiary">The category you're looking for doesn't exist.</p>
          <Button variant="outline" className="mt-4" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to marketplace
          </Button>
        </div>
      </div>
    )
  }

  const { category, products, stores, services, subcategories, pagination } = data
  const activeTotal = activeTab === 'products' ? pagination.total : activeTab === 'stores' ? stores.length : services.length

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 space-y-8">
      {/* Category Header */}
      <header className="animate-fade-in">
        <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm text-text-tertiary hover:text-coral transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" />
          Marketplace
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            {category.image_url && (
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-ink-raised/30 mb-4">
                <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
              </div>
            )}
            <h1 className="text-3xl lg:text-4xl font-bold font-display text-text-primary">{category.name}</h1>
            {category.description && (
              <p className="text-text-secondary mt-2 max-w-2xl">{category.description}</p>
            )}
          </div>

          {/* Subcategories */}
          {subcategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/marketplace/category/${sub.slug}`}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-coral transition-colors bg-ink-raised/50 border border-border/50 rounded-xl hover:border-coral/30"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-slide-up">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 animate-slide-up" style={{ animationDelay: '100ms' }} role="tablist">
        {[
          { id: 'products', label: 'Products', icon: Package, count: products.length },
          { id: 'stores', label: 'Stores', icon: Store, count: stores.length },
          { id: 'services', label: 'Services', icon: Briefcase, count: services.length },
        ].map((tab) => (
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

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up" style={{ animationDelay: '150ms' }}>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-secondary">
            {activeTotal} {activeTab}{activeTotal !== 1 ? 's' : ''} found
          </span>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-3.5 h-3.5 mr-1.5" />
              Clear filters
            </Button>
          )}
        </div>

        {activeTab === 'products' && <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            Min ₦
            <input aria-label="Minimum price in naira" type="number" min="0" inputMode="numeric" value={filters.minPrice} onChange={(event) => updateFilters({ minPrice: event.target.value })} className="h-9 w-24 rounded-lg border border-border bg-surface px-2 text-sm text-text-primary" />
          </label>
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            Max ₦
            <input aria-label="Maximum price in naira" type="number" min="0" inputMode="numeric" value={filters.maxPrice} onChange={(event) => updateFilters({ maxPrice: event.target.value })} className="h-9 w-24 rounded-lg border border-border bg-surface px-2 text-sm text-text-primary" />
          </label>
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <input type="checkbox" checked={filters.inStockOnly} onChange={(event) => updateFilters({ inStockOnly: event.target.checked })} className="h-4 w-4 accent-[var(--primary)]" />
            In stock
          </label>
          <Button variant="outline" size="sm" onClick={() => updateFilters({ sort: 'price_asc' })} className={filters.sort === 'price_asc' ? 'bg-coral border-coral text-white' : ''}>Price: Low to High</Button>
          <Button variant="outline" size="sm" onClick={() => updateFilters({ sort: 'price_desc' })} className={filters.sort === 'price_desc' ? 'bg-coral border-coral text-white' : ''}>Price: High to Low</Button>
          <Button variant="outline" size="sm" onClick={() => updateFilters({ sort: 'newest' })} className={filters.sort === 'newest' ? 'bg-coral border-coral text-white' : ''}>Newest</Button>
          <Button variant="outline" size="sm" onClick={() => updateFilters({ sort: 'popular' })} className={filters.sort === 'popular' ? 'bg-coral border-coral text-white' : ''}>Popular</Button>
        </div>}
      </div>

      {/* Results Grid */}
      <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              activeTab === 'products' ? <ProductCardSkeleton key={i} /> :
              activeTab === 'stores' ? <StoreCardSkeleton key={i} /> :
              <ServiceCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && activeTab === 'products' && (
          <>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCategoryCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Package className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">No products in this category</h3>
                <p className="text-text-tertiary">Check back later for new additions.</p>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => router.push(`/marketplace/category/${slug}?page=${pagination.page - 1}`)} disabled={pagination.page === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="px-4 text-text-secondary">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button variant="outline" size="sm" onClick={() => router.push(`/marketplace/category/${slug}?page=${pagination.page + 1}`)} disabled={pagination.page >= pagination.totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {!loading && activeTab === 'stores' && (
          <>
            {stores.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.map((store) => (
                  <StoreCategoryCard key={store.id} store={store} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Store className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">No stores in this category</h3>
                <p className="text-text-tertiary">Check back later for new additions.</p>
              </div>
            )}
          </>
        )}

        {!loading && activeTab === 'services' && (
          <>
            {services.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <ServiceCategoryCard key={service.id} service={service} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Briefcase className="w-16 h-16 mx-auto text-text-tertiary mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">No services in this category</h3>
                <p className="text-text-tertiary">Check back later for new additions.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Product Category Card
function ProductCategoryCard({ product }: { product: Product }) {
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
          {product.in_stock === false && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive" size="lg">Out of Stock</Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4 pt-3 space-y-2">
          <h3 className="font-semibold text-text-primary line-clamp-1 group-hover:text-coral transition-colors">{product.name}</h3>
          {product.store_name && (
            <p className="text-sm text-text-tertiary">{product.store_name}</p>
          )}
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-text-primary">
              {formatKobo(product.price)}
            </span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-sm text-text-tertiary line-through">
                {formatKobo(product.compare_at_price)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

// Store Category Card
function StoreCategoryCard({ store }: { store: StoreProfile }) {
  const imageUrl = store.logo_url || '/placeholder-store.jpg'
  
  return (
    <Link href={`/store/${store.slug}`} className="group">
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

// Service Category Card
function ServiceCategoryCard({ service }: { service: ServiceProfile }) {
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