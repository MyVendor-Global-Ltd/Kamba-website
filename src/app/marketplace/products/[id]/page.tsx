import type { Metadata } from 'next'
import ProductDetailClientPage from './client-page'
import { getSeoProduct } from '@/lib/seo-data'
import type { Product } from '@/types/commerce'

type ProductSeo = Product & {
  store_slug?: string
  store_name?: string
  original_price?: number
  average_rating?: number
  review_count?: number
}

type PageProps = { params: Promise<{ id: string }> }

function productUrl(id: string) {
  return `https://kamba.ng/marketplace/products/${encodeURIComponent(id)}`
}

function jsonLd(value: Record<string, unknown>) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function formatNaira(kobo: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 2 }).format(kobo / 100)
}

async function loadProduct(id: string): Promise<ProductSeo | null> {
  const value = await getSeoProduct(id)
  if (!value || typeof value !== 'object' || !('id' in value)) return null
  const product = value as ProductSeo
  return { ...product, image_url: product.image_url || product.images?.[0] }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const product = await loadProduct(id)
  if (!product) return { title: 'Product unavailable', robots: { index: false, follow: true } }

  const title = `${product.name} price in Nigeria`
  const description = product.description?.trim()
    ? `${product.description.trim().slice(0, 110)} Listed for ${formatNaira(product.price)} by ${product.store_name || 'a local seller'} on Kamba.`
    : `Check the current price of ${product.name} from ${product.store_name || 'a local seller'} on Kamba. Discover products from independent Nigerian stores.`
  const images = (product.images?.length ? product.images : product.image_url ? [product.image_url] : []).filter(Boolean) as string[]
  const url = productUrl(id)

  return {
    title,
    description,
    keywords: [product.name, product.category, ...(product.tags || []), 'buy in Nigeria', 'local store'].filter(Boolean) as string[],
    alternates: { canonical: url },
    openGraph: { type: 'website', title, description, url, siteName: 'Kamba', locale: 'en_NG', images },
    twitter: { card: 'summary_large_image', title, description, images },
  }
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params
  const product = await loadProduct(id)
  const inStock = Boolean(product && product.is_active && product.stock_quantity > 0)
  const price = product ? (product.price / 100).toFixed(2) : undefined
  const schema = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} listed by ${product.store_name || 'a Nigerian seller'} on Kamba.`,
    sku: product.id,
    category: product.category || undefined,
    image: (product.images?.length ? product.images : product.image_url ? [product.image_url] : []).filter(Boolean),
    brand: product.store_name ? { '@type': 'Brand', name: product.store_name } : undefined,
    offers: {
      '@type': 'Offer',
      url: productUrl(id),
      price,
      priceCurrency: 'NGN',
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: product.store_name ? { '@type': 'Organization', name: product.store_name, url: `https://kamba.ng/store/${encodeURIComponent(product.store_slug || '')}` } : undefined,
    },
  } : null

  return (
    <>
      {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />}
      <ProductDetailClientPage initialProduct={product} />
    </>
  )
}
