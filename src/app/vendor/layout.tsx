'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { apiJson } from '@/lib/api'
import { AuthGuard } from '@/components/auth/auth-guard'
import { useAuth } from '@/context/AuthContext'
import { VendorWorkspaceNavigation } from '@/components/vendor/workspace-navigation'

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { state } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isOnboarding = pathname === '/vendor/onboard'
  const isStoreRoute = ['/vendor/store', '/vendor/products', '/vendor/orders', '/vendor/pickup']
    .some(path => pathname === path || pathname.startsWith(path + '/'))
  const [storeAccess, setStoreAccess] = useState<'checking' | 'allowed' | 'blocked'>('allowed')

  useEffect(() => {
    if (!isStoreRoute || state.isLoading || !state.isAuthenticated || state.user?.role !== 'vendor') {
      setStoreAccess('allowed')
      return
    }
    let active = true
    setStoreAccess('checking')
    void apiJson<{ vendor_profile?: { vendor_type?: 'products' | 'services' | 'both' } }>('/vendors/profile')
      .then(result => {
        if (active) setStoreAccess(result.vendor_profile?.vendor_type === 'services' ? 'blocked' : 'allowed')
      })
      .catch(() => { if (active) setStoreAccess('allowed') })
    return () => { active = false }
  }, [isStoreRoute, state.isLoading, state.isAuthenticated, state.user?.role])

  useEffect(() => {
    if (!state.isLoading && state.isAuthenticated && !isOnboarding && state.user?.role !== 'vendor') {
      router.replace('/vendor/onboard')
    }
  }, [state.isLoading, state.isAuthenticated, state.user?.role, isOnboarding, router])

  return (
    <AuthGuard>
      {isOnboarding || state.user?.role === 'vendor' ? <>
        {!isOnboarding && state.user?.role === 'vendor' && <VendorWorkspaceNavigation />}
        {isStoreRoute && storeAccess === 'checking' ? (
          <div className="container mx-auto max-w-3xl px-4 py-16" role="status"><div className="h-28 animate-pulse rounded-2xl bg-surface-muted" /></div>
        ) : storeAccess === 'blocked' ? (
          <main className="container mx-auto max-w-3xl space-y-4 px-4 py-16">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Vendor workspace / Store access</p>
            <h1 className="font-display text-3xl font-bold text-text-primary">This business is set up for services.</h1>
            <p className="max-w-2xl text-sm leading-7 text-text-secondary">Product listings need a storefront. Your current vendor profile is configured for services only, so Kamba has stopped this product/store screen before it can return a confusing “Store not found” error. Your service listing and requests are not affected.</p>
            <p className="max-w-2xl text-sm leading-7 text-text-secondary">If you also want to sell products, ask Kamba support to enable a storefront for this business. You can continue managing your services below.</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/vendor/service" className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground">Manage services</Link>
              <Link href="/vendor/profile?section=business" className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-semibold text-text-primary">Business profile</Link>
            </div>
          </main>
        ) : children}
      </> : (
        <div className="flex min-h-[45vh] items-center justify-center" role="status">
          Redirecting to vendor onboarding…
        </div>
      )}
    </AuthGuard>
  )
}
