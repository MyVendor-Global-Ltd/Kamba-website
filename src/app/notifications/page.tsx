'use client'

import Link from 'next/link'
import { Bell, ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

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
            <Button variant="outline">Manage notification preferences <ArrowUpRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default function NotificationsPage() {
  return <NotificationsContent />
}
