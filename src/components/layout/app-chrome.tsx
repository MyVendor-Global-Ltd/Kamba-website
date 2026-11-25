'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { DashboardShell } from '@/components/layout/dashboard-shell'
import { AuthGuard } from '@/components/auth/auth-guard'
import { useAuth } from '@/context/AuthContext'

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
  const isOtpVerificationRoute = pathname === '/auth/otp/verify'
  const isDashboardRoute = pathname === '/account' || pathname.startsWith('/account/') || pathname === '/orders' || (pathname.startsWith('/orders/') && pathname !== '/orders/confirmation') || pathname === '/service-requests' || pathname.startsWith('/service-requests/') || (pathname === '/notifications' && state.isAuthenticated)

  useEffect(() => {
    const revealSelector = '[data-scroll-reveal], .app-main section, .app-main article'

    const observeRevealElements = (scope: ParentNode) => {
      const candidates: Element[] = []
      if (scope instanceof Element && scope.matches('.app-main section, .app-main article')) {
        candidates.push(scope)
      }
      scope.querySelectorAll(revealSelector).forEach((element) => candidates.push(element))

      candidates.forEach((element) => {
        if (!element.hasAttribute('data-scroll-reveal')) {
          element.setAttribute('data-scroll-reveal', '')
        }
        if (element.classList.contains('is-visible')) return
        if (revealObserver) revealObserver.observe(element)
        else element.classList.add('is-visible')
      })
    }

    let revealObserver: IntersectionObserver | null = null
    if ('IntersectionObserver' in window) {
      revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      }, { rootMargin: '0px 0px 120px 0px', threshold: 0.05 })
    }

    observeRevealElements(document)
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) observeRevealElements(node)
      }))
    })
    mutationObserver.observe(document.body, { childList: true, subtree: true })

    return () => {
      mutationObserver.disconnect()
      revealObserver?.disconnect()
    }
  }, [])

  return (
    <>
      {!isAuthRoute && !isDashboardRoute && <Header />}
      {isDashboardRoute ? (
        <AuthGuard><DashboardShell><div key={pathname} className="app-main page-enter min-w-0 w-full">{children}</div></DashboardShell></AuthGuard>
      ) : (
        <main key={pathname} className="app-main page-enter flex-1 w-full">{children}</main>
      )}
      {isAuthRoute
        ? !isOtpVerificationRoute && <AuthLegalFooter />
        : !isDashboardRoute
          ? <Footer />
          : null}
    </>
  )
}
