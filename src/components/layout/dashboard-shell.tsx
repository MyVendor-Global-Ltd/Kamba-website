'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Activity, Bell, ChevronLeft, ChevronRight, CreditCard, LayoutDashboard, LogOut,
  MapPin, Menu, Package, Search, Settings, ShoppingBag, Store, UserRound, X
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { KambaLogo } from '@/components/layout/kamba-logo'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/notifications/NotificationBell'

type NavItem = { label: string; href: string; icon: typeof Search }

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { state, logout } = useAuth()
  const [expanded, setExpanded] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isVendor = state.user?.role === 'vendor'
  const needsAccountVerification = Boolean(state.user && (!state.user.email_verified || !state.user.phone_verified))

  const groups: { label: string; items: NavItem[] }[] = [
    { label: 'Discover', items: [{ label: 'Search Kamba', href: '/search', icon: Search }] },
    {
      label: 'Workspace',
      items: [
        ...(isVendor
          ? [
              { label: 'Vendor dashboard', href: '/vendor/dashboard', icon: LayoutDashboard },
              { label: 'Business settings', href: '/vendor/profile', icon: Settings },
            ]
          : [
              { label: 'Dashboard', href: '/account?tab=overview', icon: LayoutDashboard },
              { label: 'Become a vendor', href: '/vendor/onboard', icon: Store },
            ]),
      ],
    },
    {
      label: 'Your activity',
      items: [
        { label: 'Notifications', href: '/notifications', icon: Bell },
        { label: isVendor ? 'My purchases' : 'Orders & delivery tracking', href: '/orders', icon: ShoppingBag },
        { label: 'Service requests', href: '/service-requests', icon: Activity },
        { label: 'Shopping cart', href: '/cart', icon: Package },
      ],
    },
    {
      label: 'Account & security',
      items: [
        { label: 'Profile', href: '/account?tab=profile', icon: UserRound },
        { label: 'Delivery addresses', href: '/account?tab=addresses', icon: MapPin },
        { label: 'Payment methods', href: '/account?tab=payment', icon: CreditCard },
        { label: 'Preferences & security', href: '/account?tab=settings', icon: Settings },
      ],
    },
  ]

  const navigate = (href: string) => {
    router.replace(href, { scroll: false })
    setMobileOpen(false)
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-[72px] items-center border-b border-border px-4', expanded ? 'justify-between' : 'justify-center')}>
        {expanded && <KambaLogo iconSize={30} href="/search" replace />}
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="hidden h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-ink-raised/70 hover:text-text-primary lg:inline-flex"
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {expanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <button type="button" onClick={() => setMobileOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-ink-raised lg:hidden" aria-label="Close dashboard menu">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Dashboard navigation">
        {groups.map((group) => (
          <section key={group.label}>
            {expanded && <p className="mb-2 px-3 text-[10px] leading-4 font-bold uppercase tracking-[0.14em] text-text-tertiary">{group.label}</p>}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const targetPath = item.href.split('?')[0]
                const isAccountItem = targetPath === '/account'
                const requestedTab = item.href.split('tab=')[1] || 'profile'
                const isActive = isAccountItem
                  ? pathname === '/account' && (searchParams.get('tab') || 'profile') === requestedTab
                  : pathname === targetPath || pathname.startsWith(targetPath + '/')
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => navigate(item.href)}
                    title={!expanded ? item.label : undefined}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'flex w-full items-center rounded-xl py-2.5 text-sm font-medium transition-colors',
                      expanded ? 'gap-3 px-3' : 'justify-center px-0',
                      isActive ? 'bg-primary-soft text-primary' : 'text-text-secondary hover:bg-ink-raised/70 hover:text-text-primary'
                    )}
                  >
                    <span className="relative shrink-0"><Icon className="h-[18px] w-[18px]" />{needsAccountVerification && isAccountItem && requestedTab === 'profile' && <span aria-label="Email or phone verification incomplete" title="Email or phone verification incomplete" className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-surface bg-destructive" />}</span>
                    {expanded && <span className="truncate">{item.label}</span>}
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className="space-y-2 border-t border-border p-3">
        <div className={cn('flex', expanded ? 'justify-start' : 'justify-center')}>
          <ThemeToggle compact={!expanded} />
        </div>
        <button
          type="button"
          onClick={() => { void logout().then(() => router.replace('/')) }}
          title={!expanded ? 'Log out' : undefined}
          aria-label="Log out"
          className={cn('flex w-full items-center rounded-xl py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-destructive/10 hover:text-destructive', expanded ? 'gap-3 px-3' : 'justify-center px-0')}
        >
          <LogOut className="h-[18px] w-[18px]" />
          {expanded && 'Log out'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-[calc(100vh-0px)] bg-background">
      <div className="flex min-h-screen">
        <aside className={cn('hidden shrink-0 border-r border-border bg-surface transition-[width] duration-200 lg:block', expanded ? 'w-64' : 'w-[76px]')}>
          {sidebar}
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-[70] lg:hidden">
            <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-label="Close dashboard menu overlay" />
            <aside className="absolute inset-y-0 left-0 w-[min(84vw,300px)] border-r border-border bg-surface shadow-2xl">
              {sidebar}
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-[72px] items-center justify-between border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button type="button" onClick={() => { setExpanded(true); setMobileOpen(true) }} className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-text-secondary hover:bg-ink-raised lg:hidden" aria-label="Open dashboard menu">
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-text-tertiary">{pathname.startsWith('/vendor') ? 'Vendor workspace' : 'Your account'}</p>
                <h1 className="truncate text-base font-semibold text-text-primary sm:text-lg">
                  {pathname === '/account' ? (searchParams.get('tab') === 'profile' ? 'Profile & personal details' : searchParams.get('tab') === 'addresses' ? 'Delivery addresses' : searchParams.get('tab') === 'payment' ? 'Payment preferences' : searchParams.get('tab') === 'settings' ? 'Preferences & security' : 'Your dashboard') : pathname.startsWith('/vendor/dashboard') ? 'Vendor overview' : pathname.startsWith('/vendor/profile') ? 'Business settings' : pathname.startsWith('/vendor/store') ? 'Storefront settings' : pathname.startsWith('/vendor/pickup') ? 'Pickup desk' : pathname.startsWith('/vendor/payments') ? 'Payouts' : pathname.startsWith('/vendor/products') ? 'Products' : pathname.startsWith('/vendor/orders') ? 'Vendor orders' : pathname.startsWith('/orders') ? 'Your orders' : pathname.startsWith('/service-requests') ? 'Service requests' : pathname.startsWith('/notifications') ? 'Notifications' : pathname.startsWith('/vendor') ? 'Vendor workspace' : 'Your workspace'}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => navigate('/search')} className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-text-secondary hover:bg-ink-raised sm:inline-flex">
                <Search className="h-4 w-4" /> <span>Back to search</span>
              </button>
              <ThemeToggle compact />
              <NotificationBell />
            </div>
          </header>
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1440px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
