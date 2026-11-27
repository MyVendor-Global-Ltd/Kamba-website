'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthGuard } from '@/components/auth/auth-guard'
import { requestPhoneOTP } from '@/lib/auth'

function safeReturnTo(value: string | null) {
  if (!value) return '/account'
  try {
    const target = new URL(value, 'https://kamba.invalid')
    if (target.origin !== 'https://kamba.invalid') return '/account'
    return `${target.pathname}${target.search}${target.hash}`
  } catch {
    return '/account'
  }
}

export default function PhonePage() {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSendOTP = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await requestPhoneOTP(phone)
      const result = response.result || response
      if (!result.userId) throw new Error('The API did not return a verification session.')
      sessionStorage.setItem('kamba_phone_verification_user_id', result.userId)
      sessionStorage.setItem('kamba_phone_verification_phone', result.phone || phone)
      sessionStorage.setItem('kamba_phone_verification_resend_available_at', String(Date.now() + 30_000))
      const params = new URLSearchParams(window.location.search)
      sessionStorage.setItem('kamba_phone_verification_return_to', safeReturnTo(params.get('callbackUrl')))
      router.push('/auth/otp/verify')
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <Card className="w-full max-w-md mx-auto mt-10">
        <CardHeader>
          <CardTitle>Verify your phone</CardTitle>
          <CardDescription>Enter the phone number you want linked to your Kamba account. We&apos;ll send a verification code.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div role="alert" className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm border border-destructive/20">{error}</div>}
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone number</label>
              <Input type="tel" placeholder="+234 801 234 5678" value={phone} onChange={(event) => setPhone(event.target.value)} required autoComplete="tel" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Sending…' : 'Send verification code'}</Button>
          </form>
        </CardContent>
      </Card>
    </AuthGuard>
  )
}
