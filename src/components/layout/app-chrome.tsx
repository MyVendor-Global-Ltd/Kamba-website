'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useAuth } from '@/context/AuthContext'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { AuthGuard } from '@/components/auth/auth-guard'

function AuthLegalFooter() {
  return (
    <footer className="mx-auto w-full max-w-md px-6 py-6 text-center text-xs text-text-tertiary">
      <p>
        By continuing, you agree to Kamba&apos;s{' '}
        <a href="/terms" className="font-medium text-text-secondary transition-colors hover:text-primary">Terms and Conditions</a>
        {' '}and{' '}
        <a href="/privacy" className="font-medium text-text-secondary transition-colors hover:text-primary">Privacy Policy</a>.
      </p>
    </footer>
  )
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { state } = useAuth()
  const isAuthRoute = pathname === '/auth' || pathname.startsWith('/auth/')
  const isDashboardRoute = pathname === '/account' || pathname.startsWith('/account/') || pathname === '/orders' || (pathname.startsWith('/orders/') && pathname !== '/orders/confirmation') || pathname === '/service-requests' || pathname.startsWith('/service-requests/') || pathname === '/notifications'

  useEffect(() => {
    const root = document.documentElement
    root.classList.add('reveal-ready')

    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('[data-scroll-reveal]').forEach((element) => element.classList.add('is-visible'))
      return () => root.classList.remove('reveal-ready')
    }

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { rootMargin: '0px 0px 120px 0px', threshold: 0.05 })

    const observeRevealElements = (scope: ParentNode) => {
      scope.querySelectorAll('[data-scroll-reveal]:not(.is-visible)').forEach((element) => revealObserver.observe(element))
    }

    observeRevealElements(document)
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          if (node.matches('[data-scroll-reveal]:not(.is-visible)')) revealObserver.observe(node)
          observeRevealElements(node)
        }
      }))
    })
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      mutationObserver.disconnect()
      revealObserver.disconnect()
      root.classList.remove('reveal-ready')
    }
  }, [])

  return (
    <>
      {!isAuthRoute && !isDashboardRoute && <Header />}
      {isDashboardRoute ? (
        <AuthGuard><DashboardShell><main key={pathname} className="app-main page-enter min-w-0 w-full">{children}</main></DashboardShell></AuthGuard>
      ) : (
        <main key={pathname} className="app-main page-enter flex-1 w-full">{children}</main>
      )}
      {isAuthRoute
        ? <AuthLegalFooter />
        : !isDashboardRoute && !state.isLoading && !state.isAuthenticated
          ? <Footer />
          : null}
    </>
  )
}
