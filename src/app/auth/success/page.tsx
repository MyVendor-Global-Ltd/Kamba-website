'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthSuccessPage() {
  const router = useRouter()
  const { refreshProfile } = useAuth()
  const [message, setMessage] = useState('Completing your sign-in…')

  useEffect(() => {
    let active = true
    refreshProfile()
      .then(() => {
        if (!active) return
        setMessage('Sign-in complete. Redirecting…')
        router.replace('/')
        router.refresh()
      })
      .catch(() => {
        if (!active) return
        setMessage('We could not complete your session. Please sign in again.')
      })
    return () => { active = false }
  }, [refreshProfile, router])

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Google sign-in</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent />
    </Card>
  )
}
