import type { Metadata } from 'next'
import ServiceDetailClientPage from './client-page'
import { getSeoService } from '@/lib/seo-data'
import type { ServiceProfile } from '@/types/vendor'

type ServiceSeo = ServiceProfile & {
  service_title?: string
  location_text?: string
  service_area_text?: string
  service_images?: string[]
  tags?: string[]
  business_profiles?: {
    business_name?: string
    tagline?: string | null
    location_visibility?: string
    location_text?: string | null
    service_area_text?: string | null
  } | null
  vendor_profiles?: { is_verified?: boolean; verification_tier?: string } | null
}

type PageProps = { params: Promise<{ slug: string }> }

function serviceUrl(slug: string) {
  return `https://kamba.ng/marketplace/services/${encodeURIComponent(slug)}`
}

function jsonLd(value: Record<string, unknown>) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

async function loadService(slug: string): Promise<ServiceSeo | null> {
  const value = await getSeoService(slug)
  if (!value || typeof value !== 'object') return null
  const raw = value as ServiceSeo
  const tier = raw.vendor_profiles?.verification_tier
  const verificationStatus = raw.verification_status || (raw.vendor_profiles?.is_verified
    ? tier === 'business' ? 'business' : tier === 'nin' ? 'nin' : 'basic'
    : 'pending')
  return {
    ...raw,
    name: raw.name || raw.service_title || 'Service',
    city: raw.city || raw.location_text || raw.service_area_text,
    vendor_id: raw.vendor_id || '',
    is_active: raw.is_active ?? true,
    created_at: raw.created_at || '',
    updated_at: raw.updated_at || '',
    verification_status: verificationStatus as ServiceProfile['verification_status'],
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const service = await loadService(slug)
  if (!service) return { title: 'Service unavailable', robots: { index: false, follow: true } }

  const name = service.business_profiles?.business_name || service.name
  const location = service.business_profiles?.location_visibility === 'public'
    ? service.business_profiles.location_text || service.location_text || service.city
    : service.business_profiles?.service_area_text || service.service_area_text || service.city
  const title = `${name} — ${service.category || 'Local service'} in ${location || 'Nigeria'}`
  const description = [
    service.business_profiles?.tagline || service.description || `Explore ${service.name} on Kamba.`,
    location ? `Available in ${location}.` : 'Discover local service providers across Nigeria.',
    'View details and send a booking request on Kamba.',
  ].filter(Boolean).join(' ').slice(0, 300)
  const images = (service.service_images || []).filter(Boolean)
  const url = serviceUrl(slug)

  return {
    title,
    description,
    keywords: [name, service.name, service.category, location, ...(service.tags || []), 'book local services Nigeria'].filter(Boolean) as string[],
    alternates: { canonical: url },
    openGraph: { type: 'website', title, description, url, siteName: 'Kamba', locale: 'en_NG', images },
    twitter: { card: 'summary_large_image', title, description, images },
  }
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params
  const service = await loadService(slug)
  const name = service?.business_profiles?.business_name || service?.name || 'Local service'
  const location = service?.business_profiles?.location_visibility === 'public'
    ? service.business_profiles.location_text || service.location_text || service.city
    : service?.business_profiles?.service_area_text || service?.service_area_text || service?.city
  const schema = service ? {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    serviceType: service.category || undefined,
    description: service.description || service.business_profiles?.tagline || `${service.name} listed on Kamba.`,
    url: serviceUrl(slug),
    image: service.service_images || undefined,
    provider: { '@type': 'Organization', name },
    areaServed: location || 'Nigeria',
  } : null

  return (
    <>
      {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />}
      <ServiceDetailClientPage initialService={service} />
    </>
  )
}
