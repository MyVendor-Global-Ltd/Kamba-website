'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/ui/toast'
import { apiJson } from '@/lib/api'

interface NotificationCountResponse {
  unread_count: number
}

export function NotificationBell() {
  const { state } = useAuth()
  const { addToast } = useToast()
  const [unreadCount, setUnreadCount] = useState(0)
  const previousCount = useRef<number | null>(null)
  const userInteracted = useRef(false)
  const audioContext = useRef<AudioContext | null>(null)

  const playChime = useCallback(() => {
    if (!userInteracted.current || typeof window === 'undefined') return
    try {
      const AudioContextConstructor = window.AudioContext
      if (!AudioContextConstructor) return
      const context = audioContext.current || new AudioContextConstructor()
      audioContext.current = context
      if (context.state === 'suspended') void context.resume()
      const now = context.currentTime
      ;[880, 1174].forEach((frequency, index) => {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.type = 'sine'
        oscillator.frequency.value = frequency
        gain.gain.setValueAtTime(0.0001, now + index * 0.12)
        gain.gain.exponentialRampToValueAtTime(0.075, now + index * 0.12 + 0.025)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.12 + 0.17)
        oscillator.connect(gain)
        gain.connect(context.destination)
        oscillator.start(now + index * 0.12)
        oscillator.stop(now + index * 0.12 + 0.18)
      })
    } catch {
      // Audio is optional; the unread indicator and in-app toast remain available.
    }
  }, [])

  const refreshCount = useCallback(async () => {
    if (!state.isAuthenticated) return
    try {
      const result = await apiJson<NotificationCountResponse>('/notifications', { params: { limit: 1 } })
      const nextCount = Math.max(0, Number(result.unread_count) || 0)
      setUnreadCount(nextCount)
      if (previousCount.current !== null && nextCount > previousCount.current) {
        const difference = nextCount - previousCount.current
        addToast({
          type: 'info',
          title: difference === 1 ? 'New notification' : 'New notifications',
          message: difference === 1 ? 'You have an unread Kamba update.' : 'You have ' + difference + ' new Kamba updates.',
        })
        playChime()
      }
      previousCount.current = nextCount
    } catch {
      // Keep the last known unread count when the network is temporarily unavailable.
    }
  }, [state.isAuthenticated, addToast, playChime])

  useEffect(() => {
    const markInteraction = () => { userInteracted.current = true }
    window.addEventListener('pointerdown', markInteraction, { passive: true })
    window.addEventListener('keydown', markInteraction)
    return () => {
      window.removeEventListener('pointerdown', markInteraction)
      window.removeEventListener('keydown', markInteraction)
      if (audioContext.current && audioContext.current.state !== 'closed') void audioContext.current.close()
    }
  }, [])

  useEffect(() => {
    if (!state.isAuthenticated) {
      previousCount.current = null
      setUnreadCount(0)
      return
    }
    void refreshCount()
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refreshCount()
    }, 30000)
    const onFocus = () => { if (document.visibilityState === 'visible') void refreshCount() }
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [state.isAuthenticated, refreshCount])

  return (
    <Link
      href="/notifications"
      aria-label={unreadCount > 0 ? 'Notifications, ' + unreadCount + ' unread' : 'Notifications'}
      title={unreadCount > 0 ? unreadCount + ' unread notifications' : 'Notifications'}
      className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-ink-raised hover:text-text-primary"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5 items-center justify-center" aria-hidden="true">
          <span className="absolute h-full w-full animate-ping rounded-full bg-destructive/60" />
          <span className="relative h-2.5 w-2.5 rounded-full border-2 border-surface bg-destructive" />
        </span>
      )}
      <span className="sr-only" aria-live="polite">{unreadCount > 0 ? unreadCount + ' unread notifications' : 'No unread notifications'}</span>
    </Link>
  )
}
