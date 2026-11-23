'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { apiJson } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Product } from '@/types/commerce'
import { formatKobo } from '@/lib/formatting'
import { ProductCardSkeleton } from '@/components/ui/skeleton'
import { ProductFilters } from '@/components/marketplace/product-filters'
import { useProductSearch } from '@/hooks/useProductSearch'
import { Search, Filter, Package } from 'lucide-react'

export default function ProductsPage() {
  const {
    products,
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
  } = useProductSearch({ pageSize: 12 })

  const [categories, setCategories] = useState<string[]>([])

  // Fetch categories on mount
  useEffect(() => {
    apiJson<{ categories: string[] }>('/api/categories')
      .then((data) => setCategories(data.categories || []))
      .catch(() => setCategories(['Electronics', 'Fashion', 'Home & Garden', 'Beauty', 'Sports', 'Books']))
  }, [])

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

  if (loading && products.length === 0) {
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
            <ProductCardSkeleton key={i} />
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
            <h1 className="text-3xl lg:text-4xl font-bold font-display text-text-primary">Products</h1>
            <p className="text-text-secondary mt-2">Browse products from local stores</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => refresh()} disabled={loading}>
              <Package className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
          <input
            type="search"
            placeholder="Search products, brands, categories..."
            value={filters.query}
            onChange={(e) => setFilters({ query: e.target.value })}
            className="w-full flex h-12 pl-12 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200 bg-surface border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary"
          />
        </div>
      </header>

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
          mode='products'
          onClearAll={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Products Grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-text-secondary">
              {pagination.total} product{pagination.total !== 1 ? 's' : ''} found
            </p>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <Filter className="w-3.5 h-3.5 mr-1.5" />
                Clear filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            {products.map((product) => (
              <Card key={product.id} variant="elevated" className="h-full group">
                <CardHeader className="pb-2">
                  <CardTitle className="text-text-primary group-hover:text-coral transition-colors line-clamp-1">{product.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pb-2">
                  {product.image_url ? (
                    <Link href={`/marketplace/products/${product.id}`}>
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-xl group-hover:scale-[1.02] transition-transform duration-300"
                        loading="lazy"
                      />
                    </Link>
                  ) : (
                    <Link href={`/marketplace/products/${product.id}`}>
                      <div className="w-full h-48 bg-ink-raised/50 rounded-xl flex items-center justify-center group-hover:bg-ink-raised/70 transition-colors">
                        <svg className="w-12 h-12 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </Link>
                  )}
                  {product.description && (
                    <p className="text-sm text-text-tertiary line-clamp-2">{product.description}</p>
                  )}
                </CardContent>
                <CardFooter className="pt-0 flex items-center justify-between">
                  <span className="text-lg font-bold text-text-primary">{formatKobo(product.price)}</span>
                  <Link href={`/marketplace/products/${product.id}`}>
                    <Button variant="ghost" size="sm" className="group-hover:text-coral transition-colors">
                      View
                      <svg className="ml-1.5 w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
            {products.length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className="w-16 h-16 rounded-full bg-ink-raised/50 flex items-center justify-center mx-auto mb-4 text-text-tertiary">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No products found</h3>
                <p className="text-text-tertiary">Try adjusting your filters or search terms.</p>
              </div>
            )}
          </div>

          {/* Load More / Pagination */}
          {hasMore && (
            <div className="mt-8 text-center">
              <Button variant="outline" size="lg" onClick={loadMore} disabled={loading} className="w-full sm:w-auto">
                {loading ? 'Loading...' : `Load more (${products.length} of ${pagination.total})`}
              </Button>
            </div>
          )}

          {!hasMore && products.length > 0 && pagination.totalPages > 1 && (
            <div className="mt-8 text-center text-sm text-text-tertiary">
              Showing all {pagination.total} products
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
