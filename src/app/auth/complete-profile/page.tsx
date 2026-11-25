'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { checkMyUsernameAvailability, setUsername } from '@/lib/auth'

type Availability = 'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'error'

export default function CompleteGoogleProfilePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { refreshProfile } = useAuth()
  const [username, setUsernameValue] = useState(searchParams.get('username') || '')
  const [availability, setAvailability] = useState<Availability>('idle')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const normalizedUsername = useMemo(
    () => username.trim().replace(/^@+/, '').toLowerCase(),
    [username],
  )
  const validUsername = /^[a-z0-9_]{3,16}$/.test(normalizedUsername)

  useEffect(() => {
    if (!normalizedUsername) {
      setAvailability('idle')
      setMessage('')
      return
    }
    if (!validUsername) {
      setAvailability('invalid')
      setMessage('Use 3–16 letters, numbers or underscores.')
      return
    }

    let cancelled = false
    setAvailability('checking')
    setMessage('Checking username availability…')
    const timer = window.setTimeout(async () => {
      try {
        const result = await checkMyUsernameAvailability(normalizedUsername)
        if (cancelled) return
        setAvailability(result.isAvailable ? 'available' : 'taken')
        setMessage(result.isAvailable ? 'This username is available.' : 'That username is already taken.')
      } catch (availabilityError) {
        if (cancelled) return
        const reason = availabilityError instanceof Error ? availabilityError.message : ''
        if (reason.toLowerCase().includes('already taken')) {
          setAvailability('taken')
          setMessage('That username is already taken.')
        } else {
          setAvailability('error')
          setMessage('We could not check this username. Please try again.')
        }
      }
    }, 800)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [normalizedUsername, validUsername])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    if (!validUsername || availability !== 'available') return

    setSaving(true)
    try {
      await setUsername(normalizedUsername)
      await refreshProfile()
      router.replace('/account')
      router.refresh()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'We could not save your username.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex min-h-[72vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Choose your Kamba username</CardTitle>
          <CardDescription>
            Google has confirmed your email. Choose the username people will use to find and recognise you on Kamba. We suggested one from your Gmail address, but you can change it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="google-username" className="text-sm font-medium">Your username</label>
              <div className="flex items-center rounded-md border border-input focus-within:ring-2 focus-within:ring-ring">
                <span className="pl-3 text-muted-foreground">@</span>
                <Input
                  id="google-username"
                  className="border-0 focus-visible:ring-0"
                  value={username}
                  onChange={(event) => setUsernameValue(event.target.value.replace(/\s/g, '').replace(/^@+/, '').toLowerCase())}
                  autoComplete="username"
                  minLength={3}
                  maxLength={16}
                  required
                />
              </div>
              <p aria-live="polite" className={`text-xs ${availability === 'available' ? 'text-success' : availability === 'taken' || availability === 'invalid' ? 'text-destructive' : 'text-text-tertiary'}`}>
                {message || 'Your username must be 3–16 characters.'}
              </p>
            </div>
            {error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={saving || availability !== 'available'}>
              {saving ? 'Saving username…' : 'Confirm username'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
