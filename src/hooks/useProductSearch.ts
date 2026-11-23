'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { apiPaginated } from '@/lib/api'
import { Product } from '@/types/commerce'
import { MarketplaceFilterState } from '@/components/marketplace/product-filters'

export type ProductSearchFilters = MarketplaceFilterState

export interface UseProductSearchOptions {
  initialFilters?: Partial<ProductSearchFilters>
  pageSize?: number
}

export interface UseProductSearchReturn {
  products: Product[]
  loading: boolean
  error: string | null
  filters: ProductSearchFilters
  setFilters: (filters: Partial<ProductSearchFilters>) => void
  clearFilters: () => void
  hasActiveFilters: boolean
  pagination: { page: number; limit: number; total: number; totalPages: number }
  loadMore: () => Promise<void>
  hasMore: boolean
  refresh: () => Promise<void>
}

const DEFAULT_FILTERS: ProductSearchFilters = {
  query: '',
  category: '',
  minPrice: null,
  maxPrice: null,
  sortBy: 'newest',
  location: '',
  inStock: false,
}

export function useProductSearch(options: UseProductSearchOptions = {}): UseProductSearchReturn {
  const { initialFilters = {}, pageSize = 12 } = options
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<ProductSearchFilters>({ ...DEFAULT_FILTERS, ...initialFilters })
  const [pagination, setPagination] = useState({ page: 1, limit: pageSize, total: 0, totalPages: 0 })
  const [hasMore, setHasMore] = useState(false)
  const loadingRef = useRef(false)
  const requestIdRef = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchProducts = useCallback(async (page: number, currentFilters: ProductSearchFilters, append = false) => {
    if (append && loadingRef.current) return
    if (!append) abortControllerRef.current?.abort()

    const controller = new AbortController()
    abortControllerRef.current = controller
    const requestId = ++requestIdRef.current
    loadingRef.current = true

    try {
      setError(null)
      setLoading(true)
      const params: Record<string, string | number | boolean | undefined> = {
        page,
        limit: pageSize,
        q: currentFilters.query.trim() || undefined,
        category: currentFilters.category || undefined,
        location: currentFilters.location.trim() || undefined,
        min_price: currentFilters.minPrice ?? undefined,
        max_price: currentFilters.maxPrice ?? undefined,
        sort: currentFilters.sortBy === 'newest' ? undefined : currentFilters.sortBy,
        in_stock: currentFilters.inStock || undefined,
      }
      const result = await apiPaginated<Product>('/commerce/products', { params, signal: controller.signal })
      if (requestId !== requestIdRef.current) return

      if (append) {
        setProducts((previous) => {
          const existing = new Set(previous.map((product) => product.id))
          return [...previous, ...result.data.filter((product) => !existing.has(product.id))]
        })
      } else {
        setProducts(result.data)
      }
      setPagination(result.meta)
      setHasMore(result.meta.page < result.meta.totalPages)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      if (requestId === requestIdRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load products')
        if (!append) setProducts([])
      }
    } finally {
      if (requestId === requestIdRef.current) {
        loadingRef.current = false
        setLoading(false)
      }
    }
  }, [pageSize])

  const setFilters = useCallback((next: Partial<ProductSearchFilters>) => {
    setFiltersState((previous) => ({ ...previous, ...next }))
  }, [])

  const clearFilters = useCallback(() => setFiltersState(DEFAULT_FILTERS), [])

  useEffect(() => {
    const timeout = window.setTimeout(() => { void fetchProducts(1, filters) }, 250)
    return () => window.clearTimeout(timeout)
  }, [filters, fetchProducts])

  useEffect(() => () => abortControllerRef.current?.abort(), [])

  const loadMore = useCallback(async () => {
    if (hasMore && !loadingRef.current) await fetchProducts(pagination.page + 1, filters, true)
  }, [hasMore, pagination.page, filters, fetchProducts])

  const refresh = useCallback(async () => {
    await fetchProducts(1, filters)
  }, [filters, fetchProducts])

  const hasActiveFilters = filters.query.trim() !== '' || filters.category !== '' ||
    filters.location.trim() !== '' || filters.minPrice !== null || filters.maxPrice !== null ||
    filters.sortBy !== 'newest' || filters.inStock

  return { products, loading, error, filters, setFilters, clearFilters, hasActiveFilters, pagination, loadMore, hasMore, refresh }
}
