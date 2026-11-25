'use client'

import { useState } from 'react'
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
  const [codeSent, setCodeSent] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await forgotPassword(email.trim().toLowerCase())
      setCodeSent(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('Password must be at least 8 characters long.')
    if (password !== confirmPassword) return setError('Passwords do not match.')
    setLoading(true)
    try {
      await resetPassword(email.trim().toLowerCase(), otpCode.trim(), password)
      setResetDone(true)
    } catch (err: any) {
      setError(err.message || 'Password reset failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <div className="px-6 pt-5">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to Kamba
        </Link>
      </div>
      <CardHeader>
        <CardTitle>{resetDone ? 'Password updated' : 'Forgot password'}</CardTitle>
        <CardDescription>
          {resetDone
            ? 'Your password has been changed. You can now sign in.'
            : codeSent
              ? 'Enter the one-time code sent to your email and choose a new password.'
              : 'Enter your email address to receive a password reset code.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div role="alert" className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm border border-destructive/20">{error}</div>}
        {resetDone ? (
          <Button asChild className="w-full"><a href="/auth/login">Back to sign in</a></Button>
        ) : !codeSent ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email address</label>
              <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Sending...' : 'Send reset code'}</Button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium">Email verification code</label>
              <Input id="otp" inputMode="numeric" autoComplete="one-time-code" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit code" required />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">New password</label>
              <Input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium">Confirm new password</label>
              <Input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Updating password...' : 'Reset password'}</Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
