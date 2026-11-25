'use client'

import Link from 'next/link'
import { Bell, ArrowRight, LockKeyhole } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

function GuestNotificationsPrompt() {
  return (
    <div className="container mx-auto flex min-h-[65vh] items-center justify-center px-4 py-12">
      <Card variant="elevated" className="w-full max-w-xl">
        <CardContent className="flex flex-col items-center px-6 py-12 text-center sm:px-10">
          <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <LockKeyhole className="h-8 w-8" />
          </span>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Stay in the loop</p>
          <h1 className="mt-3 text-2xl font-bold text-text-primary sm:text-3xl">Your updates are waiting.</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-text-secondary">
            Sign in or create a Kamba account to see order updates, delivery news and important activity. No account yet? It only takes a moment to join.
          </p>
          <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="/auth/login?callbackUrl=%2Fnotifications" className="w-full sm:w-auto">
              <Button className="w-full">Sign in <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
            <Link href="/auth/register?callbackUrl=%2Fnotifications" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">Create account</Button>
            </Link>
          </div>
          <Link href="/search" className="mt-5 text-sm font-medium text-primary hover:underline">Keep exploring Kamba</Link>
        </CardContent>
      </Card>
    </div>
  )
}

function NotificationsContent() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">Your activity</p>
        <h2 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">Notifications</h2>
        <p className="mt-2 text-text-secondary">Order updates and important account activity will appear here.</p>
      </header>
      <Card variant="elevated">
        <CardContent className="flex flex-col items-center px-6 py-14 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Bell className="h-7 w-7" /></span>
          <h3 className="text-lg font-semibold text-text-primary">Your notifications will show here</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
            Kamba's current website API exposes notification delivery preferences, but not a notification inbox yet. We have kept this page empty rather than displaying made-up order alerts.
          </p>
          <Link href="/account?tab=settings" className="mt-5">
            <Button variant="outline">Manage notification preferences <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default function NotificationsPage() {
  const { state } = useAuth()
  if (state.isLoading) return <div className="container mx-auto min-h-[55vh] animate-pulse py-12"><div className="mx-auto h-56 max-w-xl rounded-2xl bg-ink-raised/50" /></div>
  return state.isAuthenticated ? <NotificationsContent /> : <GuestNotificationsPrompt />
}
