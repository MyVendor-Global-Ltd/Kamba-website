import type { Metadata } from 'next'
import StoreDetailClientPage from './client-page'
import { getSeoStore, getSeoStoreProducts } from '@/lib/seo-data'
import type { Product } from '@/types/commerce'

type StoreSeo = {
  id: string
  slug: string
  store_name?: string
  name?: string
  category?: string
  description?: string
  store_image_url?: string | null
  store_logo_url?: string | null
  store_slideshow_images?: string[] | null
  location_text?: string | null
  business_profiles?: {
    business_name?: string
    tagline?: string | null
    location_visibility?: string
    location_text?: string | null
    service_area_text?: string | null
  } | null
}

type PageProps = { params: Promise<{ slug: string }> }

function storeUrl(slug: string) {
  return `https://kamba.ng/store/${encodeURIComponent(slug)}`
}

function jsonLd(value: Record<string, unknown>) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

async function loadStore(slug: string): Promise<StoreSeo | null> {
  const value = await getSeoStore(slug)
  if (!value || typeof value !== 'object' || !('slug' in value)) return null
  return value as StoreSeo
}

async function loadProducts(slug: string): Promise<Product[]> {
  return (await getSeoStoreProducts(slug)) as Product[]
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const store = await loadStore(slug)
  if (!store) return { title: 'Store unavailable', robots: { index: false, follow: true } }

  const name = store.store_name || store.name || 'Independent store'
  const category = store.category ? ` — ${store.category}` : ''
  const location = store.business_profiles?.location_visibility === 'public'
    ? store.business_profiles.location_text || store.location_text || store.business_profiles.service_area_text
    : store.business_profiles?.service_area_text
  const title = `${name}${category} | Shop local in Nigeria`
  const description = [
    store.business_profiles?.tagline || store.description || `Explore products from ${name} on Kamba.`,
    location ? `Serving ${location}.` : '',
    'Browse prices and shop from an independent Nigerian store.',
  ].filter(Boolean).join(' ').slice(0, 300)
  const images = [store.store_image_url, store.store_logo_url, ...(store.store_slideshow_images || [])].filter((image): image is string => Boolean(image))
  const url = storeUrl(slug)

  return {
    title,
    description,
    keywords: [name, store.category, location, 'online store Nigeria', 'shop local', 'Kamba'].filter(Boolean) as string[],
    alternates: { canonical: url },
    openGraph: { type: 'website', title, description, url, siteName: 'Kamba', locale: 'en_NG', images },
    twitter: { card: 'summary_large_image', title, description, images },
  }
}

export default async function StoreDetailPage({ params }: PageProps) {
  const { slug } = await params
  const [store, products] = await Promise.all([loadStore(slug), loadProducts(slug)])
  const name = store?.store_name || store?.name || 'Independent store'
  const publicLocation = store?.business_profiles?.location_visibility === 'public'
    ? store.business_profiles.location_text || store.location_text
    : null
  const serviceArea = store?.business_profiles?.service_area_text
  const schema = store ? {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name,
    description: store.description || store.business_profiles?.tagline || `Shop products from ${name} on Kamba.`,
    url: storeUrl(slug),
    image: [store.store_image_url, store.store_logo_url, ...(store.store_slideshow_images || [])].filter(Boolean),
    logo: store.store_logo_url || undefined,
    category: store.category || undefined,
    areaServed: publicLocation || serviceArea || 'Nigeria',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${name} products`,
      itemListElement: products.slice(0, 100).map((product) => ({
        '@type': 'Product',
        name: product.name,
        url: `https://kamba.ng/marketplace/products/${encodeURIComponent(product.id)}`,
        image: product.images?.[0] || product.image_url || undefined,
        offers: {
          '@type': 'Offer',
          price: (product.price / 100).toFixed(2),
          priceCurrency: 'NGN',
          availability: product.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        },
      })),
    },
  } : null

  return (
    <>
      {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />}
      <StoreDetailClientPage initialStore={store as any} initialProducts={products} />
    </>
  )
}
