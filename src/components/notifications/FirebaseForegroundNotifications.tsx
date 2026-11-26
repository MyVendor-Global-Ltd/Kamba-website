'use client'

import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/ui/toast'
import { apiJson } from '@/lib/api'
import { enableWebPush, listenToForegroundMessages } from '@/lib/firebase-messaging'

export function FirebaseForegroundNotifications() {
  const { state } = useAuth()
  const { addToast } = useToast()

  useEffect(() => {
    if (!state.isAuthenticated || typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return
    let active = true

    const syncPushToken = async () => {
      const preferences = await apiJson<{ push_enabled: boolean }>('/auth/notification-preferences')
      if (!active || preferences.push_enabled !== true) return
      const token = await enableWebPush()
      if (!active) return
      await apiJson('/notifications/devices', {
        method: 'POST',
        body: JSON.stringify({ token, platform: 'web', device_label: navigator.userAgent.slice(0, 100) }),
      })
    }

    void syncPushToken().catch(() => {
      // Token reconciliation is best-effort; account actions remain usable if push is unavailable.
    })

    return () => { active = false }
  }, [state.isAuthenticated])

  useEffect(() => {
    if (!state.isAuthenticated) return
    let unsubscribe: (() => void) | undefined
    let active = true

    void listenToForegroundMessages((payload) => {
      if (!active) return
      window.dispatchEvent(new Event('kamba:foreground-notification'))
      addToast({
        type: 'info',
        title: payload.notification?.title || 'Kamba update',
        message: payload.notification?.body || 'You have a new notification.',
      })
    }).then((stop) => {
      if (active) unsubscribe = stop
      else stop()
    }).catch(() => {
      // Push is optional until Firebase web credentials and browser support are configured.
    })

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [state.isAuthenticated, addToast])

  return null
}
