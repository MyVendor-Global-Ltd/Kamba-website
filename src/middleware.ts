import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedPaths = [
  '/cart',
  '/checkout',
  '/orders',
  '/vendor',
  '/auth/profile',
]

function apiUsesSeparateOrigin(request: NextRequest) {
  // Production API requests are proxied through this site so auth cookies
  // remain first-party on both the primary domain and the Vercel fallback.
  if (process.env.NODE_ENV === 'production') return false
  const configuredApi = process.env.NEXT_PUBLIC_API_URL
  if (!configuredApi) return false
  try {
    return new URL(configuredApi).origin !== request.nextUrl.origin
  } catch {
    return false
  }
}

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_KAMBA_MOCK_MODE === 'true') return NextResponse.next()

  // In production, the API is same-origin through the Vercel rewrite and its
  // host-only HttpOnly cookies are visible to this middleware.
  if (apiUsesSeparateOrigin(request)) return NextResponse.next()

  const token = request.cookies.get('access_token')?.value
  const path = request.nextUrl.pathname
  const isProtected = protectedPaths.some((p) => path.startsWith(p))

  if (!token && isProtected) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('callbackUrl', `${path}${request.nextUrl.search}`)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/cart/:path*', '/checkout/:path*', '/orders/:path*', '/vendor/:path*', '/auth/profile/:path*'],
}
