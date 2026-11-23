'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { apiJson } from '@/lib/api'
import { isMockMode } from '@/lib/mock-api'
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
  latitude: null,
  longitude: null,
  radius: 15,
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
      const offset = (page - 1) * pageSize
      const params: Record<string, string | number | boolean | undefined> = {
        limit: pageSize,
        offset,
        search: currentFilters.query.trim() || undefined,
        category: currentFilters.category || undefined,
        min_price: currentFilters.minPrice === null ? undefined : Math.round(currentFilters.minPrice * 100),
        max_price: currentFilters.maxPrice === null ? undefined : Math.round(currentFilters.maxPrice * 100),
        sort: currentFilters.sortBy,
        stock_status: currentFilters.inStock ? 'in_stock' : 'all',
        lat: currentFilters.latitude ?? undefined,
        lng: currentFilters.longitude ?? undefined,
        radius: currentFilters.latitude !== null && currentFilters.longitude !== null ? currentFilters.radius : undefined,
        ...(isMockMode && currentFilters.location.trim() ? { location: currentFilters.location.trim() } : {}),
      }
      const result = await apiJson<{
        products: Array<Product & { original_price?: number; store_slug?: string; in_stock?: boolean }>
        limit: number
        offset: number
        total_count: number
        has_more: boolean
      }>('/commerce/products', { params, signal: controller.signal })
      if (requestId !== requestIdRef.current) return

      const mappedProducts = result.products.map((product) => ({
        ...product,
        image_url: product.image_url || product.images?.[0],
        compare_at_price: product.compare_at_price ?? product.original_price,
        in_stock: product.in_stock ?? product.stock_quantity > 0,
      }))
      if (append) {
        setProducts((previous) => {
          const existing = new Set(previous.map((product) => product.id))
          return [...previous, ...mappedProducts.filter((product) => !existing.has(product.id))]
        })
      } else {
        setProducts(mappedProducts)
      }
      const totalPages = Math.max(1, Math.ceil(result.total_count / pageSize))
      setPagination({ page, limit: result.limit, total: result.total_count, totalPages })
      setHasMore(result.has_more)
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
    filters.location.trim() !== '' || filters.latitude !== null || filters.longitude !== null || filters.minPrice !== null || filters.maxPrice !== null ||
    filters.sortBy !== 'newest' || filters.inStock

  return { products, loading, error, filters, setFilters, clearFilters, hasActiveFilters, pagination, loadMore, hasMore, refresh }
}
