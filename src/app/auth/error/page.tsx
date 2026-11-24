'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthErrorPage() {
  const [message, setMessage] = useState('Google sign-in could not be completed.')
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const reason = params.get('message')
    if (reason) setMessage(reason)
  }, [])

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Sign-in failed</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full"><a href="/auth/login">Return to sign in</a></Button>
      </CardContent>
    </Card>
  )
}
