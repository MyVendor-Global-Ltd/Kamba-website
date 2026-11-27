import { isMockMode, mockApiJson } from '@/lib/mock-api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001'

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) return null
      await res.json().catch(() => ({}))
      // The API rotates HttpOnly cookies and does not return a readable access token.
      return 'refreshed'
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

function normalizeResponse<T>(data: any): T {
  if (data && data.success !== undefined && data.result !== undefined) {
    return data.result
  }
  return data
}

export interface ApiErrorResponse {
  message: string
  status: number
  code?: string
  details?: Record<string, string[]>
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly message: string,
    public readonly code?: string,
    public readonly details?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
  timeout?: number
}

function buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = path.startsWith('http') ? path : path.startsWith('/api/v1/') ? `${API_BASE}${path}` : path.startsWith('/api/') ? `${API_BASE}${path}` : `${API_BASE}/api/v1${path.startsWith('/') ? path : `/${path}`}`
  if (!params) return url
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })
  const query = searchParams.toString()
  return query ? `${url}?${query}` : url
}

export async function apiFetch(
  path: string,
  options: RequestOptions = {}
): Promise<Response> {
  const { params, signal, timeout, ...fetchOptions } = options
  const url = buildUrl(path, params)

  const controller = new AbortController()
  const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null
  const abortFromCaller = () => controller.abort()

  if (signal?.aborted) controller.abort()
  else signal?.addEventListener('abort', abortFromCaller, { once: true })

  const requestInit: RequestInit = {
    ...fetchOptions,
    credentials: 'include',
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  }

  try {
    const res = await fetch(url, requestInit)

    if (res.status === 401) {
      const newToken = await refreshAccessToken()
      if (newToken) {
        // Retry the original request once with the rotated HttpOnly cookies.
        // The retry shares the caller's abort signal and timeout.
        return fetch(url, requestInit)
      }
    }

    return res
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
    signal?.removeEventListener('abort', abortFromCaller)
  }
}

export async function apiJson<T = any>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  if (isMockMode) return mockApiJson<T>(path, options)
  const res = await apiFetch(path, options)
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new ApiError(
      res.status,
      error.message || error.error || `API error: ${res.status}`,
      error.code,
      error.details
    )
  }
  const data = await res.json()
  return normalizeResponse<T>(data)
}

export async function apiPaginated<T = any>(
  path: string,
  options: RequestOptions = {}
): Promise<PaginatedResponse<T>> {
  return apiJson<PaginatedResponse<T>>(path, options)
}

export { API_BASE }