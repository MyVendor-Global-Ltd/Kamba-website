'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AdminLivenessPage() {
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleVerify = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.kamba.ng'}/admin/liveness`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      setResult(data.verified ? 'Verified' : 'Not verified')
    } catch {
      setResult('Verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Identity verification</CardTitle>
        <CardDescription>Complete liveness check for admin access.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleVerify} className="w-full" disabled={loading}>
          {loading ? 'Verifying...' : 'Start verification'}
        </Button>
        {result && (
          <div className="mt-4 p-3 rounded bg-primary/10 text-primary border border-primary/20">
            {result}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
