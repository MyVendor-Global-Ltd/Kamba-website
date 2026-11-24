'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { forgotPassword, resetPassword } from '@/lib/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'request' | 'reset' | 'complete'>('request')

  const handleRequest = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPassword(email)
      setStep('reset')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not request a password reset.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Your new password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await resetPassword(email, otpCode, password)
      setStep('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>{step === 'request' ? 'Forgot password' : step === 'reset' ? 'Reset your password' : 'Password updated'}</CardTitle>
        <CardDescription>
          {step === 'request'
            ? 'Enter your account email. We will send a password reset code if the account exists.'
            : step === 'reset'
              ? 'Enter the code sent to your email and choose a new password.'
              : 'Your password has been reset. You can now sign in with your new password.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div role="alert" className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm border border-destructive/20">
            {error}
          </div>
        )}
        {step === 'request' && (
          <form onSubmit={handleRequest} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="reset-email" className="text-sm font-medium">Email address</label>
              <Input id="reset-email" type="email" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Sending code...' : 'Send reset code'}</Button>
          </form>
        )}
        {step === 'reset' && (
          <form onSubmit={handleReset} className="space-y-4">
            <p className="text-sm text-muted-foreground">If the account exists, a reset code has been sent to {email.trim().toLowerCase()}.</p>
            <div className="space-y-2">
              <label htmlFor="reset-code" className="text-sm font-medium">Reset code</label>
              <Input id="reset-code" inputMode="numeric" autoComplete="one-time-code" value={otpCode} onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))} required minLength={6} maxLength={6} />
            </div>
            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-medium">New password</label>
              <Input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium">Confirm new password</label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} autoComplete="new-password" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Updating password...' : 'Reset password'}</Button>
          </form>
        )}
        {step === 'complete' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Your existing sessions have been revoked. Sign in again with your new password.</p>
            <Button asChild className="w-full"><Link href="/auth/login">Back to sign in</Link></Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
