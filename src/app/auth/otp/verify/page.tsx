'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthGuard } from '@/components/auth/auth-guard'
import { KambaLogo } from '@/components/layout/kamba-logo'
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
  const phonePageHref = `/auth/phone?callbackUrl=${encodeURIComponent(returnTo)}`

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
      <section className="mx-auto flex min-h-[100svh] w-full max-w-7xl flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-md">
          <div className="mb-7 flex items-center justify-between">
            <Link
              href={phonePageHref}
              aria-label="Back to phone number"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-text-secondary shadow-sm transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <KambaLogo iconSize={30} href="/" />
          </div>

          <Card className="w-full overflow-hidden border-border/80 shadow-xl shadow-primary/5 hover:shadow-xl">
            <CardHeader className="space-y-4 px-6 pb-3 pt-7 sm:px-8 sm:pt-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Phone verification</p>
                <CardTitle className="text-2xl sm:text-[1.75rem]">Enter your verification code</CardTitle>
                <CardDescription className="text-sm leading-6">
                  {phone
                    ? <>We sent a 6-digit code to <span className="font-semibold text-text-primary">{phone}</span>. Enter it below to verify your number.</>
                    : 'Enter the 6-digit code sent to your phone to verify your number.'}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 px-6 pb-7 pt-4 sm:px-8 sm:pb-8">
              {error && (
                <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              {!hasSession ? (
                <div className="space-y-4 text-sm text-text-secondary">
                  <p>Your phone verification session is missing or has expired. Go back and request a new code.</p>
                  <Button asChild className="w-full">
                    <Link href="/auth/phone">Request a new code</Link>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleVerify} className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="phone-otp" className="text-sm font-semibold text-text-primary">6-digit code</label>
                    <Input
                      id="phone-otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="Enter code"
                      maxLength={6}
                      value={otp}
                      onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      className="h-13 text-center text-xl font-semibold tracking-[0.35em]"
                    />
                    <p className="text-xs text-text-tertiary">The code is 6 digits. Check your SMS messages.</p>
                  </div>
                  <Button type="submit" size="lg" className="w-full" disabled={loading || otp.length !== 6}>
                    {loading ? 'Verifying…' : 'Verify phone number'}
                  </Button>
                </form>
              )}
              <div className="border-t border-border pt-4 text-center">
                <p className="text-sm text-text-secondary">
                  Wrong number?{' '}
                  <Link href="/auth/phone" className="font-semibold text-primary underline-offset-4 hover:underline">
                    Change phone number
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
          <p className="mt-5 text-center text-xs text-text-tertiary">Your number helps keep your Kamba account secure.</p>
        </div>
      </section>
    </AuthGuard>
  )
}
