'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/auth/auth-guard'
import { useAuth } from '@/context/AuthContext'
import { VendorWorkspaceNavigation } from '@/components/vendor/workspace-navigation'

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { state } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isOnboarding = pathname === '/vendor/onboard'

  useEffect(() => {
    if (!state.isLoading && state.isAuthenticated && !isOnboarding && state.user?.role !== 'vendor') {
      router.replace('/vendor/onboard')
    }
  }, [state.isLoading, state.isAuthenticated, state.user?.role, isOnboarding, router])

  return (
    <AuthGuard>
      {isOnboarding || state.user?.role === 'vendor' ? <>
        {!isOnboarding && state.user?.role === 'vendor' && <VendorWorkspaceNavigation />}
        {children}
      </> : (
        <div className="flex min-h-[45vh] items-center justify-center" role="status">
          Redirecting to vendor onboarding…
        </div>
      )}
    </AuthGuard>
  )
}
