'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { checkUsernameAvailability } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Availability = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [referralUsername, setReferralUsername] = useState('')
  const [callbackUrl, setCallbackUrl] = useState('/')
  const [availability, setAvailability] = useState<Availability>('idle')
  const [availabilityMessage, setAvailabilityMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const router = useRouter()

  const normalizedUsername = useMemo(() => username.trim().replace(/^@+/, '').toLowerCase(), [username])
  const validUsername = /^[a-z0-9_]{3,16}$/.test(normalizedUsername)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const referral = params.get('ref') || params.get('r')
    if (referral) setReferralUsername(referral.replace(/^@+/, '').trim())
    const next = params.get('callbackUrl')
    if (next && next.startsWith('/') && !next.startsWith('//')) setCallbackUrl(next)
  }, [])

  useEffect(() => {
    if (!normalizedUsername) {
      setAvailability('idle')
      setAvailabilityMessage('')
      return
    }
    if (!validUsername) {
      setAvailability('invalid')
      setAvailabilityMessage('Use 3–16 letters, numbers or underscores.')
      return
    }

    let cancelled = false
    setAvailability('checking')
    setAvailabilityMessage('Checking availability…')
    const timer = window.setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability(normalizedUsername)
        if (cancelled) return
        setAvailability(result.isAvailable ? 'available' : 'taken')
        setAvailabilityMessage(result.isAvailable ? 'Username is available.' : 'That username is already taken.')
      } catch (err: any) {
        if (cancelled) return
        if (err.message?.toLowerCase().includes('already taken')) {
          setAvailability('taken')
          setAvailabilityMessage('That username is already taken.')
        } else {
          setAvailability('error')
          setAvailabilityMessage('Could not verify this username. Try again.')
        }
      }
    }, 1200)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [normalizedUsername, validUsername])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!validUsername) {
      setError('Choose a valid username (3–16 letters, numbers or underscores).')
      return
    }
    if (availability !== 'available') {
      setError('Wait for username availability to be confirmed before continuing.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await register({
        username: normalizedUsername,
        email: email.trim().toLowerCase(),
        password,
        confirm_password: confirmPassword,
        ...(referralUsername.trim() ? { referral_username: referralUsername.trim().replace(/^@+/, '').toLowerCase() } : {}),
      })
      router.replace(callbackUrl)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Create your Kamba account</CardTitle>
        <CardDescription>Choose your username, add your email and create a password. You can add a phone number later when it is needed for delivery.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div role="alert" className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm border border-destructive/20">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">Username</label>
            <div className="flex items-center rounded-md border border-input focus-within:ring-2 focus-within:ring-ring">
              <span className="pl-3 text-muted-foreground">@</span>
              <Input
                id="username"
                className="border-0 focus-visible:ring-0"
                placeholder="yourname"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, '').replace(/^@+/, ''))}
                autoComplete="username"
                required
                minLength={3}
                maxLength={16}
              />
            </div>
            {availabilityMessage && (
              <p aria-live="polite" className={`text-xs ${availability === 'available' ? 'text-green-600' : availability === 'taken' || availability === 'invalid' ? 'text-destructive' : 'text-muted-foreground'}`}>
                {availabilityMessage}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email address</label>
            <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <Input id="password" type="password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm-password" className="text-sm font-medium">Confirm password</label>
            <Input id="confirm-password" type="password" placeholder="Enter your password again" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required />
          </div>
          <div className="space-y-2">
            <label htmlFor="referral" className="text-sm font-medium">Referral username <span className="text-muted-foreground font-normal">(optional)</span></label>
            <Input id="referral" placeholder="@username" value={referralUsername} onChange={(e) => setReferralUsername(e.target.value.replace(/^@+/, ''))} autoComplete="off" />
          </div>
          <Button type="submit" className="w-full" disabled={loading || availability === 'checking' || availability !== 'available'}>
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account? <a href="/auth/login" className="font-medium">Sign in</a>
        </p>
      </CardContent>
    </Card>
  )
}
