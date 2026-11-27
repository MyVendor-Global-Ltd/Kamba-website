import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kamba.ng'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/marketplace/', '/store/', '/search'],
      disallow: ['/account/', '/admin/', '/auth/', '/cart', '/checkout/', '/orders/', '/vendor/', '/api/'],
    },
    sitemap: new URL('/sitemap.xml', siteUrl).toString(),
    host: siteUrl,
  }
}
