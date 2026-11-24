'use client'

import { ReactNode, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export function AuthGuard({ children }: { children: ReactNode }) {
  const { state } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!state.isLoading && !state.isAuthenticated) {
      const destination = pathname || '/account'
      router.replace(`/auth/login?callbackUrl=${encodeURIComponent(destination)}`)
    }
  }, [state.isLoading, state.isAuthenticated, pathname, router])

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
