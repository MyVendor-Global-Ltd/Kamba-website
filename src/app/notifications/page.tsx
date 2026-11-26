'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, ArrowRight, LockKeyhole, CheckCheck, Package, Truck, ShieldCheck, Info, RefreshCw, X, Clock3 } from 'lucide-react'
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

function formatNotificationDate(value: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
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
  const [openedNotification, setOpenedNotification] = useState<InboxNotification | null>(null)

  const loadNotifications = useCallback(async (cursor?: string, append = false) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    setError('')
    try {
      const result = await apiJson<InboxResult>('/notifications', { params: { limit: 20, before: cursor || undefined } })
      setItems((current) => append ? [...current, ...result.notifications] : result.notifications)
      setUnreadCount(result.unread_count)
      setNextCursor(result.next_cursor)
      setHasMore(result.has_more)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load notifications.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => { void loadNotifications() }, [loadNotifications])

  useEffect(() => {
    if (!openedNotification) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenedNotification(null)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [openedNotification])

  const markRead = async (notification: InboxNotification) => {
    if (notification.read_at) return
    try {
      const saved = await apiJson<InboxNotification>('/notifications/' + encodeURIComponent(notification.id) + '/read', { method: 'PATCH' })
      setItems((current) => current.map((item) => item.id === saved.id ? saved : item))
      setOpenedNotification((current) => current?.id === saved.id ? saved : current)
      setUnreadCount((count) => Math.max(0, count - 1))
    } catch (err) {
      addToast({ type: 'error', title: 'Could not update notification', message: err instanceof Error ? err.message : 'Please try again.' })
    }
  }

  const openNotification = (notification: InboxNotification) => {
    setOpenedNotification(notification)
    void markRead(notification)
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
    <div className="mx-auto w-full max-w-4xl space-y-8 py-3 sm:space-y-10 sm:py-5">
      <header className="flex flex-col justify-between gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:pb-8">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Your activity</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">Notifications</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">Order updates and important account activity.</p>
          <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-text-tertiary"><span className="h-2 w-2 rounded-full bg-destructive" />{unreadCount} unread</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void loadNotifications()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
          <Button variant="outline" onClick={() => void markAllRead()} disabled={!unreadCount || markingAll}><CheckCheck className="mr-2 h-4 w-4" />Mark all read</Button>
        </div>
      </header>

      {error && <Card variant="elevated"><CardContent className="flex flex-col gap-3 p-5"><p className="text-sm text-text-secondary">{error}</p><Button variant="outline" onClick={() => void loadNotifications()}>Try again</Button></CardContent></Card>}

      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map((item) => <Card key={item} variant="elevated"><CardContent className="flex gap-4 p-5 sm:p-6"><div className="h-12 w-12 animate-pulse rounded-xl bg-ink-raised/60" /><div className="flex-1 space-y-3 py-1"><div className="h-4 w-1/3 animate-pulse rounded bg-ink-raised/60" /><div className="h-4 w-3/4 animate-pulse rounded bg-ink-raised/60" /></div></CardContent></Card>)}</div>
      ) : items.length ? (
        <div className="space-y-3 sm:space-y-4">
          {items.map((item) => {
            const Icon = notificationIcon(item.type)
            const unread = !item.read_at
            return (
              <Card key={item.id} variant="elevated" className={unread ? 'border-l-[3px] border-l-primary bg-primary-soft/35 shadow-sm' : 'border-l-[3px] border-l-transparent opacity-75'}>
                <CardContent className="p-0">
                  <button type="button" onClick={() => openNotification(item)} className="flex w-full min-w-0 items-start gap-3 p-4 text-left transition-colors hover:bg-ink-raised/45 focus-visible:rounded-xl sm:gap-4 sm:p-6">
                    <span className={'mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ' + (unread ? 'bg-primary-soft text-primary' : 'bg-muted text-text-tertiary')}><Icon className="h-5 w-5" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-3">
                        <span className={'break-words text-sm leading-6 ' + (unread ? 'font-bold text-text-primary' : 'font-medium text-text-secondary')}>{item.title}</span>
                        {unread && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-destructive" aria-label="Unread" />}
                      </span>
                      {item.body && <span className={'mt-1 block line-clamp-2 whitespace-pre-wrap break-words text-sm leading-6 ' + (unread ? 'text-text-secondary' : 'text-text-tertiary')}>{item.body}</span>}
                      <span className="mt-3 flex items-center gap-2 text-[11px] font-medium text-text-tertiary"><Clock3 className="h-3.5 w-3.5" />{formatNotificationDate(item.created_at)}<span className="ml-auto text-primary">Open message <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></span></span>
                    </span>
                  </button>
                </CardContent>
              </Card>
            )
          })}
          {hasMore && <div className="flex justify-center pt-4"><Button variant="outline" onClick={() => nextCursor && void loadNotifications(nextCursor, true)} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Load older notifications'}</Button></div>}
        </div>
      ) : (
        <Card variant="elevated"><CardContent className="flex flex-col items-center px-6 py-16 text-center sm:py-20">
          <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Bell className="h-7 w-7" /></span>
          <h3 className="text-lg font-semibold text-text-primary">You're all caught up</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">When there are updates about your orders, deliveries or account, they'll appear here.</p>
          <Link href="/account?tab=settings" className="mt-6"><Button variant="outline">Manage notification preferences <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </CardContent></Card>
      )}

      {openedNotification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(55,55,55,0.48)] p-4 backdrop-blur-[2px] animate-fade-in sm:p-6" onClick={() => setOpenedNotification(null)}>
          <section role="dialog" aria-modal="true" aria-labelledby="notification-dialog-title" className="notification-dialog-enter max-h-[min(88dvh,760px)] w-full max-w-2xl overscroll-contain overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-8 sm:py-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Kamba notification</p>
              <button type="button" onClick={() => setOpenedNotification(null)} aria-label="Close message" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-text-secondary hover:bg-muted hover:text-text-primary"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-5 py-7 sm:px-8 sm:py-10">
              <div className="mb-6 flex items-center gap-3 text-xs font-medium text-text-tertiary"><Clock3 className="h-4 w-4 text-primary" />{formatNotificationDate(openedNotification.created_at)}<span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">Message</span></div>
              <h2 id="notification-dialog-title" className="break-words text-2xl font-bold leading-tight tracking-tight text-text-primary sm:text-3xl">{openedNotification.title}</h2>
              <div className="mt-6 whitespace-pre-wrap break-words text-sm leading-7 text-text-secondary sm:mt-8 sm:text-base sm:leading-8">{openedNotification.body || 'There is no additional message content.'}</div>
              <div className="mt-8 border-t border-border pt-5 text-xs text-text-tertiary">{openedNotification.read_at ? 'This message has been marked as read.' : 'Opening this message marks it as read.'}</div>
            </div>
            <div className="flex justify-end border-t border-border bg-muted/35 px-5 py-4 sm:px-8"><Button onClick={() => setOpenedNotification(null)}>Close message</Button></div>
          </section>
        </div>
      )}
    </div>
  )
}

export default function NotificationsPage() {
  const { state } = useAuth()
  if (state.isLoading) return <div className="container mx-auto min-h-[55vh] animate-pulse py-12"><div className="mx-auto h-56 max-w-xl rounded-2xl bg-ink-raised/50" /></div>
  return state.isAuthenticated ? <NotificationsContent /> : <GuestNotificationsPrompt />
}
