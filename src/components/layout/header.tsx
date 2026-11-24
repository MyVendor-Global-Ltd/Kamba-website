'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useCartContext } from '@/context/CartContext'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { KambaLogo } from '@/components/layout/kamba-logo'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { isMockMode } from '@/lib/mock-api'

export function Header() {
  const { state, logout } = useAuth()
  const { cart } = useCartContext()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [searchOpen])

  const navLinks = [
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/marketplace/stores', label: 'Stores' },
    { href: '/marketplace/services', label: 'Services' },
    { href: '/vendor/onboard', label: 'Sell on Kamba' },
    { href: '/download', label: 'Get the app' },
    ...(state.user?.role === 'vendor'
      ? [
          { href: '/vendor/service-requests', label: 'Service requests' },
          { href: '/vendor/pickup', label: 'Pickup desk' },
        ]
      : state.isAuthenticated
        ? [{ href: '/service-requests', label: 'My requests' }]
        : []),
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <KambaLogo iconSize={34} />
            <span className="hidden sm:inline-block w-px h-6 bg-border mx-2" />
            <span className="hidden sm:inline text-sm font-medium text-text-secondary">Marketplace</span>
            {isMockMode && <span className="hidden md:inline-flex rounded-full bg-gold-soft px-2.5 py-1 text-[11px] font-semibold text-text-primary">Prototype</span>}
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1" role="navigation" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'bg-coral-dim text-coral'
                    : 'text-text-secondary hover:text-text-primary hover:bg-ink-raised/50'
                )}
                aria-current={pathname === link.href || pathname.startsWith(link.href + '/') ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search - Desktop */}
          <div className="hidden lg:flex-1 max-w-xl">
            <Link href="/search" className="block">
              <div className="relative group">
                <Input
                  ref={searchRef}
                  placeholder="Search products, services, stores..."
                  className="bg-ink-raised/50 border-border/50 placeholder:text-text-tertiary h-11 pr-12"
                  readOnly
                  aria-label="Search marketplace"
                />
                <svg
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary group-hover:text-coral transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Cart */}
            <Link href="/cart" className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-ink-raised/50 transition-all duration-200" aria-label="Shopping cart">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a2 2 0 00-2-2H6a2 2 0 00-2 2v18a2 2 0 002 2h12a2 2 0 002-2v-4" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11l2 2m0 0l2-2m-2 2l-2-2" />
              </svg>
              {cart.itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-coral text-ink text-[10px] font-bold">
                                {cart.itemCount > 99 ? '99+' : cart.itemCount}
                </span>
              )}
            </Link>

            {/* Auth */}
            {state.isAuthenticated ? (
              <>
                <Link href="/account" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-ink-raised/50 transition-all duration-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Account
                </Link>
                {state.user?.role === 'vendor' && (
                  <Link href="/vendor/dashboard" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-coral hover:bg-coral-dim transition-all duration-200">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Vendor
                  </Link>
                )}
                <button
                  onClick={() => logout()}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-ink-raised/50 transition-all duration-200">
                  Sign in
                </Link>
                <Link href="/auth/register" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-coral text-ink hover:bg-coral/90 shadow-lg shadow-coral/25 transition-all duration-200">
                  Sign up
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-ink-raised/50 transition-all duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div id="mobile-menu" className="lg:hidden animate-slide-up border-t border-border/50 py-4">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-4 py-3 rounded-lg text-base font-medium transition-all duration-200',
                    pathname === link.href || pathname.startsWith(link.href + '/')
                      ? 'bg-coral-dim text-coral'
                      : 'text-text-secondary hover:text-text-primary hover:bg-ink-raised/50'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-border/50" />
              <Link
                href="/search"
                className="px-4 py-3 rounded-lg text-base font-medium text-text-secondary hover:text-text-primary hover:bg-ink-raised/50 transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Search marketplace
              </Link>
              {state.isAuthenticated ? (
                <>
                  <Link
                    href="/account"
                    className="px-4 py-3 rounded-lg text-base font-medium text-text-secondary hover:text-text-primary hover:bg-ink-raised/50 transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Account
                  </Link>
                  {state.user?.role === 'vendor' && (
                    <Link
                      href="/vendor/dashboard"
                      className="px-4 py-3 rounded-lg text-base font-medium text-coral hover:bg-coral-dim transition-all duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Vendor Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="px-4 py-3 rounded-lg text-base font-medium text-destructive hover:bg-destructive/10 transition-all duration-200 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/auth/login"
                    className="px-4 py-3 rounded-lg text-base font-medium text-text-secondary hover:text-text-primary hover:bg-ink-raised/50 transition-all duration-200 text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-4 py-3 rounded-lg text-base font-medium bg-coral text-ink hover:bg-coral/90 shadow-lg shadow-coral/25 transition-all duration-200 text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}