'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { apiJson, apiPaginated, PaginatedResponse } from '@/lib/api'
import { Product } from '@/types/commerce'
import { ProductFilters } from '@/components/marketplace/product-filters'

export interface UseProductSearchOptions {
  initialFilters?: Partial<ProductFilters>
  pageSize?: number
}

export interface UseProductSearchReturn {
  products: Product[]
  loading: boolean
  error: string | null
  filters: ProductFilters
  setFilters: (filters: Partial<ProductFilters>) => void
  clearFilters: () => void
  hasActiveFilters: boolean
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  loadMore: () => Promise<void>
  hasMore: boolean
  refresh: () => Promise<void>
}

const DEFAULT_FILTERS: ProductFilters = {
  query: '',
  category: '',
  minPrice: null,
  maxPrice: null,
  sortBy: 'newest',
  inStock: false,
}

export function useProductSearch(options: UseProductSearchOptions = {}): UseProductSearchReturn {
  const { initialFilters = {}, pageSize = 12 } = options
  
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<ProductFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
  })
  const [hasMore, setHasMore] = useState(false)
  const loadingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const buildParams = useCallback((page: number, currentFilters: ProductFilters) => {
    const params: Record<string, string | number | boolean | undefined> = {
      page,
      limit: pageSize,
    }

    if (currentFilters.query) params.q = currentFilters.query
    if (currentFilters.category) params.category = currentFilters.category
    if (currentFilters.minPrice !== null) params.min_price = currentFilters.minPrice
    if (currentFilters.maxPrice !== null) params.max_price = currentFilters.maxPrice
    if (currentFilters.sortBy !== 'newest') params.sort = currentFilters.sortBy
    if (currentFilters.inStock) params.in_stock = true

    return params
  }, [pageSize])

  const fetchProducts = useCallback(async (page: number, currentFilters: ProductFilters, append = false) => {
    if (loadingRef.current) return
    loadingRef.current = true

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      setError(null)
      if (!append) setLoading(true)

      const params = buildParams(page, currentFilters)
      const response = await apiPaginated<Product>(
        '/commerce/products',
        { params, signal: abortControllerRef.current.signal }
      )

      if (append) {
        setProducts((prev) => [...prev, ...response.data])
      } else {
        setProducts(response.data)
      }

      setPagination(response.meta)
      setHasMore(response.meta.page < response.meta.totalPages)
    } catch (err: any) {
      if (err.name === 'AbortError') return
      setError(err.message || 'Failed to load products')
      if (!append) setProducts([])
    } finally {
      if (!append) setLoading(false)
      loadingRef.current = false
    }
  }, [buildParams])

  const setFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    setFiltersState((prev) => {
      const updated = { ...prev, ...newFilters }
      // Reset to page 1 when filters change
      fetchProducts(1, updated, false)
      return updated
    })
  }, [fetchProducts])

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS)
    fetchProducts(1, DEFAULT_FILTERS, false)
  }, [fetchProducts])

  const loadMore = useCallback(async () => {
    if (hasMore && !loadingRef.current) {
      const nextPage = pagination.page + 1
      await fetchProducts(nextPage, filters, true)
    }
  }, [hasMore, pagination.page, filters, fetchProducts])

  const refresh = useCallback(async () => {
    await fetchProducts(1, filters, false)
  }, [filters, fetchProducts])

  // Initial load
  useEffect(() => {
    fetchProducts(1, filters, false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'sortBy') return value !== 'newest'
    if (key === 'inStock') return value === true
    if (key === 'query') return value !== ''
    return value !== '' && value !== null && value !== false
  })

  return {
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
  }
}