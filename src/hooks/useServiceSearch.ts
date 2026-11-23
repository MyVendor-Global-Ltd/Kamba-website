'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { apiPaginated } from '@/lib/api'
import { Service } from '@/types/vendor'

export interface ServiceFilters {
  query: string
  category: string
  location: string
  sortBy: 'newest'
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
  pagination: { page: number; limit: number; total: number; totalPages: number }
  loadMore: () => Promise<void>
  hasMore: boolean
  refresh: () => Promise<void>
}

const DEFAULT_FILTERS: ServiceFilters = { query: '', category: '', location: '', sortBy: 'newest' }

export function useServiceSearch(options: UseServiceSearchOptions = {}): UseServiceSearchReturn {
  const { initialFilters = {}, pageSize = 12 } = options
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<ServiceFilters>({ ...DEFAULT_FILTERS, ...initialFilters })
  const [pagination, setPagination] = useState({ page: 1, limit: pageSize, total: 0, totalPages: 0 })
  const [hasMore, setHasMore] = useState(false)
  const loadingRef = useRef(false)
  const requestIdRef = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchServices = useCallback(async (page: number, currentFilters: ServiceFilters, append = false) => {
    if (append && loadingRef.current) return
    if (!append) abortControllerRef.current?.abort()

    const controller = new AbortController()
    abortControllerRef.current = controller
    const requestId = ++requestIdRef.current
    loadingRef.current = true

    try {
      setError(null)
      setLoading(true)
      const params = {
        page,
        limit: pageSize,
        q: currentFilters.query.trim() || undefined,
        category: currentFilters.category || undefined,
        location: currentFilters.location.trim() || undefined,
      }
      const result = await apiPaginated<Service>('/commerce/services', { params, signal: controller.signal })
      if (requestId !== requestIdRef.current) return

      if (append) {
        setServices((previous) => {
          const existing = new Set(previous.map((service) => service.id))
          return [...previous, ...result.data.filter((service) => !existing.has(service.id))]
        })
      } else {
        setServices(result.data)
      }
      setPagination(result.meta)
      setHasMore(result.meta.page < result.meta.totalPages)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      if (requestId === requestIdRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load services')
        if (!append) setServices([])
      }
    } finally {
      if (requestId === requestIdRef.current) {
        loadingRef.current = false
        setLoading(false)
      }
    }
  }, [pageSize])

  const setFilters = useCallback((next: Partial<ServiceFilters>) => {
    setFiltersState((previous) => ({ ...previous, ...next }))
  }, [])

  const clearFilters = useCallback(() => setFiltersState(DEFAULT_FILTERS), [])

  useEffect(() => {
    const timeout = window.setTimeout(() => { void fetchServices(1, filters) }, 250)
    return () => window.clearTimeout(timeout)
  }, [filters, fetchServices])

  useEffect(() => () => abortControllerRef.current?.abort(), [])

  const loadMore = useCallback(async () => {
    if (hasMore && !loadingRef.current) await fetchServices(pagination.page + 1, filters, true)
  }, [hasMore, pagination.page, filters, fetchServices])

  const refresh = useCallback(async () => {
    await fetchServices(1, filters)
  }, [filters, fetchServices])

  const hasActiveFilters = filters.query.trim() !== '' || filters.category !== '' || filters.location.trim() !== ''

  return { services, loading, error, filters, setFilters, clearFilters, hasActiveFilters, pagination, loadMore, hasMore, refresh }
}
