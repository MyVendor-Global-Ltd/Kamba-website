import { isMockMode } from '@/lib/mock-api'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001').replace(/\/$/, '')
const MOCK_USER_KEY = 'kamba_demo_user'

export type AuthInput = {
  email: string
  password: string
  confirm_password: string
  username: string
  referral_username?: string
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

export async function login(email: string, password: string) {
  if (isMockMode) {
    if (!email.trim() || !password) throw new Error('Enter your email and password to continue.')
    const vendorDemo = email.toLowerCase() === 'vendor@kamba.demo'
    const user = { id: vendorDemo ? 'demo-vendor' : 'demo-buyer', email, username: vendorDemo ? 'demovendor' : 'kambabuyer', role: vendorDemo ? 'vendor' : 'buyer', is_demo: true }
    writeMockUser(user)
    return { user, prototype: true }
  }
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export async function register(data: AuthInput) {
  if (isMockMode) {
    if (!data.email.trim() || data.password.length < 8) throw new Error('Use a valid email and a password with at least 8 characters.')
    if (data.password !== data.confirm_password) throw new Error('Passwords do not match.')
    const user = { id: `demo-${Date.now()}`, email: data.email, username: data.username.replace(/^@/, '').toLowerCase(), role: 'buyer', is_demo: true }
    writeMockUser(user)
    return { user, prototype: true }
  }
  return request('/auth/register', { method: 'POST', body: JSON.stringify(data) })
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
  const result = await request<any>('/auth/dashboard')
  return { user: result, cartCount: 0 }
}

export async function requestPhoneOTP(phone: string, method: 'sms' | 'whatsapp' = 'sms') {
  if (isMockMode) return { userId: 'demo-phone-user', requiresVerification: true, prototype: true }
  return request('/auth/register/phone', { method: 'POST', body: JSON.stringify({ phone, method }) })
}

export async function verifyPhoneOTP(userId: string, otpCode: string) {
  if (isMockMode) {
    if (!userId || otpCode !== '000000') throw new Error('For the prototype only, enter 000000. No real phone verification is performed.')
    return { phoneVerified: true, prototype: true }
  }
  return request('/auth/verify/phone', { method: 'POST', body: JSON.stringify({ userId, otp_code: otpCode }) })
}

export async function forgotPassword(email: string) {
  if (isMockMode) return { success: true, prototype: true, message: `Password reset is simulated for ${email}. No email was sent.` }
  return request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })
}

export async function resetPassword(email: string, otpCode: string, newPassword: string) {
  if (isMockMode) return { success: true, prototype: true, message: 'Password reset simulated. No real account was changed.' }
  return request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, otp_code: otpCode, new_password: newPassword }) })
}
