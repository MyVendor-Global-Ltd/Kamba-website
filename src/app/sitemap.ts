import type { MetadataRoute } from 'next'

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.kamba.ng').replace(/\/$/, '')
const apiBase = (process.env.NODE_ENV === 'production' ? 'https://kamba-api-8l80.onrender.com' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001')).replace(/\/$/, '')
const maxEntriesPerType = 10000

type ApiRecord = Record<string, unknown>

function unwrap(value: unknown): ApiRecord {
  if (!value || typeof value !== 'object') return {}
  const record = value as ApiRecord
  if (record.result && typeof record.result === 'object') return record.result as ApiRecord
  return record
}

async function fetchPublicPage(path: string): Promise<ApiRecord> {
  if (!apiBase) return {}
  try {
    const response = await fetch(`${apiBase}/api/v1${path}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
    })
    if (!response.ok) return {}
    return unwrap(await response.json())
  } catch {
    return {}
  }
}

function absolute(path: string) {
  return new URL(path, siteUrl).toString()
}

function validDate(value: unknown): Date | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: absolute('/'), changeFrequency: 'daily', priority: 1 },
    { url: absolute('/marketplace'), changeFrequency: 'daily', priority: 0.9 },
    { url: absolute('/marketplace/products'), changeFrequency: 'daily', priority: 0.9 },
    { url: absolute('/marketplace/stores'), changeFrequency: 'daily', priority: 0.9 },
    { url: absolute('/marketplace/services'), changeFrequency: 'daily', priority: 0.9 },
    { url: absolute('/sell-online-in-nigeria'), changeFrequency: 'monthly', priority: 0.8 },
  ]

  if (!apiBase) return entries

  const [stores, products, services] = await Promise.all([
    (async () => {
      const records: ApiRecord[] = []
      for (let page = 1; records.length < maxEntriesPerType; page += 1) {
        const result = await fetchPublicPage(`/vendors/stores?page=${page}&limit=100`)
        const batch = Array.isArray(result.stores) ? result.stores as ApiRecord[] : []
        records.push(...batch)
        if (batch.length < 100 || result.has_more === false) break
      }
      return records.slice(0, maxEntriesPerType)
    })(),
    (async () => {
      const records: ApiRecord[] = []
      for (let offset = 0; records.length < maxEntriesPerType; offset += 100) {
        const result = await fetchPublicPage(`/commerce/products?offset=${offset}&limit=100&stock_status=all`)
        const batch = Array.isArray(result.products) ? result.products as ApiRecord[] : []
        records.push(...batch)
        if (batch.length < 100 || result.has_more === false) break
      }
      return records.slice(0, maxEntriesPerType)
    })(),
    (async () => {
      const records: ApiRecord[] = []
      for (let page = 1; records.length < maxEntriesPerType; page += 1) {
        const result = await fetchPublicPage(`/vendors/services?page=${page}&limit=100`)
        const batch = Array.isArray(result.services) ? result.services as ApiRecord[] : []
        records.push(...batch)
        if (batch.length < 100 || result.has_more === false) break
      }
      return records.slice(0, maxEntriesPerType)
    })(),
  ])

  for (const store of stores) {
    if (typeof store.slug !== 'string' || !store.slug) continue
    entries.push({ url: absolute(`/store/${encodeURIComponent(store.slug)}`), changeFrequency: 'weekly', priority: 0.8 })
  }
  for (const product of products) {
    if (typeof product.id !== 'string' || !product.id) continue
    entries.push({
      url: absolute(`/marketplace/products/${encodeURIComponent(product.id)}`),
      lastModified: validDate(product.updated_at) || validDate(product.created_at),
      changeFrequency: 'daily',
      priority: 0.75,
    })
  }
  for (const service of services) {
    if (typeof service.slug !== 'string' || !service.slug) continue
    entries.push({
      url: absolute(`/marketplace/services/${encodeURIComponent(service.slug)}`),
      lastModified: validDate(service.updated_at) || validDate(service.created_at),
      changeFrequency: 'weekly',
      priority: 0.75,
    })
  }
  return entries
}
