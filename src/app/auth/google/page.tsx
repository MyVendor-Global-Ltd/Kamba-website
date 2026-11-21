'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function GooglePage() {
  const router = useRouter()

  const handleGoogleSignIn = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.kamba.ng'}/api/v1/auth/google`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Google sign-in failed')
      const data = await res.json()
      if (data.user) {
        router.push('/')
        router.refresh()
      } else {
        router.push('/auth/register')
      }
    } catch {
      // Fall through to register
      router.push('/auth/register')
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Sign in with Google</CardTitle>
        <CardDescription>Continue with your Google account.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handleGoogleSignIn}
          className="w-full"
          variant="outline"
        >
          Continue with Google
        </Button>
      </CardContent>
    </Card>
  )
}
