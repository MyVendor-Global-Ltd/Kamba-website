import { cache } from 'react'

const apiBase = (process.env.NODE_ENV === 'production' ? 'https://kamba-api-8l80.onrender.com' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001')).replace(/\/$/, '')

async function publicApi<T>(path: string): Promise<T | null> {
  if (!apiBase) return null
  try {
    const response = await fetch(`${apiBase}/api/v1${path}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!response.ok) return null
    const payload = await response.json()
    const data = payload?.result ?? payload
    return data as T
  } catch {
    return null
  }
}

export const getSeoProduct = cache(async (id: string) => {
  const data = await publicApi<Record<string, any>>(`/commerce/products/${encodeURIComponent(id)}`)
  return data?.product ?? data
})

export const getSeoStore = cache(async (slug: string) => {
  const data = await publicApi<{ store?: Record<string, any> }>(`/vendors/stores/${encodeURIComponent(slug)}`)
  return data?.store ?? null
})

export const getSeoStoreProducts = cache(async (slug: string) => {
  const data = await publicApi<{ products?: Record<string, any>[] }>(
    `/commerce/products?store=${encodeURIComponent(slug)}&limit=100&stock_status=all`,
  )
  return data?.products ?? []
})

export const getSeoService = cache(async (slug: string) => {
  const data = await publicApi<{ service_profile?: Record<string, any>; service?: Record<string, any> }>(
    `/vendors/services/${encodeURIComponent(slug)}`,
  )
  return data?.service_profile ?? data?.service ?? null
})
