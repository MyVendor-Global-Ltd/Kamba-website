'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, ArrowRight, LockKeyhole, CheckCheck, Package, Truck, ShieldCheck, Info, RefreshCw } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { apiJson } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

interface InboxNotification {
  id: string
  type: string
  title: string
  body: string | null
  data: Record<string, unknown>
  read_at: string | null
  created_at: string
}

interface InboxResult {
  notifications: InboxNotification[]
  unread_count: number
  next_cursor: string | null
  has_more: boolean
}

function GuestNotificationsPrompt() {
  return (
    <div className="container mx-auto flex min-h-[65vh] items-center justify-center px-4 py-12">
      <Card variant="elevated" className="w-full max-w-xl">
        <CardContent className="flex flex-col items-center px-6 py-12 text-center sm:px-10">
          <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary"><LockKeyhole className="h-8 w-8" /></span>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Stay in the loop</p>
          <h1 className="mt-3 text-2xl font-bold text-text-primary sm:text-3xl">Your updates are waiting.</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-text-secondary">Sign in or create a Kamba account to see order updates, delivery news and important account activity.</p>
          <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="/auth/login?callbackUrl=%2Fnotifications" className="w-full sm:w-auto"><Button className="w-full">Sign in <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link href="/auth/register?callbackUrl=%2Fnotifications" className="w-full sm:w-auto"><Button variant="outline" className="w-full">Create account</Button></Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function notificationIcon(type: string) {
  const value = type.toLowerCase()
  if (value.includes('delivery')) return Truck
  if (value.includes('order') || value.includes('payment')) return Package
  if (value.includes('security') || value.includes('verification')) return ShieldCheck
  return Info
}

function NotificationsContent() {
  const { addToast } = useToast()
  const [items, setItems] = useState<InboxNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const [error, setError] = useState('')

  const loadNotifications = useCallback(async (cursor?: string, append = false) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    setError('')
    try {
      const result = await apiJson<InboxResult>('/notifications', {
        params: { limit: 20, before: cursor || undefined },
      })
      setItems((current) => append ? [...current, ...result.notifications] : result.notifications)
      setUnreadCount(result.unread_count)
      setNextCursor(result.next_cursor)
      setHasMore(result.has_more)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load notifications.'
      setError(message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => { void loadNotifications() }, [loadNotifications])

  const markRead = async (notification: InboxNotification) => {
    if (notification.read_at) return
    try {
      const saved = await apiJson<InboxNotification>(`/notifications/${notification.id}/read`, { method: 'PATCH' })
      setItems((current) => current.map((item) => item.id === saved.id ? saved : item))
      setUnreadCount((count) => Math.max(0, count - 1))
    } catch (err) {
      addToast({ type: 'error', title: 'Could not update notification', message: err instanceof Error ? err.message : 'Please try again.' })
    }
  }

  const markAllRead = async () => {
    if (!unreadCount || markingAll) return
    setMarkingAll(true)
    try {
      await apiJson('/notifications/read-all', { method: 'PATCH' })
      const now = new Date().toISOString()
      setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at || now })))
      setUnreadCount(0)
      addToast({ type: 'success', title: 'All caught up', message: 'All notifications have been marked as read.' })
    } catch (err) {
      addToast({ type: 'error', title: 'Could not update notifications', message: err instanceof Error ? err.message : 'Please try again.' })
    } finally {
      setMarkingAll(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Your activity</p>
          <h2 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">Notifications</h2>
          <p className="mt-2 text-text-secondary">Order updates and important account activity.</p>
          <p className="mt-2 text-sm text-text-tertiary">{unreadCount} unread</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void loadNotifications()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          <Button variant="outline" onClick={() => void markAllRead()} disabled={!unreadCount || markingAll}><CheckCheck className="mr-2 h-4 w-4" />Mark all read</Button>
        </div>
      </header>

      {error && <Card variant="elevated"><CardContent className="flex flex-col gap-3 p-5"><p className="text-sm text-text-secondary">{error}</p><Button variant="outline" onClick={() => void loadNotifications()}>Try again</Button></CardContent></Card>}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((item) => <Card key={item} variant="elevated"><CardContent className="flex gap-4 p-5"><div className="h-11 w-11 animate-pulse rounded-xl bg-ink-raised/60" /><div className="flex-1 space-y-2"><div className="h-4 w-1/3 animate-pulse rounded bg-ink-raised/60" /><div className="h-4 w-3/4 animate-pulse rounded bg-ink-raised/60" /></div></CardContent></Card>)}</div>
      ) : items.length ? (
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = notificationIcon(item.type)
            return (
              <Card key={item.id} variant="elevated" className={item.read_at ? '' : 'border-primary/30'}>
                <CardContent className="flex gap-4 p-4 sm:p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"><Icon className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="font-semibold text-text-primary">{item.title}</h3>
                      {!item.read_at && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                    </div>
                    {item.body && <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{item.body}</p>}
                    <p className="mt-3 text-xs text-text-tertiary">{new Date(item.created_at).toLocaleString()}</p>
                    {!item.read_at && <button type="button" onClick={() => void markRead(item)} className="mt-3 text-sm font-semibold text-primary hover:underline">Mark as read</button>}
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {hasMore && <div className="flex justify-center pt-3"><Button variant="outline" onClick={() => nextCursor && void loadNotifications(nextCursor, true)} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load older notifications'}</Button></div>}
        </div>
      ) : (
        <Card variant="elevated"><CardContent className="flex flex-col items-center px-6 py-14 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Bell className="h-7 w-7" /></span>
          <h3 className="text-lg font-semibold text-text-primary">You're all caught up</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">When there are updates about your orders, deliveries or account, they'll appear here.</p>
          <Link href="/account?tab=settings" className="mt-5"><Button variant="outline">Manage notification preferences <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </CardContent></Card>
      )}
    </div>
  )
}

export default function NotificationsPage() {
  const { state } = useAuth()
  if (state.isLoading) return <div className="container mx-auto min-h-[55vh] animate-pulse py-12"><div className="mx-auto h-56 max-w-xl rounded-2xl bg-ink-raised/50" /></div>
  return state.isAuthenticated ? <NotificationsContent /> : <GuestNotificationsPrompt />
}
