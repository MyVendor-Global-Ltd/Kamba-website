'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface OTPFormProps {
  phone: string
  onVerify: (otp: string) => Promise<void>
  loading: boolean
}

export function OTPForm({ phone, onVerify, loading }: OTPFormProps) {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await onVerify(otp)
    } catch (err: any) {
      setError(err.message || 'OTP verification failed')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enter verification code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded bg-destructive/10 text-destructive text-sm border border-destructive/20">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone number</label>
            <Input type="tel" value={phone} disabled />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">OTP code</label>
            <Input
              type="text"
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify code'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
