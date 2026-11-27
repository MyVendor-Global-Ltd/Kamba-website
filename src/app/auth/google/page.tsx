'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function GooglePage() {
  const handleGoogleSignIn = () => {
    const apiBase = (process.env.NODE_ENV === 'production' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001')).replace(/\/$/, '')
    window.location.assign(`${apiBase}/api/v1/auth/google`)
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Sign in with Google</CardTitle>
        <CardDescription>Continue securely with your Google account.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleGoogleSignIn} className="w-full" variant="outline">
          Continue with Google
        </Button>
      </CardContent>
    </Card>
  )
}
