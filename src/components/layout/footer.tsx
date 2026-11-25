'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export function Footer() {
  const { state } = useAuth()
  const accountHref = state.isLoading || state.isAuthenticated ? '/account' : '/auth/login?callbackUrl=%2Faccount'
  const ordersHref = state.isLoading || state.isAuthenticated ? '/orders' : '/auth/login?callbackUrl=%2Forders'
  const vendorHref = state.isLoading || state.isAuthenticated ? '/vendor/onboard' : '/auth/login?callbackUrl=%2Fvendor%2Fonboard'
  const dashboardHref = state.isLoading || state.isAuthenticated ? '/vendor/dashboard' : '/auth/login?callbackUrl=%2Fvendor%2Fdashboard'

  const linkGroups = [
    {
      title: 'Discover',
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
      title: 'Information',
      links: [
        { label: 'Terms and conditions', href: '/terms' },
        { label: 'Privacy policy', href: '/privacy' },
      ],
    },
  ]

  return (
    <footer className="kamba-footer mt-auto">
      <div className="container mx-auto">
        <div className="kamba-footer-groups">
          {linkGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="kamba-footer-heading">{group.title}</h2>
              <ul className="kamba-footer-links">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <Link href="/" className="kamba-footer-wordmark" aria-label="Kamba home">
          KAMBA
        </Link>

        <div className="kamba-footer-bottom">
          <p>© {new Date().getFullYear()} Kamba. All rights reserved.</p>
          <div className="kamba-footer-legal">
            <Link href="/terms">Terms and conditions</Link>
            <Link href="/privacy">Privacy policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
