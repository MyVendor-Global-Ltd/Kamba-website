'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function safeCallback(value: string | null) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '/account'
}

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [referralUsername, setReferralUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = safeCallback(searchParams.get('callbackUrl'))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await register({
        username: username.trim().replace(/^@/, '').toLowerCase(),
        email,
        password,
        confirm_password: confirmPassword,
        referral_username: referralUsername.trim().replace(/^@/, '').toLowerCase() || undefined,
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
        <CardTitle>Create account</CardTitle>
        <CardDescription>Join Kamba to buy products and book services.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div role="alert" className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm border border-destructive/20">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="username">Username</label>
            <div className="flex h-10 items-center rounded-md border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-primary">
              <span className="text-muted-foreground">@</span>
              <input id="username" value={username} onChange={(event) => setUsername(event.target.value.replace(/^@/, '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 16))} placeholder="yourname" required minLength={3} maxLength={16} autoCapitalize="none" autoComplete="username" className="h-full min-w-0 flex-1 bg-transparent px-2 text-sm outline-none" />
            </div>
            <p className="text-xs text-muted-foreground">Use 3–16 letters, numbers, underscores or hyphens.</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email address</label>
            <Input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input type="password" placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm password</label>
            <Input type="password" placeholder="Re-enter your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Referral username (optional)</label>
            <Input placeholder="@username" value={referralUsername} onChange={(e) => setReferralUsername(e.target.value)} autoCapitalize="none" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link href={`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-medium">Sign in</Link>
        </p>
      </CardContent>
    </Card>
  )
}
