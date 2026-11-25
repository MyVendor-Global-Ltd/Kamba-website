'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useCartContext } from '@/context/CartContext'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, ChevronDown, LogOut, Menu, Search, ShoppingCart, UserRound, X } from 'lucide-react'
import { KambaLogo } from '@/components/layout/kamba-logo'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { isMockMode } from '@/lib/mock-api'

export function Header() {
  const { state, logout } = useAuth()
  const { cart } = useCartContext()
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const isVendor = state.user?.role === 'vendor'
  const closeMenu = () => setMenuOpen(false)

  const menuLinkClass = (href: string) =>
    `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
      pathname === href || (href !== '/' && pathname.startsWith(href + '/'))
        ? 'bg-primary-soft text-primary'
        : 'text-text-secondary hover:bg-ink-raised/70 hover:text-text-primary'
    }`

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur">
      <div className="container mx-auto">
        <div className="flex h-[68px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <KambaLogo iconSize={34} href={state.isAuthenticated ? '/search' : '/'} />
            <span className="hidden h-6 w-px bg-border sm:block" />
            <span className="hidden text-sm font-medium text-text-secondary sm:block">Marketplace</span>
            {isMockMode && <span className="hidden rounded-full bg-gold-soft px-2.5 py-1 text-[11px] font-semibold text-text-primary md:inline-flex">Prototype</span>}
          </div>

          <Link href="/search" className="hidden max-w-xl flex-1 items-center gap-3 rounded-xl border border-border bg-ink-raised/50 px-4 py-2.5 text-sm text-text-tertiary transition-colors hover:border-primary/40 hover:text-text-secondary lg:flex">
            <Search className="h-4 w-4" />
            <span>Search products, services and stores</span>
            <span className="ml-auto text-xs text-text-tertiary">Discover</span>
          </Link>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link href="/cart" aria-label={`Shopping cart${cart.itemCount ? `, ${cart.itemCount} items` : ''}`} title="Shopping cart" className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-ink-raised hover:text-text-primary">
              <ShoppingCart className="h-5 w-5" />
              {cart.itemCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">{cart.itemCount > 99 ? '99+' : cart.itemCount}</span>}
            </Link>

            <Link href="/notifications" aria-label="Notifications" title="Notifications" className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-ink-raised hover:text-text-primary">
              <Bell className="h-5 w-5" />
            </Link>

            {state.isAuthenticated && (
              <Link href="/account" aria-label="Dashboard" title="Dashboard" className="hidden h-10 w-10 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-ink-raised hover:text-text-primary sm:inline-flex">
                <UserRound className="h-5 w-5" />
              </Link>
            )}


            {!state.isLoading && !isVendor && (
              <Link href="/vendor/onboard" className="hidden rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover md:inline-flex">
                Sell on Kamba
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="public-navigation-menu"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-text-secondary transition-colors hover:bg-ink-raised hover:text-text-primary"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div id="public-navigation-menu" className="absolute right-4 top-[calc(100%+8px)] z-50 w-[min(92vw,320px)] rounded-2xl border border-border bg-surface p-3 shadow-2xl sm:right-6">
          <div className="mb-2 flex items-center justify-between px-3 py-2">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-text-tertiary">Menu</p>
            <ChevronDown className="h-4 w-4 text-text-tertiary" />
          </div>
          <nav className="space-y-1" aria-label="Public navigation">
            <Link href="/search" onClick={closeMenu} className={menuLinkClass('/search')}><Search className="h-[18px] w-[18px]" />Discover</Link>
            <Link href={state.isAuthenticated ? '/notifications' : '/auth/login'} onClick={closeMenu} className={menuLinkClass('/notifications')}><Bell className="h-[18px] w-[18px]" />Notifications</Link>
            {state.isAuthenticated ? (
              <Link href="/account" onClick={closeMenu} className={menuLinkClass('/account')}><UserRound className="h-[18px] w-[18px]" />Dashboard</Link>
            ) : (
              <>
                <Link href="/auth/login" onClick={closeMenu} className={menuLinkClass('/auth/login')}><UserRound className="h-[18px] w-[18px]" />Sign in</Link>
                <Link href="/auth/register" onClick={closeMenu} className={menuLinkClass('/auth/register')}>Create account</Link>
              </>
            )}
            {!isVendor && <Link href="/vendor/onboard" onClick={closeMenu} className="mt-2 flex items-center justify-between rounded-xl bg-primary-soft px-3 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"><span>Become a vendor</span><span aria-hidden="true">→</span></Link>}
            {state.isAuthenticated && (
              <button type="button" onClick={() => { closeMenu(); void logout().then(() => router.replace('/')) }} className="mt-2 flex w-full items-center gap-3 rounded-xl border-t border-border px-3 py-3 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
                <LogOut className="h-[18px] w-[18px]" />Logout
              </button>
            )}
          </nav>
          <div className="mt-2 flex items-center justify-between border-t border-border px-3 pt-3">
            <span className="text-sm font-medium text-text-secondary">Appearance</span>
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  )
}
