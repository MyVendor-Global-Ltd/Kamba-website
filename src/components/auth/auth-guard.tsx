'use client'

import { ReactNode, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export function AuthGuard({ children }: { children: ReactNode }) {
  const { state, refreshProfile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!state.isLoading && !state.authError && !state.isAuthenticated) {
      const requestedQuery = typeof window !== 'undefined' ? window.location.search : ''
      const destination = `${pathname || '/account'}${requestedQuery}`
      router.replace(`/auth/login?callbackUrl=${encodeURIComponent(destination)}`)
    }
  }, [state.isLoading, state.authError, state.isAuthenticated, pathname, router])

  if (state.authError) {
    return (
      <div className="mx-auto flex min-h-[45vh] max-w-lg flex-col items-center justify-center gap-3 px-4 text-center" role="alert">
        <p className="font-semibold text-text-primary">We couldn&apos;t verify your session</p>
        <p className="text-sm text-text-secondary">{state.authError}</p>
        <button
          type="button"
          onClick={() => { void refreshProfile().catch(() => {}) }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Try again
        </button>
      </div>
    )
  }

  if (state.isLoading || !state.isAuthenticated) {
    return (
      <div className="flex min-h-[45vh] items-center justify-center" role="status" aria-live="polite">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="sr-only">Checking your Kamba session…</span>
      </div>
    )
  }

  return <>{children}</>
}
