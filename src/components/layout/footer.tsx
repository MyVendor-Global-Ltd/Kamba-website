'use client'

import Link from 'next/link'
import { KambaLogo } from '@/components/layout/kamba-logo'
import { useAuth } from '@/context/AuthContext'

export function Footer() {
  const { state } = useAuth()
  const accountHref = state.isLoading || state.isAuthenticated ? '/account' : '/auth/login?callbackUrl=%2Faccount'
  const ordersHref = state.isLoading || state.isAuthenticated ? '/orders' : '/auth/login?callbackUrl=%2Forders'
  const vendorHref = state.isLoading || state.isAuthenticated ? '/vendor/onboard' : '/auth/login?callbackUrl=%2Fvendor%2Fonboard'
  const dashboardHref = state.isLoading || state.isAuthenticated ? '/vendor/dashboard' : '/auth/login?callbackUrl=%2Fvendor%2Fdashboard'

  const linkGroups = [
    {
      title: 'Explore',
      links: [
        { label: 'Stores', href: '/marketplace/stores' },
        { label: 'Products', href: '/marketplace/products' },
        { label: 'Services', href: '/marketplace/services' },
      ],
    },
    {
      title: 'Your account',
      links: [
        { label: 'My account', href: accountHref },
        { label: 'My orders', href: ordersHref },
        { label: 'Get the Kamba app', href: '/download' },
      ],
    },
    {
      title: 'For vendors',
      links: [
        { label: 'Sell on Kamba', href: vendorHref },
        { label: 'Vendor dashboard', href: dashboardHref },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms and conditions', href: '/terms' },
        { label: 'Privacy policy', href: '/privacy' },
      ],
    },
  ]

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="container mx-auto py-7 sm:py-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 lg:grid-cols-[1.45fr_repeat(4,minmax(0,1fr))] lg:gap-8">
          <div className="col-span-2 space-y-2 sm:col-span-1">
            <KambaLogo iconSize={30} />
            <p className="max-w-xs text-xs leading-5 text-text-secondary">
              Discover products, independent shops and useful services in your neighbourhood.
            </p>
          </div>
          {linkGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="mb-2 text-xs font-semibold text-text-primary">{group.title}</h2>
              <ul className="space-y-1.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-xs text-text-secondary transition-colors hover:text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-1.5 border-t border-border pt-4 text-[11px] text-text-tertiary sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Kamba. All rights reserved.</p>
          <p>Local discovery, made simpler.</p>
        </div>
      </div>
    </footer>
  )
}
