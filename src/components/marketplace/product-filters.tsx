'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Filter } from 'lucide-react'

export interface MarketplaceFilterState {
  query: string
  category: string
  minPrice: number | null
  maxPrice: number | null
  sortBy: 'newest' | 'price_asc' | 'price_desc'
  location: string
  latitude: number | null
  longitude: number | null
  radius: number
  inStock: boolean
}

export interface ProductFiltersProps {
  filters: MarketplaceFilterState
  onFiltersChange: (filters: Partial<MarketplaceFilterState>) => void
  categories: string[]
  onClearAll: () => void
  hasActiveFilters: boolean
  mode?: 'products' | 'services'
  showSearch?: boolean
}

export function ProductFilters({
  filters,
  onFiltersChange,
  categories,
  onClearAll,
  hasActiveFilters,
  mode = 'products',
  showSearch = true,
}: ProductFiltersProps) {
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState('')
  const isProducts = mode === 'products'

  useEffect(() => {
    if (!showMobileFilters) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowMobileFilters(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showMobileFilters])

  const activeCount = [
    filters.query.trim() !== '',
    filters.category !== '',
    filters.location.trim() !== '' || filters.latitude !== null || filters.longitude !== null,
    isProducts && filters.minPrice !== null,
    isProducts && filters.maxPrice !== null,
    isProducts && filters.inStock,
  ].filter(Boolean).length

  const controls = (surface: 'desktop' | 'mobile') => (
    <div className="space-y-5">
      {showSearch && <div>
        <label htmlFor={`marketplace-filter-query-${mode}-${surface}`} className="mb-2 block text-sm font-medium text-text-secondary">
          Search {isProducts ? 'products' : 'services'}
        </label>
        <input
          id={`marketplace-filter-query-${mode}-${surface}`}
          type="search"
          value={filters.query}
          onChange={(event) => onFiltersChange({ query: event.target.value })}
          placeholder={isProducts ? 'Name, brand or keyword' : 'Service or provider'}
          className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>}

      <div>
        <label htmlFor={`marketplace-filter-location-${mode}-${surface}`} className="mb-2 block text-sm font-medium text-text-secondary">
          Location
        </label>
        <input
          id={`marketplace-filter-location-${mode}-${surface}`}
          type="search"
          value={filters.location}
          onChange={(event) => onFiltersChange({ location: event.target.value, latitude: null, longitude: null })}
          placeholder="City or state"
          className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isLocating}
            onClick={() => {
              if (!navigator.geolocation) {
                setLocationMessage('Location access is not supported by this browser.')
                return
              }
              setIsLocating(true)
              setLocationMessage('')
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  onFiltersChange({ location: '', latitude: position.coords.latitude, longitude: position.coords.longitude })
                  setIsLocating(false)
                  setLocationMessage('Nearby results are now being shown.')
                },
                (error) => {
                  setIsLocating(false)
                  setLocationMessage(error.code === error.PERMISSION_DENIED ? 'Location permission was denied. You can enter a city or state instead.' : 'Could not determine your location. Try entering a city or state.')
                },
                { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
              )
            }}
          >
            {isLocating ? 'Finding location…' : filters.latitude !== null ? 'Update my location' : 'Use my location'}
          </Button>
          {filters.latitude !== null && (
            <label className="flex items-center gap-2 text-xs text-text-secondary">
              Within
              <select
                aria-label="Nearby search radius"
                value={filters.radius}
                onChange={(event) => onFiltersChange({ radius: Number(event.target.value) })}
                className="h-9 rounded-md border border-border bg-surface px-2 text-xs text-text-primary"
              >
                {[5, 10, 15, 25, 50].map((radius) => <option key={radius} value={radius}>{radius} km</option>)}
              </select>
            </label>
          )}
        </div>
        {locationMessage && <p role="status" className="mt-2 text-xs text-text-tertiary">{locationMessage}</p>}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-text-secondary">Category</legend>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant={filters.category === '' ? 'default' : 'outline'} onClick={() => onFiltersChange({ category: '' })}>
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              type="button"
              size="sm"
              variant={filters.category === category ? 'default' : 'outline'}
              aria-pressed={filters.category === category}
              onClick={() => onFiltersChange({ category: filters.category === category ? '' : category })}
            >
              {category}
            </Button>
          ))}
        </div>
      </fieldset>

      {isProducts && (
        <>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-text-secondary">Price range (₦)</legend>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <input
                aria-label="Minimum price in naira"
                type="number"
                min="0"
                step="100"
                inputMode="numeric"
                placeholder="Min"
                value={filters.minPrice ?? ''}
                onChange={(event) => {
                  const value = event.target.value
                  onFiltersChange({ minPrice: value === '' ? null : Math.max(0, Number(value)) })
                }}
                className="h-11 min-w-0 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              <span className="text-text-tertiary">to</span>
              <input
                aria-label="Maximum price in naira"
                type="number"
                min="0"
                step="100"
                inputMode="numeric"
                placeholder="Max"
                value={filters.maxPrice ?? ''}
                onChange={(event) => {
                  const value = event.target.value
                  onFiltersChange({ maxPrice: value === '' ? null : Math.max(0, Number(value)) })
                }}
                className="h-11 min-w-0 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </div>
            {filters.minPrice !== null && filters.maxPrice !== null && filters.minPrice > filters.maxPrice && (
              <p className="mt-2 text-xs text-destructive" role="alert">Minimum price cannot exceed maximum price.</p>
            )}
          </fieldset>

          <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={filters.inStock}
              onChange={(event) => onFiltersChange({ inStock: event.target.checked })}
              className="h-4 w-4 rounded border-border accent-[var(--primary)]"
            />
            In-stock products only
          </label>

          <div>
            <label htmlFor={`product-sort-${surface}`} className="mb-2 block text-sm font-medium text-text-secondary">Sort products</label>
            <select
              id={`product-sort-${surface}`}
              value={filters.sortBy}
              onChange={(event) => onFiltersChange({ sortBy: event.target.value as MarketplaceFilterState['sortBy'] })}
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </div>
        </>
      )}

      {hasActiveFilters && (
        <Button type="button" variant="ghost" className="w-full justify-start" onClick={onClearAll}>
          <X className="mr-2 h-4 w-4" /> Clear filters
        </Button>
      )}
    </div>
  )

  return (
    <>
      <div className="mb-4 lg:hidden">
        <Button type="button" variant="outline" className="w-full justify-between" onClick={() => setShowMobileFilters(true)} aria-haspopup="dialog">
          <span className="inline-flex items-center"><Filter className="mr-2 h-4 w-4" /> Filters</span>
          {activeCount > 0 && <Badge variant="gold" size="sm">{activeCount} applied</Badge>}
        </Button>
      </div>

      <aside aria-label={`${isProducts ? 'Product' : 'Service'} filters`} className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-24 rounded-xl border border-border bg-surface p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold text-text-primary">Filter {isProducts ? 'products' : 'services'}</h2>
            {hasActiveFilters && <button type="button" onClick={onClearAll} className="text-xs font-medium text-primary hover:underline">Clear all</button>}
          </div>
          {controls('desktop')}
        </div>
      </aside>

      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close filters" className="absolute inset-0 bg-foreground/40" onClick={() => setShowMobileFilters(false)} />
          <section role="dialog" aria-modal="true" aria-labelledby="mobile-filter-title" className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col overflow-hidden border-l border-border bg-background shadow-xl">
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 id="mobile-filter-title" className="font-semibold text-text-primary">Filters</h2>
              <Button type="button" variant="ghost" size="icon" onClick={() => setShowMobileFilters(false)} aria-label="Close filters"><X className="h-5 w-5" /></Button>
            </header>
            <div className="flex-1 overflow-y-auto p-5">{controls('mobile')}</div>
            <footer className="border-t border-border bg-surface p-4">
              <Button type="button" className="w-full" onClick={() => setShowMobileFilters(false)}>Show results</Button>
            </footer>
          </section>
        </div>
      )}
    </>
  )
}
