'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { usePathname } from 'next/navigation'

export function Header() {
  const { state, logout } = useAuth()
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-12 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">Kamba</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/marketplace" className={pathname === '/marketplace' ? 'text-primary' : 'text-muted-foreground'}>
            Marketplace
          </Link>
          <Link href="/marketplace/stores" className={pathname.startsWith('/marketplace/stores') ? 'text-primary' : 'text-muted-foreground'}>
            Stores
          </Link>
          <Link href="/marketplace/services" className={pathname.startsWith('/marketplace/services') ? 'text-primary' : 'text-muted-foreground'}>
            Services
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {state.isAuthenticated ? (
            <>
              <Link href="/cart" className="relative">
                Cart
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
              </Link>
              <button
                onClick={() => logout()}
                className="text-sm text-muted-foreground hover:text-destructive"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm font-medium">
                Sign in
              </Link>
              <Link href="/auth/register" className="text-sm font-medium underline">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}