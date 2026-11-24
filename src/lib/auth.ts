import { isMockMode } from '@/lib/mock-api'
import { apiJson } from '@/lib/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9001'
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

async function readResponse(res: Response, fallback: string) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || data.error || fallback)
  return data
}

export async function login(email: string, password: string) {
  if (isMockMode) {
    if (!email.trim() || !password) throw new Error('Enter your email and password to continue.')
    const vendorDemo = email.toLowerCase() === 'vendor@kamba.demo'
    const user = { id: vendorDemo ? 'demo-vendor' : 'demo-buyer', email, username: vendorDemo ? 'demovendor' : 'demobuyer', role: vendorDemo ? 'vendor' : 'buyer', is_active: true, is_demo: true }
    writeMockUser(user)
    return { success: true, result: user, prototype: true }
  }
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
  return readResponse(res, 'Login failed')
}

export async function register(data: AuthInput) {
  if (isMockMode) {
    if (!data.email.trim() || data.password.length < 8 || data.password !== data.confirm_password) throw new Error('Enter a valid email and matching passwords of at least 8 characters.')
    const user = { id: `demo-${Date.now()}`, email: data.email, username: data.username.toLowerCase(), role: 'buyer', is_active: true, is_demo: true }
    writeMockUser(user)
    return { success: true, result: user, prototype: true }
  }
  const payload = {
    email: data.email.trim().toLowerCase(),
    password: data.password,
    confirm_password: data.confirm_password,
    username: data.username.trim().replace(/^@/, '').toLowerCase(),
    ...(data.referral_username?.trim() ? { referral_username: data.referral_username.trim().replace(/^@/, '').toLowerCase() } : {}),
    ...(data.referral_code?.trim() ? { referral_code: data.referral_code.trim() } : {}),
  }
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  return readResponse(res, 'Registration failed')
}

export async function logout() {
  if (isMockMode) {
    if (typeof window !== 'undefined') window.localStorage.removeItem(MOCK_USER_KEY)
    return { success: true, prototype: true }
  }
  const res = await fetch(`${API_BASE}/api/v1/auth/logout`, { method: 'POST', credentials: 'include' })
  return readResponse(res, 'Logout failed')
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
  if (isMockMode) return { success: true, prototype: true, message: 'Phone verification is simulated in this preview. No message was sent.' }
  const res = await fetch(`${API_BASE}/api/v1/auth/phone/request`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, method: 'sms' }) })
  return readResponse(res, 'Failed to send OTP')
}

export async function verifyPhoneOTP(otp: string) {
  if (isMockMode) {
    if (otp !== '000000') throw new Error('For the prototype only, enter 000000. No real phone verification is performed.')
    return { success: true, prototype: true, verified: false }
  }
  const res = await fetch(`${API_BASE}/api/v1/auth/phone/verify`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ otp_code: otp }) })
  return readResponse(res, 'OTP verification failed')
}

export async function forgotPassword(email: string) {
  if (isMockMode) return { success: true, prototype: true, message: 'Password reset is simulated. No email was sent.' }
  const res = await fetch(`${API_BASE}/api/v1/auth/forgot-password`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
  return readResponse(res, 'Failed to send reset link')
}

export async function resetPassword(token: string, password: string) {
  if (isMockMode) return { success: true, prototype: true, message: 'Password reset simulated. No real account was changed.' }
  const res = await fetch(`${API_BASE}/api/v1/auth/reset-password`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) })
  return readResponse(res, 'Password reset failed')
}
