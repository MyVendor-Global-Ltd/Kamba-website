const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.kamba.ng'

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
      const data = await res.json()
      return data.access_token || null
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

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (res.status === 401) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      return fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })
    }
  }

  return res
}

export async function apiJson<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await apiFetch(path, options)
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.message || `API error: ${res.status}`)
  }
  const data = await res.json()
  return normalizeResponse<T>(data)
}

export { API_BASE }