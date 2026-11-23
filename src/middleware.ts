import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const protectedPaths = [
  '/cart',
  '/checkout',
  '/orders',
  '/vendor',
  '/auth/profile',
]

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_KAMBA_MOCK_MODE === 'true') return NextResponse.next()

  const token = request.cookies.get('access_token')?.value
  const path = request.nextUrl.pathname

  const isProtected = protectedPaths.some((p) => path.startsWith(p))

  if (!token && isProtected) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/cart/:path*', '/checkout/:path*', '/orders/:path*', '/vendor/:path*', '/auth/profile/:path*'],
}