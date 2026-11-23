import Link from 'next/link'
import { KambaLogo } from '@/components/layout/kamba-logo'

const linkGroups = [
  {
    title: 'Explore',
    links: [
      { label: 'Products', href: '/marketplace/products' },
      { label: 'Services', href: '/marketplace/services' },
      { label: 'Stores', href: '/marketplace/stores' },
    ],
  },
  {
    title: 'Your Kamba',
    links: [
      { label: 'My account', href: '/account' },
      { label: 'My orders', href: '/orders' },
    ],
  },
  {
    title: 'For vendors',
    links: [
      { label: 'Sell on Kamba', href: '/vendor/onboard' },
      { label: 'Vendor dashboard', href: '/vendor/dashboard' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="container mx-auto px-4 py-10 lg:py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <KambaLogo iconSize={36} />
            <p className="max-w-xs text-sm leading-6 text-text-secondary">
              Discover products, independent shops and useful services in your neighbourhood.
            </p>
          </div>
          {linkGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="mb-4 text-sm font-semibold text-text-primary">{group.title}</h2>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-text-secondary transition-colors hover:text-primary">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-5 text-xs text-text-tertiary sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Kamba. All rights reserved.</p>
          <p>Local discovery, made simpler.</p>
        </div>
      </div>
    </footer>
  )
}
