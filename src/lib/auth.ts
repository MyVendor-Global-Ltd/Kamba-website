import { isMockMode } from '@/lib/mock-api'
import { apiJson } from '@/lib/api'

const API_BASE = (process.env.NODE_ENV === 'production' ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001')).replace(/\/$/, '')
const MOCK_USER_KEY = 'kamba_demo_user'

export type AuthInput = {
  email: string
  password: string
  confirm_password: string
  username: string
  referral_username?: string
  referral_code?: string
}

function readMockUser() {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(window.localStorage.getItem(MOCK_USER_KEY) || 'null') } catch { return null }
}
function writeMockUser(user: any) {
  if (typeof window !== 'undefined') window.localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user))
}

async function request<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || data.error || `Request failed (${res.status})`)
  return data.result ?? data
}

export async function checkUsernameAvailability(username: string) {
  if (isMockMode) return { isAvailable: true }
  return request<{ isAvailable: boolean; message?: string }>(`/auth/username-availability?username=${encodeURIComponent(username)}`)
}

export async function checkMyUsernameAvailability(username: string) {
  if (isMockMode) return { isAvailable: true }
  return request<{ isAvailable: boolean; message?: string }>(`/auth/username-availability/me?username=${encodeURIComponent(username)}`)
}

export async function login(email: string, password: string) {
  if (isMockMode) {
    if (!email.trim() || !password) throw new Error('Enter your email and password to continue.')
    const vendorDemo = email.toLowerCase() === 'vendor@kamba.demo'
    const user = { id: vendorDemo ? 'demo-vendor' : 'demo-buyer', email, username: vendorDemo ? 'demovendor' : 'demobuyer', role: vendorDemo ? 'vendor' : 'buyer', is_active: true, is_demo: true }
    writeMockUser(user)
    return { user, prototype: true }
  }
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase(), password }) })
}

export async function register(data: AuthInput) {
  if (isMockMode) {
    if (!data.email.trim() || data.password.length < 8 || data.password !== data.confirm_password) throw new Error('Enter a valid email and matching passwords of at least 8 characters.')
    const user = { id: `demo-${Date.now()}`, email: data.email, username: data.username.trim().replace(/^@/, '').toLowerCase(), role: 'buyer', is_active: true, is_demo: true }
    writeMockUser(user)
    return { user, prototype: true }
  }
  const payload = {
    email: data.email.trim().toLowerCase(),
    password: data.password,
    confirm_password: data.confirm_password,
    username: data.username.trim().replace(/^@/, '').toLowerCase(),
    ...(data.referral_username?.trim() ? { referral_username: data.referral_username.trim().replace(/^@/, '').toLowerCase() } : {}),
    ...(data.referral_code?.trim() ? { referral_code: data.referral_code.trim() } : {}),
  }
  return request('/auth/register', { method: 'POST', body: JSON.stringify(payload) })
}

export async function logout() {
  if (isMockMode) {
    if (typeof window !== 'undefined') window.localStorage.removeItem(MOCK_USER_KEY)
    return { success: true, prototype: true }
  }
  return request('/auth/logout', { method: 'POST' })
}

export async function getProfile() {
  if (isMockMode) {
    const user = readMockUser()
    if (!user) throw new Error('No development session')
    return { user, cartCount: 0, prototype: true }
  }
  const payload = await apiJson<any>('/auth/dashboard')
  const profile = payload.user || payload.result?.user || payload.result || payload
  return { user: profile, cartCount: payload.cartCount || profile.cartCount || 0 }
}

export async function requestPhoneOTP(phone: string) {
  if (isMockMode) return { userId: 'demo-phone-user', phone, requiresVerification: true, prototype: true }
  return request('/auth/phone/request', { method: 'POST', body: JSON.stringify({ phone, method: 'sms' }) })
}

export async function resendPhoneOTP() {
  if (isMockMode) return { success: true, prototype: true }
  const result = await request<{ success?: boolean; message?: string }>('/auth/phone/resend', {
    method: 'POST',
  })
  if (result.success === false) throw new Error(result.message || 'Unable to resend verification code.')
  return result
}

export async function verifyPhoneOTP(otp: string) {
  if (isMockMode) {
    if (otp !== '000000') throw new Error('For the prototype only, enter 000000. No real phone verification is performed.')
    return { success: true, prototype: true, verified: false }
  }
  return request('/auth/phone/verify', { method: 'POST', body: JSON.stringify({ otp_code: otp }) })
}

export async function forgotPassword(email: string) {
  if (isMockMode) return { success: true, prototype: true, message: 'Password reset is simulated. No email was sent.' }
  return request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase() }) })
}

export async function resetPassword(email: string, otpCode: string, newPassword: string) {
  if (isMockMode) return { success: true, prototype: true, message: 'Password reset simulated. No real account was changed.' }
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), otp_code: otpCode.trim(), new_password: newPassword }),
  })
}


export function beginGoogleSignIn() {
  if (typeof window === 'undefined') return
  window.location.assign(`${API_BASE}/api/v1/auth/google`)
}

export async function setUsername(username: string) {
  if (isMockMode) {
    const user = readMockUser()
    if (!user) throw new Error('Sign in before choosing a username.')
    writeMockUser({ ...user, username: username.trim().replace(/^@+/, '').toLowerCase() })
    return { success: true, prototype: true }
  }
  return request('/auth/username/set', {
    method: 'POST',
    body: JSON.stringify({ username: username.trim().replace(/^@+/, '').toLowerCase() }),
  })
}
