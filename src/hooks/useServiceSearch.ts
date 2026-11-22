'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { apiJson, apiPaginated, PaginatedResponse } from '@/lib/api'
import { Service } from '@/types/vendor'

export interface ServiceFilters {
  query: string
  category: string
  minPrice: number | null
  maxPrice: number | null
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'rating'
  location: string
  inStock: boolean
}

export interface UseServiceSearchOptions {
  initialFilters?: Partial<ServiceFilters>
  pageSize?: number
}

export interface UseServiceSearchReturn {
  services: Service[]
  loading: boolean
  error: string | null
  filters: ServiceFilters
  setFilters: (filters: Partial<ServiceFilters>) => void
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

const DEFAULT_FILTERS: ServiceFilters = {
  query: '',
  category: '',
  minPrice: null,
  maxPrice: null,
  sortBy: 'newest',
  location: '',
  inStock: false,
}

export function useServiceSearch(options: UseServiceSearchOptions = {}): UseServiceSearchReturn {
  const { initialFilters = {}, pageSize = 12 } = options
  
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<ServiceFilters>({
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

  const buildParams = useCallback((page: number, currentFilters: ServiceFilters) => {
    const params: Record<string, string | number | boolean | undefined> = {
      page,
      limit: pageSize,
    }

    if (currentFilters.query) params.q = currentFilters.query
    if (currentFilters.category) params.category = currentFilters.category
    if (currentFilters.minPrice !== null) params.min_price = currentFilters.minPrice
    if (currentFilters.maxPrice !== null) params.max_price = currentFilters.maxPrice
    if (currentFilters.sortBy !== 'newest') params.sort = currentFilters.sortBy
    if (currentFilters.location) params.location = currentFilters.location

    return params
  }, [pageSize])

  const fetchServices = useCallback(async (page: number, currentFilters: ServiceFilters, append = false) => {
    if (loadingRef.current) return
    loadingRef.current = true

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      setError(null)
      if (!append) setLoading(true)

      const params = buildParams(page, currentFilters)
      const response = await apiPaginated<Service>(
        '/commerce/services',
        { params, signal: abortControllerRef.current.signal }
      )

      if (append) {
        setServices((prev) => [...prev, ...response.data])
      } else {
        setServices(response.data)
      }

      setPagination(response.meta)
      setHasMore(response.meta.page < response.meta.totalPages)
    } catch (err: any) {
      if (err.name === 'AbortError') return
      setError(err.message || 'Failed to load services')
      if (!append) setServices([])
    } finally {
      if (!append) setLoading(false)
      loadingRef.current = false
    }
  }, [buildParams])

  const setFilters = useCallback((newFilters: Partial<ServiceFilters>) => {
    setFiltersState((prev) => {
      const updated = { ...prev, ...newFilters }
      fetchServices(1, updated, false)
      return updated
    })
  }, [fetchServices])

  const clearFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS)
    fetchServices(1, DEFAULT_FILTERS, false)
  }, [fetchServices])

  const loadMore = useCallback(async () => {
    if (hasMore && !loadingRef.current) {
      const nextPage = pagination.page + 1
      await fetchServices(nextPage, filters, true)
    }
  }, [hasMore, pagination.page, filters, fetchServices])

  const refresh = useCallback(async () => {
    await fetchServices(1, filters, false)
  }, [filters, fetchServices])

  useEffect(() => {
    fetchServices(1, filters, false)
  }, [])

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'sortBy') return value !== 'newest'
    if (key === 'query') return value !== ''
    return value !== '' && value !== null && value !== false
  })

  return {
    services,
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