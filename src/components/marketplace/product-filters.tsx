'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Filter, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react'

export interface ProductFilters {
  query: string
  category: string
  minPrice: number | null
  maxPrice: number | null
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'rating'
  inStock: boolean
  inStockOnly?: boolean
}

export interface ProductFiltersProps {
  filters: ProductFilters
  onFiltersChange: (filters: Partial<ProductFilters>) => void
  categories: string[]
  onClearAll: () => void
  hasActiveFilters: boolean
}

export function ProductFilters({ filters, onFiltersChange, categories, onClearAll, hasActiveFilters }: ProductFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const handleSortChange = useCallback((sortBy: ProductFilters['sortBy']) => {
    onFiltersChange({ sortBy })
  }, [onFiltersChange])

  const handleCategoryChange = useCallback((category: string) => {
    onFiltersChange({ category: category === filters.category ? '' : category })
  }, [onFiltersChange, filters.category])

  const handlePriceChange = useCallback((field: 'minPrice' | 'maxPrice', value: string) => {
    const numValue = value === '' ? null : parseFloat(value)
    if (numValue !== null && isNaN(numValue)) return
    onFiltersChange({ [field]: numValue })
  }, [onFiltersChange])

  const handleInStockChange = useCallback((checked: boolean) => {
    onFiltersChange({ inStock: checked })
  }, [onFiltersChange])

  const handleSearch = useCallback((query: string) => {
    onFiltersChange({ query })
  }, [onFiltersChange])

  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Top Rated' },
  ] as const

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => setShowMobileFilters(true)}
        >
          <Filter className="w-4 h-4 mr-2" />
          <span>Filters</span>
          {hasActiveFilters && (
            <Badge variant="gold" size="sm">
              {Object.entries(filters).filter(([key, value]) => {
                if (key === 'query' || key === 'sortBy' || key === 'inStock') return false
                return value !== '' && value !== null && value !== false
              }).length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Desktop Filters Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <Card variant="outlined" className="sticky top-24">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filters</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={onClearAll} className="text-text-secondary hover:text-destructive">
                  <X className="w-3.5 h-3.5 mr-1" />
                  Clear all
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-0">
            {/* Search */}
            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">Search</label>
              <Input
                placeholder="Search products..."
                value={filters.query}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Category */}
            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">Category</label>
              <div className="space-y-2">
                <Button
                  variant={filters.category === '' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => handleCategoryChange('')}
                >
                  All categories
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={filters.category === category ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => handleCategoryChange(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">Price Range (₦)</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice ?? ''}
                  onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                  className="w-full"
                  min={0}
                  step={100}
                />
                <span className="text-text-tertiary">–</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice ?? ''}
                  onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                  className="w-full"
                  min={0}
                  step={100}
                />
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="text-sm font-medium text-text-secondary mb-2 block">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleSortChange(e.target.value as ProductFilters['sortBy'])}
                className="w-full flex h-11 items-center px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200 bg-ink-raised/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral focus:bg-ink-raised disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-ink-raised/30 appearance-none bg-no-repeat bg-right pr-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.75rem center',
                }}
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* In Stock */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => handleInStockChange(e.target.checked)}
                  className="w-4 h-4 rounded border-border/50 bg-ink-raised/50 text-coral focus:ring-coral focus:ring-2"
                />
                <span className="text-sm font-medium text-text-secondary">In stock only</span>
              </label>
            </div>
          </CardContent>
        </Card>
      </aside>

      {/* Mobile Filters Modal */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-background border-l border-border/50 animate-slide-in">
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <h2 className="text-lg font-semibold font-display">Filters</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowMobileFilters(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)]">
              {/* Search */}
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">Search</label>
                <Input
                  placeholder="Search products..."
                  value={filters.query}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full"
                  autoFocus
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">Category</label>
                <div className="space-y-2">
                  <Button
                    variant={filters.category === '' ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => { handleCategoryChange(''); setShowMobileFilters(false); }}
                  >
                    All categories
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={filters.category === category ? 'default' : 'outline'}
                      className="w-full justify-start"
                      onClick={() => { handleCategoryChange(category); setShowMobileFilters(false); }}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">Price Range (₦)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice ?? ''}
                    onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                    className="w-full"
                    min={0}
                    step={100}
                  />
                  <span className="text-text-tertiary">–</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice ?? ''}
                    onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                    className="w-full"
                    min={0}
                    step={100}
                  />
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleSortChange(e.target.value as ProductFilters['sortBy'])}
                  className="w-full flex h-11 items-center px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-200 bg-ink-raised/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral focus:bg-ink-raised disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-ink-raised/30 appearance-none bg-no-repeat bg-right pr-10"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundPosition: 'right 0.75rem center',
                  }}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* In Stock */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.inStock}
                    onChange={(e) => handleInStockChange(e.target.checked)}
                    className="w-4 h-4 rounded border-border/50 bg-ink-raised/50 text-coral focus:ring-coral focus:ring-2"
                  />
                  <span className="text-sm font-medium text-text-secondary">In stock only</span>
                </label>
              </div>

              {hasActiveFilters && (
                <Button variant="destructive" className="w-full" onClick={() => { onClearAll(); setShowMobileFilters(false); }}>
                  Clear all filters
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}