'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthSuccessPage() {
  const router = useRouter()
  useEffect(() => {
    // The OAuth callback has already set the session cookies. The root auth
    // provider reloads the current profile on this full-page return.
    router.replace('/')
  }, [router])

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Google sign-in complete</CardTitle>
        <CardDescription>Taking you back to Kamba…</CardDescription>
      </CardHeader>
    </Card>
  )
}
