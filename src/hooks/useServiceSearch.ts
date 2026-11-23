'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { apiJson } from '@/lib/api'
import { isMockMode } from '@/lib/mock-api'
import type { MarketplaceFilterState } from '@/components/marketplace/product-filters'
import type { Service } from '@/types/vendor'

export type ServiceFilters = MarketplaceFilterState

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

const DEFAULT_FILTERS: ServiceFilters = { query: '', category: '', location: '', latitude: null, longitude: null, radius: 15, minPrice: null, maxPrice: null, inStock: false, sortBy: 'newest' }

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
      const params: Record<string, string | number | boolean | undefined> = {
        page,
        limit: pageSize,
        category: currentFilters.category || undefined,
        lat: currentFilters.latitude ?? undefined,
        lng: currentFilters.longitude ?? undefined,
        radius: currentFilters.latitude !== null && currentFilters.longitude !== null ? currentFilters.radius : undefined,
        ...(isMockMode ? {
          search: currentFilters.query.trim() || undefined,
          location: currentFilters.location.trim() || undefined,
        } : {}),
      }
      const result = await apiJson<{
        services: Array<Service & {
          service_title?: string
          location_text?: string
          service_area_text?: string
          price_range?: string
          vendor_profiles?: { is_verified?: boolean; verification_tier?: string }
        }>
        page: number
        limit: number
        count: number
        has_more: boolean
      }>('/vendors/services', { params, signal: controller.signal })
      if (requestId !== requestIdRef.current) return

      const mappedServices: Service[] = result.services.map((service) => {
        const tier = service.vendor_profiles?.verification_tier
        const verificationStatus: Service['verification_status'] = service.verification_status || (
          service.vendor_profiles?.is_verified
            ? (tier === 'business' ? 'business' : tier === 'nin' ? 'nin' : 'basic')
            : 'pending'
        )
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
      if (append) {
        setServices((previous) => {
          const existing = new Set(previous.map((service) => service.id))
          return [...previous, ...mappedServices.filter((service) => !existing.has(service.id))]
        })
      } else {
        setServices(mappedServices)
      }
      setPagination({ page: result.page, limit: result.limit, total: result.count, totalPages: Math.max(1, Math.ceil(result.count / result.limit)) })
      setHasMore(result.has_more)
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

  const requestFilters = useMemo(() => ({
    ...filters,
    query: isMockMode ? filters.query : '',
    location: isMockMode ? filters.location : '',
  }), [filters, isMockMode])

  useEffect(() => {
    const timeout = window.setTimeout(() => { void fetchServices(1, requestFilters) }, 250)
    return () => window.clearTimeout(timeout)
  }, [requestFilters, fetchServices])

  useEffect(() => () => abortControllerRef.current?.abort(), [])

  const loadMore = useCallback(async () => {
    if (hasMore && !loadingRef.current) await fetchServices(pagination.page + 1, filters, true)
  }, [hasMore, pagination.page, filters, fetchServices])

  const refresh = useCallback(async () => {
    await fetchServices(1, filters)
  }, [filters, fetchServices])

  const hasActiveFilters = filters.query.trim() !== '' || filters.category !== '' || filters.location.trim() !== '' || filters.latitude !== null || filters.longitude !== null

  return { services, loading, error, filters, setFilters, clearFilters, hasActiveFilters, pagination, loadMore, hasMore, refresh }
}
