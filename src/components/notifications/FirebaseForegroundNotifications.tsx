'use client'

import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/ui/toast'
import { listenToForegroundMessages } from '@/lib/firebase-messaging'

export function FirebaseForegroundNotifications() {
  const { state } = useAuth()
  const { addToast } = useToast()

  useEffect(() => {
    if (!state.isAuthenticated) return
    let unsubscribe: (() => void) | undefined
    let active = true

    void listenToForegroundMessages((payload) => {
      if (!active) return
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
