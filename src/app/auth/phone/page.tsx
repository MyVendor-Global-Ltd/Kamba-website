'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requestPhoneOTP, verifyPhoneOTP } from '@/lib/auth'

export default function PhonePage() {
  const [phone, setPhone] = useState('')
  const [userId, setUserId] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const router = useRouter()

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await requestPhoneOTP(phone, 'sms')
      if (!result.userId) throw new Error('The server did not return a verification session.')
      setUserId(result.userId)
      setOtpSent(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await verifyPhoneOTP(userId, otpCode.trim())
      router.push('/auth/username/set')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Verify your phone</CardTitle>
        <CardDescription>{otpSent ? 'Enter the code sent to your phone.' : 'Phone verification is optional for ordinary email registration. Enter a number only if you are creating an account with phone verification.'}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div role="alert" className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm border border-destructive/20">{error}</div>}
        {!otpSent ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">Nigerian phone number</label>
              <Input id="phone" type="tel" placeholder="+234 801 234 5678" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Sending...' : 'Send SMS code'}</Button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium">Verification code</label>
              <Input id="otp" inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Verifying...' : 'Verify phone'}</Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
