'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PhoneFormProps {
  onSendOTP: (phone: string) => Promise<void>
  loading: boolean
}

export function PhoneForm({ onSendOTP, loading }: PhoneFormProps) {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await onSendOTP(phone)
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify your phone</CardTitle>
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
            <Input
              type="tel"
              placeholder="+234 801 234 5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
