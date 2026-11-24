'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthGuard } from '@/components/auth/auth-guard'
import { useAuth } from '@/context/AuthContext'
import { verifyPhoneOTP } from '@/lib/auth'

export default function VerifyOTPPage() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [returnTo, setReturnTo] = useState('/account')
  const [hasSession, setHasSession] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { refreshProfile } = useAuth()

  useEffect(() => {
    const savedPhone = sessionStorage.getItem('kamba_phone_verification_phone') || ''
    const userId = sessionStorage.getItem('kamba_phone_verification_user_id') || ''
    const savedReturnTo = sessionStorage.getItem('kamba_phone_verification_return_to') || '/account'
    setPhone(savedPhone)
    setReturnTo(savedReturnTo.startsWith('/') && !savedReturnTo.startsWith('//') ? savedReturnTo : '/account')
    setHasSession(Boolean(userId && savedPhone))
  }, [])

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await verifyPhoneOTP(otp)
      await refreshProfile()
      sessionStorage.removeItem('kamba_phone_verification_user_id')
      sessionStorage.removeItem('kamba_phone_verification_phone')
      sessionStorage.removeItem('kamba_phone_verification_return_to')
      router.replace(returnTo)
    } catch (err: any) {
      setError(err.message || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard>
      <Card className="w-full max-w-md mx-auto mt-10">
        <CardHeader>
          <CardTitle>Enter verification code</CardTitle>
          <CardDescription>{phone ? `Enter the 6-digit code sent to ${phone}.` : 'Enter the 6-digit code sent to your phone.'}</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div role="alert" className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm border border-destructive/20">{error}</div>}
          {!hasSession ? (
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>Your phone verification session is missing or expired. Request a new code.</p>
              <Button asChild className="w-full"><Link href="/auth/phone">Request a new code</Link></Button>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">OTP code</label>
                <Input type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>{loading ? 'Verifying…' : 'Verify phone number'}</Button>
            </form>
          )}
          <p className="text-center text-sm text-muted-foreground mt-6"><Link href="/auth/phone" className="font-medium">Use a different phone number</Link></p>
        </CardContent>
      </Card>
    </AuthGuard>
  )
}
