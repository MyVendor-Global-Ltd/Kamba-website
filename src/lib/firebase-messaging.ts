'use client'

type FirebaseMessagingCompat = {
  getToken(options: { vapidKey: string; serviceWorkerRegistration: ServiceWorkerRegistration }): Promise<string>
  deleteToken(): Promise<boolean>
  onMessage(callback: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void): () => void
}

type FirebaseMessagingFactory = (() => FirebaseMessagingCompat) & { isSupported(): Promise<boolean> }

type FirebaseCompat = {
  apps: unknown[]
  initializeApp(config: Record<string, string>): unknown
  messaging: FirebaseMessagingFactory
}

declare global {
  interface Window {
    firebase?: FirebaseCompat
  }
}

const FIREBASE_VERSION = '10.14.1'
let firebaseLoad: Promise<FirebaseCompat> | null = null

function firebaseConfig() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  }
  if (Object.values(config).some((value) => !value)) {
    throw new Error('Firebase web configuration is incomplete. Add the NEXT_PUBLIC_FIREBASE_* values to the website environment.')
  }
  return config
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`)
    if (existing?.dataset.loaded === 'true') return resolve()
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Firebase SDK could not be loaded.')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = () => reject(new Error('Firebase SDK could not be loaded. Check your connection and content-security policy.'))
    document.head.appendChild(script)
  })
}

async function getFirebase() {
  if (!firebaseLoad) {
    firebaseLoad = (async () => {
      await loadScript(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app-compat.js`)
      await loadScript(`https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-messaging-compat.js`)
      const firebase = window.firebase
      if (!firebase) throw new Error('Firebase SDK did not initialize.')
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig())
      return firebase
    })().catch((error) => {
      firebaseLoad = null
      throw error
    })
  }
  return firebaseLoad
}

export async function enableWebPush() {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    throw new Error('This browser does not support web push notifications.')
  }
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
  if (!vapidKey) throw new Error('Firebase VAPID key is missing. Add NEXT_PUBLIC_FIREBASE_VAPID_KEY to the website environment.')

  const permissionRequest = Notification.requestPermission()
  const firebase = await getFirebase()
  const supported = await firebase.messaging.isSupported()
  if (!supported) throw new Error('This browser or device does not support Firebase web push.')
  const permission = await permissionRequest
  if (permission !== 'granted') throw new Error('Notification permission was not granted.')

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
  const messaging = firebase.messaging()
  const token = await messaging.getToken({ vapidKey, serviceWorkerRegistration: registration })
  if (!token) throw new Error('Firebase did not return a push registration token.')
  return token
}

export async function disableWebPush() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
  if (!vapidKey) return null
  const firebase = await getFirebase()
  if (!(await firebase.messaging.isSupported())) return null
  const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
  if (!registration) return null
  const messaging = firebase.messaging()
  const token = await messaging.getToken({ vapidKey, serviceWorkerRegistration: registration }).catch(() => '')
  if (token) await messaging.deleteToken()
  return token || null
}

export async function listenToForegroundMessages(
  callback: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void,
) {
  const firebase = await getFirebase()
  if (!(await firebase.messaging.isSupported())) return () => {}
  return firebase.messaging().onMessage(callback)
}
